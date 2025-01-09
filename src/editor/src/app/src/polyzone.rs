use std::{hash::Hasher as _, path::PathBuf};

use tauri::AppHandle;
use tokio_util::sync::CancellationToken;
use twox_hash::XxHash3_64;
use std::sync::Arc;

use crate::filesystem::{self, FsWatcherState};

pub struct PolyZoneApp {
    pub project_root: Option<PathBuf>,
    pub project_file_path: Option<PathBuf>,
    app: AppHandle,
    watch_assets_state: Option<Arc<FsWatcherState>>,
    watch_assets_cancellation_token: Option<CancellationToken>,
}

unsafe impl Send for PolyZoneApp {}
unsafe impl Sync for PolyZoneApp {}

impl PolyZoneApp {
    pub fn new(app: AppHandle) -> Self {
        log::debug!("Creating PolyZone App");
        Self {
            project_root: None,
            project_file_path: None,
            app,
            watch_assets_state: None,
            watch_assets_cancellation_token: None,
        }
    }

    pub fn load_project(&mut self, project_file_path: PathBuf) {
        // @NOTE if you create a project in the fs root, godspeed (but PolyZone will not crash)
        self.project_root = Some(project_file_path.parent().map_or_else(
            || PathBuf::new(),
            |parent| parent.to_path_buf()
        ));
        self.project_file_path = Some(project_file_path);
        log::info!("Loaded project: {:?}", self.project_root);
    }

    pub async fn unload_project(&mut self) {
        if self.project_root.is_some() {
            self.stop_watching_assets().await;
        }

        self.project_root = None;
        log::info!("Unloaded project");
    }

    pub async fn start_watching_assets(
        &mut self,
    ) {
        // Validation
        if self.project_root.is_none() {
            panic!("Cannot watch assets: No project is loaded");
        }

        // Construct shared state for file watcher
        let state = Arc::new(FsWatcherState::new(
            self.app.clone(),
            self.project_root.clone().unwrap(),
            self.project_file_path.clone().unwrap(),
        ).await);

        self.watch_assets_state = Some(state.clone());

        // Watch files in background thread
        let cancellation_token = CancellationToken::new();
        let cancellation_token_clone = cancellation_token.clone();
        tauri::async_runtime::spawn(async move {
            filesystem::watch_project_files(state, cancellation_token_clone).await;
        });
        self.watch_assets_cancellation_token = Some(cancellation_token);
    }

    pub async fn stop_watching_assets(&mut self) {
        if let Some(cancellation_token) = self.watch_assets_cancellation_token.take() {
            log::debug!("Stopping asset watcher");
            cancellation_token.cancel();
        }
    }

    pub async fn notify_project_file_updated(&mut self, data: Vec<u8>) {
        let mut hasher = XxHash3_64::new();
        hasher.write(&data);
        let result = hasher.finish();

        if let Some(state) = self.watch_assets_state.clone() {
            let mut project_file = state.project_file.lock().await;
            project_file.hash = format!("{:x}", result);
        } else {
            log::error!("Cannot update project file hash - no FSWatcher state exists");
        }
    }
}

use std::path::PathBuf;

use tauri::AppHandle;
use tokio_util::sync::CancellationToken;
use std::sync::Arc;

use crate::filesystem::{self, assets::{ProjectAsset, RawProjectAsset}, scenes::{ProjectScene, RawProjectScene}, FsWatcherState};

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
        project_assets: Vec<RawProjectAsset>,
        project_scenes: Vec<RawProjectScene>,
    ) {
        // Validation
        if self.project_root.is_none() {
            panic!("Cannot watch assets: No project is loaded");
        }

        // Convert raw types into meaningful types
        let project_assets: Vec<ProjectAsset> = project_assets.iter().map(|asset| {
            ProjectAsset::new(&asset)
        }).collect();
        let project_scenes: Vec<ProjectScene> = project_scenes.iter().map(|scene| {
            ProjectScene::new(&scene)
        }).collect();

        // Construct shared state for file watcher
        let state = Arc::new(FsWatcherState::new(
            self.app.clone(),
            self.project_root.clone().unwrap(),
            self.project_file_path.clone().unwrap(),
            project_assets,
            project_scenes,
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

    pub async fn set_path_busy(&mut self, path: PathBuf, is_busy: bool) {
        if let Some(state) = &self.watch_assets_state {
            let mut busy_paths = state.busy_paths.lock().await;
            if is_busy {
                log::debug!("Setting path as busy: {:?}", path);
                busy_paths.insert(path);
            } else {
                log::debug!("Setting path as NOT busy: {:?}", path);
                busy_paths.remove(&path);
            }
        } else {
            log::error!("[PolyZoneApp] (set_path_busy)")
        }
    }
}

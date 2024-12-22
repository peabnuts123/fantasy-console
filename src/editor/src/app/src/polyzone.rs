use std::path::PathBuf;

use tauri::AppHandle;
use tokio_util::sync::CancellationToken;

use crate::filesystem::{self, FsWatcherState, ProjectAsset, RawProjectAsset};

pub struct PolyZoneApp {
    app: AppHandle,
    pub project_root: Option<PathBuf>,
    watch_assets_cancellation_token: Option<CancellationToken>,
}

unsafe impl Send for PolyZoneApp {}
unsafe impl Sync for PolyZoneApp {}

impl PolyZoneApp {
    pub fn new(app: AppHandle) -> Self {
        log::debug!("Creating PolyZone App");
        Self {
            app,
            project_root: None,
            watch_assets_cancellation_token: None,
        }
    }

    pub fn load_project(&mut self, project_root: PathBuf) {
        self.project_root = Some(project_root);
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
    ) {
        // Validation
        if self.project_root.is_none() {
            panic!("Cannot watch assets: No project is loaded");
        }

        // Convert raw types into meaningful types
        let project_assets: Vec<ProjectAsset> = project_assets.iter().map(|asset| {
            ProjectAsset::new(&asset)
        }).collect();

        // Construct shared state for file watcher
        let state = FsWatcherState::new(
            self.app.clone(),
            self.project_root.clone().unwrap(),
            project_assets,
        ).await;

        // Watch files in background thread
        // @RESUME
        // @TODO make frontend not a mutation
        let cancellation_token = CancellationToken::new();
        let cancellation_token_clone = cancellation_token.clone();
        tauri::async_runtime::spawn(async move {
            filesystem::watch_project_assets(state, cancellation_token_clone).await;
        });
        self.watch_assets_cancellation_token = Some(cancellation_token);
    }

    pub async fn stop_watching_assets(&mut self) {
        if let Some(cancellation_token) = self.watch_assets_cancellation_token.take() {
            log::debug!("Stopping asset watcher");
            cancellation_token.cancel();
        }
    }
}
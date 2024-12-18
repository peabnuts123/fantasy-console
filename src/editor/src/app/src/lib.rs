mod build;
mod filesystem;

use std::path::PathBuf;

use build::build;
use filesystem::{FsWatcherState, ProjectAsset, RawProjectAsset};
use tauri::AppHandle;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            create_cartridge,
            watch_project_assets,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn create_cartridge(
    manifest_file_bytes: &str,
    project_root_path: &str,
    asset_paths: Vec<&str>,
    script_paths: Vec<&str>,
) -> Vec<u8> {
    let cartridge_bytes = build(
        manifest_file_bytes.as_bytes(),
        project_root_path,
        asset_paths,
        script_paths,
    );

    cartridge_bytes
}

#[tauri::command]
async fn watch_project_assets(
    project_root: &str,
    project_assets: Vec<RawProjectAsset>,
    app: AppHandle
) -> Result<String, &str> {
    // Convert raw types into meaningful types
    let project_root = PathBuf::from(project_root);
    let project_assets: Vec<ProjectAsset> = project_assets.iter().map(|asset| {
        ProjectAsset::new(&asset)
    }).collect();

    // Construct shared state for file watcher
    let state = FsWatcherState::new(
        app,
        project_root.clone(),
        project_assets,
    ).await;

    // Watch files in background thread
    tauri::async_runtime::spawn(async move {
        filesystem::watch_project_assets(state).await;
    });

    Ok(format!("Watching assets in project root: {:?}", project_root))
}

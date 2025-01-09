mod build;
mod filesystem;
mod polyzone;

use std::hash::Hasher as _;
use std::path::PathBuf;

use build::build;
use polyzone::PolyZoneApp;
use tauri::Manager;
use tauri::async_runtime::Mutex;
use twox_hash::XxHash3_64;

type PolyZoneAppState<'a> = tauri::State<'a, Mutex<PolyZoneApp>>;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.manage(
                Mutex::new(
                    PolyZoneApp::new(app.handle().clone())
                )
            );
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_log::Builder::new()
            .level(log::LevelFilter::Info)
            .level_for("fantasy_console_editor_lib", log::LevelFilter::Debug)
            .build()
        )
        .invoke_handler(tauri::generate_handler![
            create_cartridge,
            load_project,
            unload_project,
            start_watching_project_files,
            stop_watching_project_assets,
            hash_data,
            notify_project_file_updated,
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
async fn load_project(
    poly_zone_app: PolyZoneAppState::<'_>,
    project_file_path: &str,
) -> Result<(), ()> {
    let project_file_path = PathBuf::from(project_file_path);

    let mut poly_zone_app = poly_zone_app.lock().await;
    poly_zone_app.load_project(project_file_path);

    Ok(())
}

#[tauri::command]
async fn unload_project(poly_zone_app: PolyZoneAppState::<'_>) -> Result<(), ()> {
    let mut poly_zone_app = poly_zone_app.lock().await;
    poly_zone_app.unload_project().await;

    Ok(())
}

#[tauri::command]
async fn start_watching_project_files(
    poly_zone_app: PolyZoneAppState<'_>,
) -> Result<String, &str> {
    let mut poly_zone_app = poly_zone_app.lock().await;
    poly_zone_app.start_watching_assets().await;

    Ok(format!("Watching files in project root: {:?}", poly_zone_app.project_root))
}

#[tauri::command]
// @TODO Rename lol
async fn stop_watching_project_assets(poly_zone_app: PolyZoneAppState::<'_>) -> Result<(), ()>{
    let mut poly_zone_app = poly_zone_app.lock().await;
    poly_zone_app.stop_watching_assets().await;

    Ok(())
}

#[tauri::command]
fn hash_data(data: Vec<u8>) -> String {
    let mut hasher = XxHash3_64::new();
    hasher.write(&data);
    let result = hasher.finish();
    format!("{:x}", result)
}

#[tauri::command]
async fn notify_project_file_updated(
    poly_zone_app: PolyZoneAppState<'_>,
    data: Vec<u8>
) -> Result<(), ()> {
    let mut poly_zone_app = poly_zone_app.lock().await;
    poly_zone_app.notify_project_file_updated(data).await;
    Ok(())
}

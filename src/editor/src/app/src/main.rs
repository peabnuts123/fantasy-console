// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod build;

use build::build;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![create_cartridge])
        .plugin(tauri_plugin_fs_watch::init())
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

mod build;

use build::build;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![create_cartridge])
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

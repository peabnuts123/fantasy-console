use serde::{Deserialize, Serialize};
use ignore_files::IgnoreFilter;
use tauri::Emitter;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::task::JoinSet;
use tokio::time::Instant;
use uuid::Uuid;
use walkdir::WalkDir;
use super::{get_file_hash, FsWatcherState};

/// List of all file extensions that are supported asset types - Should be kept in-sync with the frontend business logic
/// @TODO Send these to the frontend for a single source of truth
const SUPPORTED_ASSET_FILE_TYPES: [&str; 17] = [
    "obj", "fbx", "gltf", "glb", "stl", "mtl", "ts", "js", "mp3", "ogg", "wav", "png", "jpg",
    "jpeg", "bmp", "basis", "dds",
];

// Types
/// An asset file on disk
pub struct AssetFile {
    pub path: PathBuf,
    pub hash: String,
}

/// A project asset as sent from the frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawProjectAsset {
    pub id: String,
    pub path: String,
    pub hash: String,
}

/// An asset associated with the project
#[derive(Debug, Clone)]
pub struct ProjectAsset {
    pub id: Uuid,
    pub path: PathBuf,
    pub hash: String,
}
impl ProjectAsset {
    pub fn new(raw: &RawProjectAsset) -> Self {
        Self {
            id: Uuid::parse_str(&raw.id).unwrap(),
            path: PathBuf::from(&raw.path),
            hash: raw.hash.clone(),
        }
    }
}


/// An event representing a change to an asset file
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum AssetFsEvent {
    /// A new (previously-unknown) asset has been added
    #[serde(rename_all = "camelCase")]
    Create { asset_id: Uuid, path: PathBuf, hash: String },
    /// A previously-known asset has been removed
    #[serde(rename_all = "camelCase")]
    Delete { asset_id: Uuid },
    /// A known asset's hash has changed
    #[serde(rename_all = "camelCase")]
    Modify { asset_id: Uuid, new_hash: String },
    /// An asset has been renamed / moved
    #[serde(rename_all = "camelCase")]
    Rename { asset_id: Uuid, new_path: PathBuf },
}


/// Perform a reconciliation of what assets are known in memory vs.
/// what assets exist on disk. Any differences will be emitted as changes.
pub async fn perform_asset_reconciliation(state: Arc<FsWatcherState>) {
    log::debug!("Performing asset reconciliation");

    let timer = Instant::now();

    let mut fs_events = Vec::<AssetFsEvent>::new();
    {
        let state_assets_locked = state.assets.lock().await;
        // Clone into a hashmap that can be mutated for quick (low complexity) diffing
        let mut unchecked_assets: HashMap<&PathBuf, &ProjectAsset> = state_assets_locked
            .iter()
            .map(|asset| (&asset.path, asset))
            .collect();

        // Scan for all files on disk
        let all_asset_files = get_all_asset_files(&state.project_root, &state.ignore_filter).await;

        // Look through list of asset files on disk to find creates / modifications
        let mut new_asset_files = Vec::<&AssetFile>::new();
        for asset_file in all_asset_files.iter() {
            // See if any known assets have the same path as the file on disk
            let known_asset = unchecked_assets.get(&asset_file.path);
            match known_asset {
                None => {
                    // File on disk matches no known asset - it is new
                    // Record new asset - will be reconciled with Deletes to detect renames
                    new_asset_files.push(asset_file);
                }
                Some(known_asset) => {
                    // File on disk matches a known asset
                    if known_asset.hash != asset_file.hash {
                        // File on disk has a different hash - it has been modified
                        // @NOTE Just create a modify event immediately - no need to reconcile
                        fs_events.push(AssetFsEvent::Modify {
                            asset_id: known_asset.id,
                            new_hash: asset_file.hash.clone(),
                        });
                    }

                    // Since we've matched a file on disk with a known asset, we
                    // know it can't be a Delete. Remove it from the list of unchecked assets
                    unchecked_assets.remove(&asset_file.path);
                }
            }
        }

        // We know that any assets left in `unchecked_assets` have not matched
        // with any assets on disk, so everything left is a Delete
        let deleted_assets = unchecked_assets.values();

        // Attempt to match any deleted assets with created assets to detect Renames
        // Any unmatched Deletes will be recorded as delete events
        // Any matched Creates will be removed from `new_asset_files`, leaving only pure Create events
        for deleted_asset in deleted_assets {
            let matching_create = new_asset_files
                .iter()
                .find(|asset_file| asset_file.hash == deleted_asset.hash);

            match matching_create {
                Some(new_asset_file) => {
                    // Matched Delete with a Create - this is a rename
                    fs_events.push(AssetFsEvent::Rename {
                        asset_id: deleted_asset.id,
                        new_path: new_asset_file.path.clone(),
                    });
                    // Remove from list of new asset files to prevent double-processing
                    new_asset_files.retain(|asset_file| asset_file.path != new_asset_file.path);
                }
                None => {
                    // Did not match any new asset files - this is a regular Delete
                    fs_events.push(AssetFsEvent::Delete {
                        asset_id: deleted_asset.id,
                    });
                }
            }
        }

        // Any remaining new asset files are Create events
        for new_asset_file in new_asset_files {
            fs_events.push(AssetFsEvent::Create {
                asset_id: Uuid::new_v4(),
                path: new_asset_file.path.clone(),
                hash: new_asset_file.hash.clone(),
            });
        }
    }

    log::debug!(
        "Asset reconciliation: '{}' events. took '{}ms'",
        fs_events.len(),
        timer.elapsed().as_millis()
    );

    if fs_events.len() > 0 {
        on_asset_fs_event(fs_events, state).await;
    }
}

/// Callback for when asset reconciliation produces fs events
async fn on_asset_fs_event(events: Vec<AssetFsEvent>, state: Arc<FsWatcherState>) {
    let mut state_assets = state.assets.lock().await;

    // Apply modifications to asset list in memory
    for event in events.iter() {
        match event {
            AssetFsEvent::Create { asset_id, path, hash } => {
                let new_asset = ProjectAsset {
                    id: asset_id.clone(),
                    path: path.clone(),
                    hash: hash.clone(),
                };
                state_assets.push(new_asset);
            }
            AssetFsEvent::Delete { asset_id } => {
                state_assets.retain(|asset| asset.id != *asset_id);
            }
            AssetFsEvent::Modify { asset_id, new_hash } => {
                let modified_asset = state_assets
                    .iter_mut()
                    .find(|asset| asset.id == *asset_id)
                    .unwrap();
                modified_asset.hash = new_hash.clone();
            }
            AssetFsEvent::Rename { asset_id, new_path } => {
                let renamed_asset = state_assets
                    .iter_mut()
                    .find(|asset| asset.id == *asset_id)
                    .unwrap();
                renamed_asset.path = new_path.clone();
            }
        }
    }

    // @DEBUG Pretty-print fs
    log::debug!("Assets:");
    for asset in state_assets.iter() {
        log::debug!(
            "{:?}",
            asset.path
        );
    }

    // Emit data to JavaScript
    const EVENT_NAME: &str = "on_project_assets_updated";
    match state.app.emit(EVENT_NAME, events.clone()) {
        Ok(_) => log::debug!("[FsWatcher] (on_notify) Emitted event `{EVENT_NAME}`"),
        Err(error) => log::error!("[FsWatcher] (on_notify) Error emitting event `{EVENT_NAME}`: {error:?}"),
    }
}

/// Find all project asset files on disk
async fn get_all_asset_files(project_root: &PathBuf, ignore_filter: &IgnoreFilter) -> Vec<AssetFile> {
    let walker = WalkDir::new(project_root).into_iter();

    // @NOTE Iterate all files as parallel as possible by spawning a new task for each file
    let mut tasks = JoinSet::new();

    for entry in walker.filter_entry(|e| {
        // Do not iterate files matched by ignore files (e.g. .gitignore, .pzignore)
        let path = e.path().to_path_buf();
        let is_ignored = ignore_filter.match_path(&path, path.is_dir()).is_ignore();
        !is_ignored
    }) {
        // Spawn a new task on JoinSet for each file
        // All tasks will be joined before returning
        tasks.spawn(async move {
            let entry = entry.unwrap();
            let path = entry.into_path();

            // Ignore directories
            if path.is_dir() {
                return None;
            }

            // Ignore unsupported files
            if !is_supported_asset_type(&path) {
                return None;
            }

            let hash = get_file_hash(&path).await;

            Some(AssetFile { path, hash })
        });
    }

    // Await all futures and extract all results
    let asset_files = tasks
        .join_all()
        .await
        .into_iter()
        .filter_map(|result| {
            match result {
                // Remove ignored results
                None => return None,
                // Strip project root from absolute paths
                Some(result) => {
                    let relative_path = result.path.strip_prefix(project_root).unwrap().to_path_buf();
                    Some(AssetFile {
                        path: relative_path,
                        hash: result.hash,
                    })
                },
            }
        })
        .collect();

    asset_files
}

/// Test whether a path has a supported asset file extension
pub fn is_supported_asset_type(path: &PathBuf) -> bool {
    let extension = path.extension();
    match extension {
        Some(extension) => {
            let extension = extension.to_str().unwrap();
            SUPPORTED_ASSET_FILE_TYPES.contains(&extension)
        }
        None => false,
    }
}

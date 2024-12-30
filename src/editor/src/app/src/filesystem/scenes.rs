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

// Constants
const SCENE_FILE_EXTENSION: &str = "pzscene";

// Types
/// An scene file on disk
pub struct SceneFile {
    pub path: PathBuf,
    pub hash: String,
}

/// A scene as sent from the frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawProjectScene {
    pub id: String,
    pub path: String,
    pub hash: String,
}

/// A scene associated with the project
#[derive(Debug, Clone)]
pub struct ProjectScene {
    pub id: Uuid,
    pub path: PathBuf,
    pub hash: String,
}
impl ProjectScene {
    pub fn new(raw: &RawProjectScene) -> Self {
        Self {
            id: Uuid::parse_str(&raw.id).unwrap(),
            path: PathBuf::from(&raw.path),
            hash: raw.hash.clone(),
        }
    }
}


/// An event representing a change to a scene file
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum SceneFsEvent {
    /// A new (previously-unknown) scene has been added
    #[serde(rename_all = "camelCase")]
    Create { scene_id: Uuid, path: PathBuf, hash: String },
    /// A previously-known scene has been removed
    #[serde(rename_all = "camelCase")]
    Delete { scene_id: Uuid },
    /// A known scene's hash has changed
    #[serde(rename_all = "camelCase")]
    Modify { scene_id: Uuid, new_hash: String },
    /// A scene has been renamed / moved
    #[serde(rename_all = "camelCase")]
    Rename { scene_id: Uuid, new_path: PathBuf },
}


/// Perform a reconciliation of what scenes are known in memory vs.
/// what scenes exist on disk. Any differences will be emitted as changes.
pub async fn perform_scene_reconciliation(state: Arc<FsWatcherState>) {
    log::debug!("Performing scene reconciliation");

    let timer = Instant::now();

    let mut fs_events = Vec::<SceneFsEvent>::new();
    {
        let state_scenes_locked = state.scenes.lock().await;
        // Clone into a hashmap that can be mutated for quick (low complexity) diffing
        let mut unchecked_scenes: HashMap<&PathBuf, &ProjectScene> = state_scenes_locked
            .iter()
            .map(|scene| (&scene.path, scene))
            .collect();

        // Scan for all files on disk
        let all_scenes = get_all_scene_files(&state.project_root, &state.ignore_filter).await;

        // Look through list of scene files on disk to find creates / modifications
        let mut new_scene_files = Vec::<&SceneFile>::new();
        for scene_file in all_scenes.iter() {
            // See if any known scenes have the same path as the file on disk
            let known_scene = unchecked_scenes.get(&scene_file.path);
            match known_scene {
                None => {
                    // File on disk matches no known scene - it is new
                    // Record new scene - will be reconciled with Deletes to detect renames
                    new_scene_files.push(scene_file);
                }
                Some(known_scene) => {
                    // File on disk matches a known scene
                    if known_scene.hash != scene_file.hash {
                        // File on disk has a different hash - it has been modified
                        // @NOTE Just create a modify event immediately - no need to reconcile
                        fs_events.push(SceneFsEvent::Modify {
                            scene_id: known_scene.id,
                            new_hash: scene_file.hash.clone(),
                        });
                    }

                    // Since we've matched a file on disk with a known scene, we
                    // know it can't be a Delete. Remove it from the list of unchecked scenes
                    unchecked_scenes.remove(&scene_file.path);
                }
            }
        }

        // We know that any scenes left in `unchecked_scenes` have not matched
        // with any scenes on disk, so everything left is a Delete
        let deleted_scenes = unchecked_scenes.values();

        // Attempt to match any deleted scenes with created scenes to detect Renames
        // Any unmatched Deletes will be recorded as delete events
        // Any matched Creates will be removed from `new_scene_files`, leaving only pure Create events
        for deleted_scene in deleted_scenes {
            let matching_create = new_scene_files
                .iter()
                .find(|scene_file| scene_file.hash == deleted_scene.hash);

            match matching_create {
                Some(new_scene_file) => {
                    // Matched Delete with a Create - this is a rename
                    fs_events.push(SceneFsEvent::Rename {
                        scene_id: deleted_scene.id,
                        new_path: new_scene_file.path.clone(),
                    });
                    // Remove from list of new scene files to prevent double-processing
                    new_scene_files.retain(|scene_file| scene_file.path != new_scene_file.path);
                }
                None => {
                    // Did not match any new scene files - this is a regular Delete
                    fs_events.push(SceneFsEvent::Delete {
                        scene_id: deleted_scene.id,
                    });
                }
            }
        }

        // Any remaining new scene files are Create events
        for new_scene_file in new_scene_files {
            fs_events.push(SceneFsEvent::Create {
                scene_id: Uuid::new_v4(),
                path: new_scene_file.path.clone(),
                hash: new_scene_file.hash.clone(),
            });
        }
    }

    log::debug!(
        "Scene reconciliation: '{}' events. took '{}ms'",
        fs_events.len(),
        timer.elapsed().as_millis()
    );

    if fs_events.len() > 0 {
        on_scene_fs_event(fs_events, state).await;
    }
}

/// Callback for when scene reconciliation produces fs events
async fn on_scene_fs_event(events: Vec<SceneFsEvent>, state: Arc<FsWatcherState>) {
    let mut state_scenes = state.scenes.lock().await;

    // Apply modifications to scene list in memory
    for event in events.iter() {
        match event {
            SceneFsEvent::Create { scene_id, path, hash } => {
                let new_scene = ProjectScene {
                    id: scene_id.clone(),
                    path: path.clone(),
                    hash: hash.clone(),
                };
                state_scenes.push(new_scene);
            }
            SceneFsEvent::Delete { scene_id } => {
                state_scenes.retain(|scene| scene.id != *scene_id);
            }
            SceneFsEvent::Modify { scene_id, new_hash } => {
                let modified_scene = state_scenes
                    .iter_mut()
                    .find(|scene| scene.id == *scene_id)
                    .unwrap();
                modified_scene.hash = new_hash.clone();
            }
            SceneFsEvent::Rename { scene_id, new_path } => {
                let renamed_scene = state_scenes
                    .iter_mut()
                    .find(|scene| scene.id == *scene_id)
                    .unwrap();
                renamed_scene.path = new_path.clone();
            }
        }
    }

    // @DEBUG Pretty-print fs
    log::debug!("Scenes:");
    for scene in state_scenes.iter() {
        log::debug!(
            "{:?}",
            scene.path
        );
    }

    // Emit data to JavaScript
    const EVENT_NAME: &str = "on_project_scenes_updated";
    match state.app.emit(EVENT_NAME, events.clone()) {
        Ok(_) => log::debug!("[FsWatcher] (on_notify) Emitted event `{EVENT_NAME}`"),
        Err(error) => log::error!("[FsWatcher] (on_notify) Error emitting event `{EVENT_NAME}`: {error:?}"),
    }
}

/// Find all scene files on disk
async fn get_all_scene_files(project_root: &PathBuf, ignore_filter: &IgnoreFilter) -> Vec<SceneFile> {
    let walker: walkdir::IntoIter = WalkDir::new(project_root).into_iter();

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
            if !is_path_scene_file(&path) {
                return None;
            }

            let hash = get_file_hash(&path).await;

            Some(SceneFile { path, hash })
        });
    }

    // Await all futures and extract all results
    let scene_files = tasks
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
                    Some(SceneFile {
                        path: relative_path,
                        hash: result.hash,
                    })
                },
            }
        })
        .collect();

    scene_files
}

/// Test whether a path is a scene file
pub fn is_path_scene_file(path: &PathBuf) -> bool {
    let extension = path.extension();
    match extension {
        Some(extension) => {
            let extension = extension.to_str().unwrap();
            extension == SCENE_FILE_EXTENSION
        }
        None => false,
    }
}

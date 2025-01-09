use serde::{Deserialize, Serialize};
use ignore_files::IgnoreFilter;
use tauri::Emitter;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::task::JoinSet;
use tokio::time::Instant;
use walkdir::WalkDir;
use super::{assets::AssetDefinition, scenes::SceneDefinition, get_file_hash, FsWatcherState};
use tokio::fs::File;
use tokio::io::AsyncReadExt;

// Constants
const PROJECT_FILE_EXTENSION: &str = "pzproj";

// Types
/// The project file
#[derive(Debug, Clone)]
pub struct ProjectFile {
    pub path: PathBuf,
    pub hash: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectManifest {
    project_name: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectDefinition {
    pub manifest: ProjectManifest,
    pub assets: Vec<AssetDefinition>,
    pub scenes: Vec<SceneDefinition>,
}

/// An event representing a change to a project file
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
enum ProjectFsEvent {
    // @NOTE Project file has no "Create" event

    /// The project file has been removed
    #[serde(rename_all = "camelCase")]
    Delete { },
    /// The project file has been modified
    #[serde(rename_all = "camelCase")]
    Modify { new_hash: String },
    /// The project file has been renamed / moved
    #[serde(rename_all = "camelCase")]
    Rename { new_path: PathBuf },
}

/// Perform a reconciliation of what's known about the project file
/// in memory vs. on disk.
pub async fn perform_project_reconciliation(state: Arc<FsWatcherState>) {
    log::debug!("Performing project reconciliation");

    let timer = Instant::now();

    let mut fs_event: Option<ProjectFsEvent> = None;
    {
        let state_project_file_locked = state.project_file.lock().await;
        let mut project_file_still_exists_on_disk = false;

        // Scan for all files on disk
        let all_project_files = get_all_project_files(&state.project_root, &state.ignore_filter).await;

        // Look through all project files on disk
        let mut new_project_files = Vec::<&ProjectFile>::new();
        for project_file in all_project_files.iter() {
            // Check if this file on disk is the same as the project file (we know and love)
            if project_file.path == state_project_file_locked.path {
                // Check if the file has changed
                if project_file.hash != state_project_file_locked.hash {
                    // File on disk has a different hash - it has been modified
                    // @NOTE Just create a modify event immediately - no need to reconcile
                    fs_event = Some(ProjectFsEvent::Modify {
                        new_hash: project_file.hash.clone(),
                    });
                }

                project_file_still_exists_on_disk = true;
            } else {
                // File on disk does not match the project file in memory
                // Record new project file - will be reconciled with Deletes to detect renames
                // but any actually new project files will just be ignored.
                new_project_files.push(project_file);
            }
        }

        // If the project file has been deleted (or moved), attempt to match
        // the file against any of the project files that DO exist on disk
        // by comparing the last-known hash of the project file with the hashes
        // of the project files on disk
        // If one of them matches, the project file will be considered Renamed
        // If nothing matches, the project file will be considered Deleted
        if !project_file_still_exists_on_disk {
            let matching_create = new_project_files
                .iter()
                .find(|project_file| project_file.hash == state_project_file_locked.hash);

            match matching_create {
                Some(project_file) => {
                    // Matched Delete with a Create - this is a rename
                    fs_event = Some(ProjectFsEvent::Rename {
                        new_path: project_file.path.clone(),
                    });
                }
                None => {
                    // Did not match any project files on disk - the project file has been deleted
                    fs_event = Some(ProjectFsEvent::Delete {});
                }
            }
        }
    }

    match fs_event {
        Some(fs_event) => {
            log::debug!(
                "Project file reconciliation: '1' event. took '{}ms'",
                timer.elapsed().as_millis()
            );
            on_project_fs_event(fs_event, state).await;
        }
        None => {
            log::debug!(
                "Project file reconciliation: '0' events. took '{}ms'",
                timer.elapsed().as_millis()
            );
        }
    }
}

/// Callback for when project reconciliation produces fs events
async fn on_project_fs_event(event: ProjectFsEvent, state: Arc<FsWatcherState>) {
    let mut state_project_file = state.project_file.lock().await;

    // Apply modifications to project file in memory
    match &event {
        ProjectFsEvent::Delete { } => {
            log::info!("[on_project_fs_event] The project file has been deleted: {:?}", state_project_file.path);
        }
        ProjectFsEvent::Modify { new_hash } => {
            state_project_file.hash = new_hash.clone();
            log::debug!("[on_project_fs_event] Project file modified: {:?}", state_project_file.path);
        }
        ProjectFsEvent::Rename { new_path } => {
            let old_path = state_project_file.path.clone();
            state_project_file.path = new_path.clone();
            log::debug!("[on_project_fs_event] Project file renamed: {:?} -> {:?}", old_path, new_path);
        }
    }

    // Emit data to JavaScript
    // Can only ever emit one event, though it is emitted as an array for convenience
    let emitted_events = vec![event.clone()];
    const EVENT_NAME: &str = "on_project_file_updated";
    match state.app.emit(EVENT_NAME, emitted_events) {
        Ok(_) => log::debug!("[on_project_fs_event] Emitted event `{EVENT_NAME}`"),
        Err(error) => log::error!("[on_project_fs_event] Error emitting event `{EVENT_NAME}`: {error:?}"),
    }
}

/// Find all project files on disk
async fn get_all_project_files(project_root: &PathBuf, ignore_filter: &IgnoreFilter) -> Vec<ProjectFile> {
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
            if !is_path_project_file(&path) {
                return None;
            }

            let hash = get_file_hash(&path).await;

            Some(ProjectFile { path, hash })
        });
    }

    // Await all futures and extract all results
    let project_files = tasks
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
                    Some(ProjectFile {
                        path: relative_path,
                        hash: result.hash,
                    })
                },
            }
        })
        .collect();

    project_files
}

pub fn is_path_project_file(path: &PathBuf) -> bool {
    let extension = path.extension();
    match extension {
        Some(extension) => {
            let extension = extension.to_str().unwrap();
            extension == PROJECT_FILE_EXTENSION
        }
        None => false,
    }
}

pub async fn read_project_definition(state: &Arc<FsWatcherState>) -> Result<ProjectDefinition, &str> {
    let project_file_path = state.project_file_absolute_path().await;
    let mut file = File::open(&project_file_path).await.map_err(|_| "Failed to open project file")?;
    let mut jsonc = String::new();
    file.read_to_string(&mut jsonc).await.map_err(|_| "Failed to read project file contents")?;

    let parsed_jsonc = jsonc_parser::parse_to_serde_value(&jsonc, &Default::default()).map_err(|_| "Failed to parse project file JSONC")?;
    match parsed_jsonc {
        Some(parse_result) => {
            let project_definition: ProjectDefinition = serde_json::from_value(parse_result).expect("Failed to convert JSONC into ProjectDefinition");
            Ok(project_definition)
        },
        None => {
            log::error!("Failed to parse project JSONC: {:?}", jsonc);
            Err("Failed to parse project JSONC")
        },
    }
}

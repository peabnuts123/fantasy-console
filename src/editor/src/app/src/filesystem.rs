pub mod assets;
pub mod project;
pub mod scenes;

use project::{read_project_definition, ProjectFile};
use debounce::EventDebouncer;
use ignore_files::{IgnoreFile, IgnoreFilter};
use notify::{recommended_watcher, RecursiveMode, Watcher};
use tauri::async_runtime::spawn;
use tauri::AppHandle;
use tokio::select;
use tokio_util::sync::CancellationToken;
use std::hash::Hasher as _;
use std::path::PathBuf;
use std::{sync::Arc, time::Duration};
use tokio::fs::File;
use tokio::io::{AsyncReadExt as _, BufReader};
use tokio::sync::Mutex;
use twox_hash::XxHash3_64;

// Constants
/// Debounce time to deduplicate successive filesystem events before re-scanning
const FS_EVENT_DEBOUNCE_DURATION: Duration = Duration::from_secs(1);
/// Path globs that are hard-coded excludes i.e. don't rely on `.pzignore` file to be ignored
const EXCLUDED_PATH_GLOBS: [&str; 4] = [
    "**/node_modules/",
    "**/.git/",
    // Explicitly whitelist project & scene files
    "!**/.pzproj",
    "!**/.pzscene",
];

/// State that is shared by filesystem watcher logic
pub struct FsWatcherState {
    project_root: PathBuf,
    pub project_file: Mutex<ProjectFile>,
    app: AppHandle,
    ignore_filter: IgnoreFilter,
}
impl FsWatcherState {
    pub async fn new(
        app: AppHandle,
        project_root: PathBuf,
        project_file_path: PathBuf,
    ) -> Self {
        // @NOTE Create ignore filter up-front meaning changes to any ignore files will not be picked up until
        // the next time the project is re-watched (generally, when the project is loaded)
        let ignore_filter = create_ignore_filter(&project_root).await;

        let project_file_name = project_file_path.strip_prefix(&project_root).unwrap().to_path_buf();
        let project_file_hash = get_file_hash(&project_file_path).await;
        let project_file = ProjectFile {
            path: project_file_name,
            hash: project_file_hash,
        };

        Self {
            app,
            project_root: project_root,
            project_file: Mutex::new(project_file),
            ignore_filter,
        }
    }

    pub async fn project_file_absolute_path(&self) -> PathBuf {
        let project_file = self.project_file.lock().await;
        self.project_root.join(&project_file.path)
    }
}

/// Begin watching files within the project root for changes.
/// Changes will be emitted back to the frontend.
pub async fn watch_project_files(state: Arc<FsWatcherState>, cancellation_token: CancellationToken) {
    log::debug!("Watching {:?}", &state.project_root);

    // Run initial reconciliations before watching
    assets::perform_asset_reconciliation(state.clone()).await;
    scenes::perform_scene_reconciliation(state.clone()).await;
    project::perform_project_reconciliation(state.clone()).await;

    // Check if cancellation occurred immediately
    if cancellation_token.is_cancelled() {
        return;
    }

    // Start watching the FS
    if let Err(error) = watch_fs(state.clone(), cancellation_token).await {
        // This only happens if watching the file system crashes / finishes
        // @TODO restart?
        log::error!("[filesystem] (watch_project_files) Error from watcher: {error:?}");
    }
}

/// Begin watching the filesystem for any changes.
/// Any changes that are relevant will trigger a reconciliation to
/// update the internal state of the application and notify the frontend
/// of any changes.
async fn watch_fs(state: Arc<FsWatcherState>, cancellation_token: CancellationToken) -> notify::Result<()> {
    // Create a channel for `notify` to communicate on
    // `notify` will transmit events on this channel
    // We will wait and receive events from it
    let (tx, mut rx) = tauri::async_runtime::channel(32);

    // Watch project root folder using `notify`
    log::info!("[FsWatcher] (watch_fs) Watching {:?}", &state.project_root);
    let mut watcher = recommended_watcher(move |event| {
        let tx = tx.clone();
        spawn(async move {
            tx.send(event).await.unwrap();
        });
    })?;

    watcher.watch(&state.project_root, RecursiveMode::Recursive)?;

    // Event debouncing
    // Only respond to fs changes after 0 events for `FS_EVENT_DEBOUNCE_DURATION` time
    let state_for_asset_debounce_callback: Arc<FsWatcherState> = state.clone();
    let asset_event_debouncer = EventDebouncer::<()>::new(FS_EVENT_DEBOUNCE_DURATION, move |_| {
        let state = state_for_asset_debounce_callback.clone();
        // Spawn background task to perform asset reconciliation
        tauri::async_runtime::spawn(async move {
            assets::perform_asset_reconciliation(state).await;
        });
    });
    let state_for_scene_debounce_callback: Arc<FsWatcherState> = state.clone();
    let scene_event_debouncer = EventDebouncer::<()>::new(FS_EVENT_DEBOUNCE_DURATION, move |_| {
        let state = state_for_scene_debounce_callback.clone();
        // Spawn background task to perform scene reconciliation
        tauri::async_runtime::spawn(async move {
            scenes::perform_scene_reconciliation(state).await;
        });
    });
    let state_for_project_file_debounce_callback: Arc<FsWatcherState> = state.clone();
    let project_file_event_debouncer = EventDebouncer::<()>::new(FS_EVENT_DEBOUNCE_DURATION, move |_| {
        let state = state_for_project_file_debounce_callback.clone();
        // Spawn background task to perform project_file reconciliation
        tauri::async_runtime::spawn(async move {
            project::perform_project_reconciliation(state).await;
        });
    });

    loop {
        // @NOTE Tokio wraps results with another layer of Result, so we must unwrap twice
        select! {
            outer_msg = rx.recv() => {
                match outer_msg {
                    Some(result) => {
                        // @NOTE Result from notify
                        match result {
                            Ok(raw_event) => {
                                log::debug!("[filesystem] (watch_fs) Received event: {:?}", raw_event);

                                // Read definitions from disk
                                // @NOTE is this too slow? We might receive a lot of events :/
                                let project_definition = match read_project_definition(&state).await {
                                    Ok(project_definition) => project_definition,
                                    Err(_) => {
                                        log::warn!("[filesystem] (watch_fs) Failed while reading project definition, skipping event");
                                        continue;
                                    },
                                };


                                let mut is_asset_event_we_care_about = false;
                                let mut is_scene_event_we_care_about = false;
                                let mut is_project_file_event_we_care_about = false;

                                // Validation
                                // @TODO At least 1 event path must any of the following:
                                //  - A prefix of any known file
                                //  - An extant file that matches the ignore filter AND is a type we care about
                                for path in raw_event.paths.iter() {
                                    let relative_path = PathBuf::from(path.strip_prefix(&state.project_root).unwrap());

                                    let is_asset_file = assets::is_supported_asset_type(path);
                                    let is_scene_file = scenes::is_path_scene_file(path);
                                    let is_project_file = project::is_path_project_file(path);

                                    if
                                        path.exists() &&
                                        !state.ignore_filter.match_path(path, path.is_dir()).is_ignore() &&
                                        // @NOTE Explicitly want to ensure we are dealing with a file here
                                        (is_asset_file || is_project_file || is_scene_file)
                                    {
                                        if is_asset_file {
                                            // Asset file changed
                                            log::debug!("[filesystem] (watch_fs) Triggering asset reconciliation. An extant file that is not matched by the ignore filter AND is an asset type we care about: {:?}", path);
                                            is_asset_event_we_care_about = true;
                                            break;
                                        } else if is_scene_file {
                                            // Scene file changed
                                            log::debug!("[filesystem] (watch_fs) Triggering scene reconciliation. An extant file that is not matched by the ignore filter AND is a scene file: {:?}", path);
                                            is_scene_event_we_care_about = true;
                                            break;
                                        } else if is_project_file {
                                            // Project file changed
                                            log::debug!("[filesystem] (watch_fs) Triggering project file reconciliation. An extant file that is not matched by the ignore filter AND is a project file: {:?}", path);
                                            is_project_file_event_we_care_about = true;
                                            break;
                                        }
                                    } else {
                                        // Check whether path is a prefix for any type of file we care about
                                        // as path may be a deleted file, or even a just a parent directory

                                        // === IS IT AN ASSET FILE? ===
                                        if project_definition.assets.iter()
                                                .any(|asset| asset.path.starts_with(&relative_path)) {
                                            // Event path is a prefix of a known asset
                                            log::debug!("[filesystem] (watch_fs) Triggering asset reconciliation. Event path is a prefix of a known asset: {:?}", relative_path);
                                            is_asset_event_we_care_about = true;
                                            break;


                                        // === IS IT A SCENE FILE? ===
                                        } else if project_definition.scenes.iter()
                                                .any(|scene| scene.path.starts_with(&relative_path)) {
                                            // Event path is a prefix of a known scene
                                            log::debug!("[filesystem] (watch_fs) Triggering scene reconciliation. Event path is a prefix of a known scene: {:?}", relative_path);
                                            is_scene_event_we_care_about = true;
                                            break;

                                        // === IS IT THE PROJECT FILE? ===
                                        } else if {
                                            let state_project_file = state.project_file.lock().await;
                                            state_project_file.path.starts_with(&relative_path)
                                        } {
                                            // Event path is a prefix of the project file (basically only possible if the project file is deleted)
                                            log::debug!("[filesystem] (watch_fs) Triggering project file reconciliation. Event path is a prefix of a known project file: {:?}", relative_path);
                                            is_project_file_event_we_care_about = true;
                                            break;

                                        // === SHRUG ¯\_(ツ)_/¯ ===
                                        } else {
                                            log::debug!("[filesystem] (watch_fs) Ignoring presumed irrelevant path: {:?}", relative_path);
                                        }
                                    }
                                }

                                if is_asset_event_we_care_about {
                                    log::debug!("[FsWatcher] (watch_fs) Triggering asset reconciliation");
                                    asset_event_debouncer.put(());
                                } else if is_scene_event_we_care_about {
                                    log::debug!("[FsWatcher] (watch_fs) Triggering scene reconciliation");
                                    scene_event_debouncer.put(());
                                } else if is_project_file_event_we_care_about {
                                    log::debug!("[FsWatcher] (watch_fs) Triggering project file reconciliation");
                                    project_file_event_debouncer.put(());
                                }
                            }
                            Err(error) => log::error!("[FsWatcher] (watch_fs) {error:?}"),
                        }
                    }
                    None => log::warn!("[filesystem] (watch_fs) Received None from notify - what does this mean?"),
                }
            }
            // Listen for cancel / stop watching signal
            _ = cancellation_token.cancelled() => {
                log::debug!("[FsWatcher] (watch_fs) Stopping watcher");
                watcher.unwatch(&state.project_root)?;
                break;
            }
        }
    }

    // @NOTE We only reach here if the watcher is stopped
    Ok(())
}

/// Create an ignore filter for testing whether paths are
/// ignored by any ignore files (e.g. .gitignore, .pzignore, etc.)
pub async fn create_ignore_filter(root_path: &PathBuf) -> IgnoreFilter {
    // Search for ignore files
    // @NOTE We have to do kind of an insane thing here:
    // We use the `ignore` crate to create a fs walker and search for various ignore files.
    // The `ignore` crate already honours ignore files so we won't iterate too many files
    //  hopefully. We then create an `IgnoreFilter` from the `ignore_files` crate
    //  which actually has an API that others can use. The `ignore` crate is singularly-purposed
    //  for the use-case of iterating files (mostly for ripgrep). It can't be meaningfully
    //  used to create an oracle for which files should be ignored by other processes.
    // We have to do this because the `ignore_files` crate's `from_origin()` function
    //  uses some types that don't play well across threads and immediately cause trouble
    //  when trying to spawn tasks that reference it.
    // So that's whey we use one ignore crate to create another.
    let mut all_ignore_files: Vec<IgnoreFile> = Vec::new();
    let mut errors = Vec::new();

    // Walker from `ignore` crate
    let mut walker_builder = ignore::WalkBuilder::new(root_path);
    walker_builder.hidden(false);
    let walker = walker_builder.build();

    // Search for various ignore files and collect into `all_ignore_files`
    for file in walker {
        match file {
            Ok(entry) => {
                match entry.file_name().to_str().unwrap() {
                    // @TODO can this go somewhere configurable
                    ".gitignore" | ".pzignore" | ".ignore" => {
                        all_ignore_files.push(IgnoreFile {
                            path: entry.clone().into_path(),
                            applies_in: Some(entry.path().parent().unwrap().to_path_buf()),
                            applies_to: None,
                        });
                    }
                    _ => {}
                }
            }
            Err(err) => {
                errors.push(err);
            }
        }
    }

    // @TODO gracefully handle failure / partial failure
    if errors.len() > 0 {
        log::error!("Errors while reading ignore files:");
        for error in errors {
            log::error!("\t{error:?}");
        }
        panic!("Could not watch filesystem due to errors reading ignore files");
    }

    // @TODO @DEBUG Remove
    if all_ignore_files.len() > 0 {
        log::debug!("Found ignore files:");
        for ignore_file in &all_ignore_files {
            log::debug!("\t{:?}", ignore_file.path);
        }
    }

    // Create filter with some additional hard-coded globs
    let mut ignore_filter = IgnoreFilter::new(root_path, &all_ignore_files)
        .await
        .unwrap();

    ignore_filter
        .add_globs(&EXCLUDED_PATH_GLOBS, Some(&PathBuf::from(prefix(root_path))))
        .unwrap();

    ignore_filter
}

/// Get the hash of a file as a string. Hash algorithm used is
/// XXH3_64bits.
pub async fn get_file_hash(path: &PathBuf) -> String {
    let file = File::open(path).await.unwrap();

    // @TODO are these constants good?
    // It's really fast, but maybe it could be faster?

    let mut buffer = [0; 4096];
    let mut reader = BufReader::new(file);
    let mut hasher = XxHash3_64::new();

    loop {
        let n = reader.read(&mut buffer).await.unwrap();
        hasher.write(&buffer[..n]);
        if n == 0 {
            break;
        }
    }

    let result = hasher.finish();
    format!("{:x}", result)
}

// @NOTE Only needed until this PR is merged: https://github.com/watchexec/watchexec/pull/908
// From watchexec source: // https://github.com/watchexec/watchexec/blob/c0b01a43a39bfbc5e4aa5a19d5791326d30cb57e/crates/ignore-files/src/filter.rs#L410
fn prefix<T: AsRef<std::path::Path>>(path: T) -> String {
    let path = path.as_ref();

    let Some(prefix) = path.components().next() else {
        return "/".into();
    };

    match prefix {
        std::path::Component::Prefix(prefix_component) => {
            prefix_component.as_os_str().to_str().unwrap_or("/").into()
        }
        _ => "/".into(),
    }
}

use debounce::EventDebouncer;
use serde::{Deserialize, Serialize};
use ignore_files::{IgnoreFile, IgnoreFilter};
use notify::{recommended_watcher, RecursiveMode, Watcher};
use tauri::async_runtime::spawn;
use tauri::{AppHandle, Emitter};
use tokio::select;
use tokio_util::sync::CancellationToken;
use std::collections::HashMap;
use std::hash::Hasher as _;
use std::path::PathBuf;
use std::{sync::Arc, time::Duration};
use tokio::fs::File;
use tokio::io::{AsyncReadExt as _, BufReader};
use tokio::sync::Mutex;
use tokio::task::JoinSet;
use tokio::time::Instant;
use twox_hash::XxHash3_64;
use uuid::Uuid;
use walkdir::WalkDir;

// Constants
/// Debounce time to deduplicate successive filesystem events before re-scanning
const EVENT_RECONCILIATION_DEBOUNCE_DURATION: Duration = Duration::from_secs(1);
/// Path globs that are hard-coded excludes i.e. don't rely on `.pzignore` file to be ignored
const EXCLUDED_PATH_GLOBS: [&str; 2] = [
    "**/node_modules/",
    "**/.git/",
];
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

/// An event representing a change to the file system
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
enum FsEvent {
    /// A new (previously-unknown) file has been added
    #[serde(rename_all = "camelCase")]
    Create { asset_id: Uuid, path: PathBuf, hash: String },
    /// A previously-known file has been removed
    #[serde(rename_all = "camelCase")]
    Delete { asset_id: Uuid },
    /// A known file's hash has changed
    #[serde(rename_all = "camelCase")]
    Modify { asset_id: Uuid, new_hash: String },
    /// The result of a pair of Create + Delete events for files with the same hash
    #[serde(rename_all = "camelCase")]
    Rename { asset_id: Uuid, new_path: PathBuf },
}

/// State that is shared by filesystem watcher logic
pub struct FsWatcherState {
    project_root: PathBuf,
    assets: Mutex<Vec<ProjectAsset>>,
    app: AppHandle,
    ignore_filter: IgnoreFilter,
}
impl FsWatcherState {
    pub async fn new(app: AppHandle, project_root: PathBuf, project_assets: Vec<ProjectAsset>) -> Self {
        // @NOTE Create ignore filter up-front meaning changes to any ignore files will not be picked up until
        // the next time the project is re-watched (generally, when the project is loaded)
        let ignore_filter = create_ignore_filter(&project_root).await;

        Self {
            project_root: project_root.clone(),
            assets: Mutex::new(project_assets.clone()),
            app,
            ignore_filter,
        }
    }
}

/// Begin watching asset files within the project root for changes.
/// Changes will be emitted back to the frontend.
pub async fn watch_project_assets(state: FsWatcherState, cancellation_token: CancellationToken) {
    log::debug!("Watching {:?}", &state.project_root);

    // Run initial full reconciliation before watching
    let state = Arc::new(state);
    perform_full_reconciliation(state.clone()).await;

    // Check if cancellation occurred immediately
    if cancellation_token.is_cancelled() {
        return;
    }

    // Start watching the FS
    if let Err(error) = watch_fs(state.clone(), cancellation_token).await {
        // This only happens if watching the file system crashes / finishes
        // @TODO restart?
        log::error!("[filesystem] (watch_project_assets) Error from watcher: {error:?}");
    }
}

/// Perform a full reconciliation of what assets are known in memory vs.
/// what assets exist on disk. Any differences will be emitted as changes.
async fn perform_full_reconciliation(state: Arc<FsWatcherState>) {
    log::debug!("Performing full reconciliation");

    let timer = Instant::now();

    let mut fs_events = Vec::<FsEvent>::new();
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
                        fs_events.push(FsEvent::Modify {
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
                    fs_events.push(FsEvent::Rename {
                        asset_id: deleted_asset.id,
                        new_path: new_asset_file.path.clone(),
                    });
                    // Remove from list of new asset files to prevent double-processing
                    new_asset_files.retain(|asset_file| asset_file.path != new_asset_file.path);
                }
                None => {
                    // Did not match any new asset files - this is regular Delete
                    fs_events.push(FsEvent::Delete {
                        asset_id: deleted_asset.id,
                    });
                }
            }
        }

        // Any remaining new asset files are Create events
        for new_asset_file in new_asset_files {
            fs_events.push(FsEvent::Create {
                asset_id: Uuid::new_v4(),
                path: new_asset_file.path.clone(),
                hash: new_asset_file.hash.clone(),
            });
        }
    }

    log::debug!(
        "Full reconciliation: '{}' events. took '{}ms'",
        fs_events.len(),
        timer.elapsed().as_millis()
    );

    if fs_events.len() > 0 {
        on_fs_event(fs_events, state).await;
    }
}

/// Begin watching the filesystem for any changes.
/// Any changes that are relevant to project asset files will
/// trigger a full reconciliation.
async fn watch_fs(state: Arc<FsWatcherState>, cancellation_token: CancellationToken) -> notify::Result<()> {
    // Create a channel for `notify` to communicate on
    // `notify` will transmit events on this channel
    // We will wait and receive events from it
    let (tx, mut rx) = tauri::async_runtime::channel(32);

    // Watch project root folder using `notify`
    log::info!("[FsWatcher] (watch_fs) Watching {:?}", &state.project_root);
    let mut watcher = recommended_watcher(move |event| {
        log::debug!("[filesystem] (watch_fs) Forwarding notify event to tokio channel: {:?}", event);
        let tx = tx.clone();
        spawn(async move {
            tx.send(event).await.unwrap();
        });
    })?;

    watcher.watch(&state.project_root, RecursiveMode::Recursive)?;

    // Event debouncing
    // Only respond to fs changes after 0 events for `EVENT_RECONCILIATION_DEBOUNCE_DURATION` time
    let state_for_debounce_callback: Arc<FsWatcherState> = state.clone();
    let debouncer = EventDebouncer::<()>::new(EVENT_RECONCILIATION_DEBOUNCE_DURATION, move |_| {
        let state = state_for_debounce_callback.clone();
        // Spawn background task to perform reconciliation
        tauri::async_runtime::spawn(async move {
            perform_full_reconciliation(state).await;
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

                                // @NOTE pessimism
                                let mut we_care_about_this_event = false;

                                // Validation
                                // @TODO At least 1 event path must any of the following:
                                //  - A prefix of any known file
                                //  - An extant file that matches the ignore filter AND is an asset type we care about
                                for path in raw_event.paths.iter() {
                                    if
                                        path.exists() &&
                                        !state.ignore_filter.match_path(path, path.is_dir()).is_ignore() &&
                                        is_supported_asset_type(path)
                                    {
                                        // An extant file that is not matched by the ignore filter AND is an asset type we care about
                                        log::debug!("[filesystem] (watch_fs) Triggering full reconciliation. An extant file that is not matched by the ignore filter AND is an asset type we care about: {:?}", path);
                                        we_care_about_this_event = true;
                                        break;
                                    } else {
                                        let relative_path = PathBuf::from(path.strip_prefix(&state.project_root).unwrap());
                                        let path_is_prefix_for_any_known_asset = {
                                            let state_assets = state.assets.lock().await;
                                            state_assets
                                                .iter()
                                                .any(|asset| asset.path.starts_with(&relative_path))
                                        };
                                        if path_is_prefix_for_any_known_asset {
                                            // Event path is a prefix of a known asset
                                            log::debug!("[filesystem] (watch_fs) Triggering full reconciliation. Event path is a prefix of a known asset: {:?}", relative_path);
                                            we_care_about_this_event = true;
                                            break;
                                        } else {
                                            log::debug!("[filesystem] (watch_fs) Ignore presumed irrelevant event: {:?}", relative_path);
                                        }
                                    }
                                }

                                if we_care_about_this_event {
                                    log::debug!("[FsWatcher] (watch_fs) Triggering full reconciliation");
                                    debouncer.put(());
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

/// Callback for when reconciliation produces fs events
async fn on_fs_event(events: Vec<FsEvent>, state: Arc<FsWatcherState>) {
    let mut state_assets = state.assets.lock().await;

    // Apply modifications to asset list in memory
    for event in events.iter() {
        match event {
            FsEvent::Create { asset_id, path, hash } => {
                let new_asset = ProjectAsset {
                    id: asset_id.clone(),
                    path: path.clone(),
                    hash: hash.clone(),
                };
                state_assets.push(new_asset);
            }
            FsEvent::Delete { asset_id } => {
                state_assets.retain(|asset| asset.id != *asset_id);
            }
            FsEvent::Modify { asset_id, new_hash } => {
                let modified_asset = state_assets
                    .iter_mut()
                    .find(|asset| asset.id == *asset_id)
                    .unwrap();
                modified_asset.hash = new_hash.clone();
            }
            FsEvent::Rename { asset_id, new_path } => {
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
pub async fn get_all_asset_files(project_root: &PathBuf, ignore_filter: &IgnoreFilter) -> Vec<AssetFile> {
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
        .add_globs(&EXCLUDED_PATH_GLOBS, Some(root_path))
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

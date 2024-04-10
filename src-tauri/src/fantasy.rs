use tauri::{
    plugin::{Builder as PluginBuilder, TauriPlugin}, RunEvent, Runtime
};

// the payload type must implement `Serialize` and `Clone`.
#[derive(Clone, serde::Serialize)]
struct Payload {
  message: String,
}

// this command can be called in the frontend using `invoke('plugin:fantasy|do_something')`.
#[tauri::command]
async fn do_something<R: Runtime>(
    window: tauri::Window<R>,
) -> Result<(), String> {
    println!("do_something command called");
    match window.emit("rambotan", Payload { message: String::from("Ramboyan!") }) {
      Err(e) => eprintln!("failed to emit event: {}", e),
      _ => (),
    }
    Ok(())
}
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    PluginBuilder::new("fantasy")
        .on_event(|_app, event| match event {
            RunEvent::Ready => {
                println!("app is ready");
            }
            RunEvent::WindowEvent { label, event, .. } => {
                println!("window {} received an event: {:?}", label, event);
            }
            _ => (),
        })
        .invoke_handler(tauri::generate_handler![do_something])
        .build()
}

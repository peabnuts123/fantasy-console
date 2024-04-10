use wasm_bindgen::prelude::*;
use web_sys::console;

#[wasm_bindgen]
pub fn greet() {
    console::log_1(&"PREMIUM FANTASY!!!".into());
}

#[wasm_bindgen]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    {
        console_error_panic_hook::set_once();
        console::warn_1(&"[DEBUG] Registered console.error panic hook".into());
    }

    console::log_1(&"Successfully initialised FantasyConsole engine".into());
}

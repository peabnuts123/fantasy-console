use wasm_bindgen::prelude::*;
use web_sys::console;

mod webgl_demo;

#[wasm_bindgen(start)]
fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    {
        console_error_panic_hook::set_once();
        console::warn_1(&"[DEBUG] Registered console.error panic hook".into());
    }

    console::log_1(&"Successfully initialised FantasyConsole engine".into());
}

#[wasm_bindgen]
pub fn run_gl_demo() {
    webgl_demo::main();
}

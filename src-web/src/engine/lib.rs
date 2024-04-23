mod example_scene;
mod types;
mod renderer;

use renderer::Renderer;
use wasm_bindgen::prelude::*;
use web_sys::console;
use types::Scene;

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
pub struct Engine {
    scene: Scene,
    renderer: Renderer,
    angle: f32,
}

/* Poorly named, I'm sorry. It was originally just an array */
#[wasm_bindgen]
impl Engine {
    #[wasm_bindgen(constructor)]
    pub fn new(canvas_width: u16, canvas_height: u16) -> Self {
        Self {
            scene: example_scene::load_scene(),
            renderer: Renderer::new(canvas_width, canvas_height),
            angle: 0.0,
        }
    }

    /// Fetch underlying frame buffer
    #[wasm_bindgen(getter, js_name = buffer)]
    pub fn buffer(&mut self) -> js_sys::Uint8ClampedArray {
        self.renderer.buffer()
    }

    /// A demo that renders a scene using a custom 3d software renderer
    fn custom_renderer(&mut self) {
        self.renderer.clear_buffers();

        // Render each mesh
        for object in &self.scene.objects {
            self.renderer.render_object(object, self.angle);
        }

        self.angle += 0.01;
    }

    /// Entrypoint to the library (lol)
    /// Fill the framebuffer with the next frame's data
    #[wasm_bindgen]
    pub fn set_image_data(&mut self) {
        self.custom_renderer();
    }
}

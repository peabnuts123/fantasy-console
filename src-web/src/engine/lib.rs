mod example_scene;
mod types;
mod renderer;
mod input;

use glam::{Vec2, Vec3};
use renderer::Renderer;
use wasm_bindgen::prelude::*;
use web_sys::console;
use types::Scene;
use input::{keycodes, InputState, RawInputState, RawKeyboardInputState, Input2D};

const CAMERA_SPEED_PER_SECOND: f32 = 5.0;

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
    scene: Option<Scene>,
    renderer: Renderer,
    angle: f32,
    raw_input_state: RawInputState,
    input_state: InputState,
}

#[wasm_bindgen]
impl Engine {
    #[wasm_bindgen(constructor)]
    pub fn new(canvas_width: u16, canvas_height: u16) -> Self {
        Self {
            scene: None,
            renderer: Renderer::new(canvas_width, canvas_height),
            angle: 0.0,
            raw_input_state: RawInputState {
                keyboard: RawKeyboardInputState {
                    up: false,
                    down: false,
                    left: false,
                    right: false,
                },
            },
            input_state: InputState {
                dpad: Input2D {
                    up: false,
                    down: false,
                    left: false,
                    right: false,
                },
            },
        }
    }

    #[wasm_bindgen]
    pub async fn load_scene(&mut self) -> Result<(), String>{
        let scene = example_scene::load_scene().await?;
        self.scene = Some(scene);
        Ok(())
    }

    /// Fetch underlying frame buffer
    #[wasm_bindgen(getter, js_name = buffer)]
    pub fn buffer(&mut self) -> js_sys::Uint8ClampedArray {
        self.renderer.buffer()
    }

    /// A demo that renders a scene using a custom 3d software renderer
    fn draw(&mut self) {
        self.renderer.clear_buffers();

        // Render each mesh
        for object in &self.scene.as_ref().unwrap().objects {
            self.renderer.render_object(object, self.angle);
        }

        self.angle += 0.01;
    }

    /// Entrypoint to the library (lol)
    /// Fill the framebuffer with the next frame's data
    #[wasm_bindgen]
    pub fn update(&mut self, dt: f32) {
        let mut camera_speed_x: f32 = 0.0;
        let mut camera_speed_z: f32 = 0.0;
        if self.input_state.dpad.right {
            camera_speed_x = camera_speed_x + CAMERA_SPEED_PER_SECOND * dt;
        }
        if self.input_state.dpad.left {
            camera_speed_x = camera_speed_x - CAMERA_SPEED_PER_SECOND * dt;
        }
        if self.input_state.dpad.down {
            camera_speed_z = camera_speed_z - CAMERA_SPEED_PER_SECOND * dt;
        }
        if self.input_state.dpad.up {
            camera_speed_z = camera_speed_z + CAMERA_SPEED_PER_SECOND * dt;
        }
        self.renderer.camera_position += Vec3::new(camera_speed_x, 0.0, camera_speed_z);

        self.draw();
    }

    #[wasm_bindgen]
    pub fn on_key_press(&mut self, key_code: u8) {
        match key_code {
            keycodes::W => self.raw_input_state.keyboard.up = true,
            keycodes::A => self.raw_input_state.keyboard.left = true,
            keycodes::S => self.raw_input_state.keyboard.down = true,
            keycodes::D => self.raw_input_state.keyboard.right = true,
            _ => console::error_1(&format!("Unknown key press: {}", key_code).into()),
        }
        self.recalculate_input_state();
    }
    #[wasm_bindgen]
    pub fn on_key_release(&mut self, key_code: u8) {
        match key_code {
            keycodes::W => self.raw_input_state.keyboard.up = false,
            keycodes::A => self.raw_input_state.keyboard.left = false,
            keycodes::S => self.raw_input_state.keyboard.down = false,
            keycodes::D => self.raw_input_state.keyboard.right = false,
            _ => console::error_1(&format!("Unknown key release: {}", key_code).into()),
        }
        self.recalculate_input_state();
    }

    fn recalculate_input_state(&mut self) {
        self.input_state.dpad.up = self.raw_input_state.keyboard.up;
        self.input_state.dpad.down = self.raw_input_state.keyboard.down;
        self.input_state.dpad.left = self.raw_input_state.keyboard.left;
        self.input_state.dpad.right = self.raw_input_state.keyboard.right;
    }
}

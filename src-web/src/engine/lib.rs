mod example_scene;
mod types;
mod renderer;
mod input;
mod web;
mod textures;

use glam::{Quat, Vec3};
use renderer::Renderer;
use wasm_bindgen::prelude::*;
use web_sys::console;
use types::Scene;
use input::{keycodes, InputState, RawInputState, Input2D};

const CAMERA_SPEED_PER_SECOND: f32 = 3.0;
const CAMERA_LOOK_SENSITIVITY: f32 = 0.005;

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
                keyboard: input::RawKeyboardInputState {
                    up: false,
                    down: false,
                    left: false,
                    right: false,
                    a: false,
                    b: false,
                },
                mouse: input::RawMouseInputState {
                    delta_x: 0.0,
                    delta_y: 0.0,
                },
            },
            input_state: InputState {
                dpad: Input2D {
                    up: false,
                    down: false,
                    left: false,
                    right: false,
                },
                a: false,
                b: false,
            },
        }
    }

    #[wasm_bindgen]
    pub async fn load_scene(&mut self) -> Result<(), String>{
        let scene = example_scene::load_scene(&mut self.renderer.texture_cache).await?;
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
    }

    /// Entrypoint to the library (lol)
    /// Fill the framebuffer with the next frame's data
    #[wasm_bindgen]
    pub fn update(&mut self, dt: f32) {
        // Camera rotation
        let mut camera_rotation_speed_yaw: f32 = 0.0;
        let mut camera_rotation_speed_pitch: f32 = 0.0;

        // @TODO @DEBUG Hard-coded mouse integration
        camera_rotation_speed_yaw = -self.raw_input_state.mouse.delta_x * CAMERA_LOOK_SENSITIVITY;
        camera_rotation_speed_pitch = -self.raw_input_state.mouse.delta_y * CAMERA_LOOK_SENSITIVITY;

        self.renderer.camera_rotation += Vec3::new(camera_rotation_speed_pitch, camera_rotation_speed_yaw, 0.0);

        // Camera movement
        let mut camera_speed_x: f32 = 0.0;
        let mut camera_speed_y: f32 = 0.0;
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
        if self.input_state.a {
            camera_speed_y = camera_speed_y - CAMERA_SPEED_PER_SECOND * dt;
        }
        if self.input_state.b {
            camera_speed_y = camera_speed_y + CAMERA_SPEED_PER_SECOND * dt;
        }

        let movement_vector = Quat::from_euler(glam::EulerRot::ZYX, -self.renderer.camera_rotation.z, -self.renderer.camera_rotation.y, -self.renderer.camera_rotation.x) *
            Vec3::new(
                camera_speed_x,
                0.0,
                camera_speed_z
            );

        self.renderer.camera_position += movement_vector + Vec3::new(0.0, camera_speed_y, 0.0);

        self.angle += 0.01;

        self.draw();
    }

    #[wasm_bindgen]
    pub fn set_mouse_value(&mut self, delta_x: f32, delta_y: f32) {
        self.raw_input_state.mouse.delta_x = delta_x;
        self.raw_input_state.mouse.delta_y = delta_y;
    }

    #[wasm_bindgen]
    pub fn on_key_press(&mut self, key_code: u8) {
        match key_code {
            keycodes::W => self.raw_input_state.keyboard.up = true,
            keycodes::A => self.raw_input_state.keyboard.left = true,
            keycodes::S => self.raw_input_state.keyboard.down = true,
            keycodes::D => self.raw_input_state.keyboard.right = true,
            keycodes::SHIFT => self.raw_input_state.keyboard.a = true,
            keycodes::SPACE => self.raw_input_state.keyboard.b = true,
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
            keycodes::SHIFT => self.raw_input_state.keyboard.a = false,
            keycodes::SPACE => self.raw_input_state.keyboard.b = false,
            _ => console::error_1(&format!("Unknown key release: {}", key_code).into()),
        }
        self.recalculate_input_state();
    }

    fn recalculate_input_state(&mut self) {
        self.input_state.dpad.up = self.raw_input_state.keyboard.up;
        self.input_state.dpad.down = self.raw_input_state.keyboard.down;
        self.input_state.dpad.left = self.raw_input_state.keyboard.left;
        self.input_state.dpad.right = self.raw_input_state.keyboard.right;
        self.input_state.a = self.raw_input_state.keyboard.a;
        self.input_state.b = self.raw_input_state.keyboard.b;
    }
}

mod example_scene;
mod renderer;
mod input;
mod web;
mod textures;
mod cartridge;
mod meshes;

use std::rc::Rc;

use glam::{Quat, Vec3};
use meshes::MeshCache;
use renderer::Renderer;
use textures::TextureCache;
use wasm_bindgen::prelude::*;
use web_sys::console;
use cartridge::{Cartridge, ComponentDefinition, Object, Scene};
use input::{keycodes, InputState, RawInputState, Input2D};

use crate::cartridge::{Component, MeshRendererComponent};

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
    cartridge: Option<Cartridge>,
    current_scene: Option<Rc::<Scene>>,
    renderer: Renderer,
    raw_input_state: RawInputState,
    input_state: InputState,
    texture_cache: TextureCache,
    mesh_cache: MeshCache,
}

#[wasm_bindgen]
impl Engine {
    #[wasm_bindgen(constructor)]
    pub fn new(canvas_width: u16, canvas_height: u16) -> Self {
        Self {
            cartridge: None,
            current_scene: None,
            renderer: Renderer::new(canvas_width, canvas_height),
            texture_cache: TextureCache::new(),
            mesh_cache: MeshCache::new(),
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
        let cartridge_def = example_scene::load_cartridge_definition().await?;

        let mut scenes = Vec::<Rc::<Scene>>::new();
        for scene_def in cartridge_def.scenes.iter() {
            let mut objects = Vec::<Object>::new();

            for object_def in scene_def.objects.iter() {
                let mut components = Vec::<Component>::new();

                for component_def in object_def.components.iter() {
                    match component_def {
                        ComponentDefinition::MeshRenderer(mesh_renderer_def) => {
                            components.push(
                                Component::MeshRenderer(
                                    MeshRendererComponent {
                                        mesh_id: self.mesh_cache.load_mesh(&mesh_renderer_def.mesh.path, &mut self.texture_cache).await?
                                    }
                                )
                            )
                        },
                    }
                }

                objects.push(
                    Object {
                        position: object_def.position,
                        rotation: object_def.rotation,
                        components,
                    }
                )
            }

            scenes.push(
                Rc::new(Scene {
                    objects,
                })
            )
        }

        let cartridge = Cartridge {
            scenes,
        };

        self.current_scene = Some(cartridge.scenes[0].clone());
        self.cartridge = Some(cartridge);

        // self.scene = Some(scene);
        Ok(())
    }

    fn get_current_scene(&self) -> Rc<Scene> {
        self.current_scene.as_ref().expect("No scene is currently loaded").clone()
    }


    /// Fetch underlying frame buffer
    #[wasm_bindgen(getter, js_name = buffer)]
    pub fn buffer(&mut self) -> js_sys::Uint8ClampedArray {
        self.renderer.buffer()
    }

    fn draw(&mut self) {
        self.renderer.clear_buffers();

        for object in self.get_current_scene().objects.iter() {
            for component in object.components.iter() {
                if let Component::MeshRenderer(mesh_renderer) = component {
                    let mesh: &cartridge::MeshAsset = self.mesh_cache.get_mesh_asset(&mesh_renderer.mesh_id);
                    self.renderer.render_mesh(object.position, mesh, &self.texture_cache);
                }
            }
        }
    }

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

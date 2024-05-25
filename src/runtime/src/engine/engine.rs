use std::{cell::RefCell, rc::Rc};
use wasm_bindgen::prelude::*;
use web_sys::console;
use glam::{Quat, Vec3};

use fantasy_core::objects::{GameObject, JsEngineObject, ObjectData};

use crate::meshes::MeshCache;
use crate::renderer::Renderer;
use crate::textures::TextureCache;
use crate::cartridge::{Cartridge, Component, ComponentDefinition, MeshRendererComponent, Object, Scene, ScriptComponent, VirtualFileType};
use fantasy_core::input::{keycodes, Input2D, InputState, RawInputState, RawKeyboardInputState, RawMouseInputState};

const CAMERA_SPEED_PER_SECOND: f32 = 3.0;
const CAMERA_LOOK_SENSITIVITY: f32 = 0.005;

#[wasm_bindgen(module = "/script-loader.ts")]
extern "C" {
    // @TODO Reference this like a class https://rustwasm.github.io/wasm-bindgen/contributing/design/importing-js-struct.html
    #[wasm_bindgen(catch)]
    fn load_module(path: String, source: String) -> Result<(), JsValue>;
    #[wasm_bindgen(catch)]
    fn bind_script_to_game_object(engineObject: JsEngineObject, scriptPath: String) -> Result<GameObject, JsValue>;
}

#[wasm_bindgen]
pub struct Engine {
    cartridge: Option<Cartridge>,
    current_scene: Option<Rc::<Scene>>,
    renderer: Renderer,
    #[wasm_bindgen(js_name="rawInputState")]
    pub raw_input_state: RawInputState,
    #[wasm_bindgen(js_name="inputState")]
    pub input_state: InputState,
    texture_cache: TextureCache,
    mesh_cache: MeshCache,
}

#[wasm_bindgen]
impl Engine {
    #[wasm_bindgen(constructor)]
    pub fn new(canvas_width: u16, canvas_height: u16) -> Self {
        #[cfg(feature = "console_error_panic_hook")]
        {
            console_error_panic_hook::set_once();
            console::warn_1(&"[DEBUG] Registered console.error panic hook".into());
        }

        Self {
            cartridge: None,
            current_scene: None,
            renderer: Renderer::new(canvas_width, canvas_height),
            texture_cache: TextureCache::new(),
            mesh_cache: MeshCache::new(),
            raw_input_state: RawInputState {
                keyboard: RawKeyboardInputState {
                    up: false,
                    down: false,
                    left: false,
                    right: false,
                    a: false,
                    b: false,
                },
                mouse: RawMouseInputState {
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

    #[wasm_bindgen(js_name="loadScene")]
    pub async fn load_scene(&mut self) -> Result<(), String>{
        let cartridge_def = crate::example_scene::load_cartridge_definition().await?;

        // Load all script files into javascript runtime
        for file in cartridge_def.files.iter() {
            if file.file_type == VirtualFileType::Script {
                load_module(
                    file.path.clone(),
                    // @NOTE pretty large clone here
                    String::from_utf8(file.bytes.clone()).expect("Could not parse script bytes"),
                ).expect("Failed to load script module");
            }
        }

        let mut scenes = Vec::<Rc::<Scene>>::new();
        for scene_def in cartridge_def.scenes.iter() {
            let mut objects = Vec::new();

            for object_def in scene_def.objects.iter() {
                let mut components = vec![];
                let object_data = Rc::new(RefCell::new(
                    ObjectData {
                        position: object_def.position,
                        rotation: object_def.rotation,
                    }
                ));

                for component_def in object_def.components.iter() {
                    match component_def {
                        ComponentDefinition::MeshRenderer(mesh_renderer_def) => {
                            let mesh_file = cartridge_def.get_file_by_id(mesh_renderer_def.mesh.file);
                            components.push(
                                Component::MeshRenderer(
                                    MeshRendererComponent {
                                        mesh_id: self.mesh_cache.load_mesh(mesh_file, &cartridge_def, &mut self.texture_cache)?
                                    }
                                )
                            )
                        },
                        ComponentDefinition::Script(script_def) => {
                            let script_file = cartridge_def.get_file_by_id(script_def.script.file);

                            let game_object_instance = bind_script_to_game_object(
                                JsEngineObject {
                                    data: object_data.clone(),
                                },
                                script_file.path.clone()
                            ).map_err(|e| format!("Failed to bind script to new game object: {:?}", e))?;

                            components.push(
                                Component::Script(
                                    ScriptComponent {
                                        game_object_instance,
                                    }
                                )
                            )
                        },
                    }
                }

                objects.push(
                    Object {
                        data: object_data,
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
            let object_data = object.data.borrow();
            for component in object.components.iter() {
                if let Component::MeshRenderer(mesh_renderer) = component {
                    let mesh = self.mesh_cache.get_mesh_asset(&mesh_renderer.mesh_id);
                    self.renderer.render_mesh(object_data.position, mesh, &self.texture_cache);
                }
            }
        }
    }

    #[wasm_bindgen]
    pub fn update(&mut self, dt: f32) {
        // Update every object in the scene
        for object in self.get_current_scene().objects.iter() {
            object.on_update(dt);
        }

        // @TODO move all this into a component script
        // Camera rotation
        let camera_rotation_speed_yaw: f32;
        let camera_rotation_speed_pitch: f32;

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

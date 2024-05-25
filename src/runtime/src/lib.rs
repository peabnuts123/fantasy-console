mod example_scene;
mod renderer;
mod input;
mod web;
mod textures;
mod cartridge;
mod meshes;

use std::{cell::RefCell, rc::Rc};

use glam::{Quat, Vec3};
use meshes::MeshCache;
use renderer::Renderer;
use textures::TextureCache;
use wasm_bindgen::prelude::*;
use web_sys::console;
use cartridge::{Cartridge, ComponentDefinition, Object, Scene, VirtualFileType};
use input::{keycodes, InputState, RawInputState, Input2D};





#[wasm_bindgen(start)]
fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    {
        console_error_panic_hook::set_once();
        console::warn_1(&"[DEBUG] Registered console.error panic hook".into());
    }

    console::log_1(&"Successfully initialised FantasyConsole engine".into());
}


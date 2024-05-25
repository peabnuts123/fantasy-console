use std::{cell::RefCell, rc::Rc};

use glam::Vec3;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(module = "/GameObject.ts")]
extern "C" {
    // @TODO can we alias this?
    pub type GameObject;

    #[wasm_bindgen(method, js_name="onUpdate")]
    pub fn on_update(this: &GameObject, deltaTime: f32);
}

#[wasm_bindgen]
pub struct JsEngineObject {
    #[wasm_bindgen(skip)]
    pub data: Rc<RefCell<ObjectData>>,
}

#[wasm_bindgen]
impl JsEngineObject {
    pub fn get_position(&self) -> JsVec3 {
        let object = self.data.borrow();
        JsVec3 {
            x: object.position.x,
            y: object.position.y,
            z: object.position.z,
        }
    }

    pub fn set_position(&self, position: JsVec3) {
        let mut object = self.data.borrow_mut();
        object.position.x = position.x;
        object.position.y = position.y;
        object.position.z = position.z;
    }
}

#[wasm_bindgen]
pub struct JsVec3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

pub struct ObjectData {
    pub position: Vec3,
    pub rotation: f32, // @TODO expressed as a 1D angle for now
}
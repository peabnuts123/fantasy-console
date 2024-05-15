use wasm_bindgen::prelude::*;

/// Set of opcodes representing each key
pub mod keycodes {
    pub const W: u8 = 0;
    pub const A: u8 = 1;
    pub const S: u8 = 2;
    pub const D: u8 = 3;
    pub const SHIFT: u8 = 4;
    pub const SPACE: u8 = 5;
}

/// Current state of all the inputs on the keyboard device
#[wasm_bindgen]
#[derive(Copy,Clone)]
pub struct RawKeyboardInputState {
    pub up: bool,
    pub down: bool,
    pub left: bool,
    pub right: bool,
    pub a: bool,
    pub b: bool,
}

#[wasm_bindgen]
#[derive(Copy,Clone)]
pub struct RawMouseInputState {
    pub delta_x: f32,
    pub delta_y: f32,
}

/// Current state of all the inputs on all the input devices.
/// This is used to compute the input state of the console
#[wasm_bindgen]
#[derive(Copy,Clone)]
pub struct RawInputState {
    pub keyboard: RawKeyboardInputState,
    pub mouse: RawMouseInputState,
}

/// An "analogue" 2D input e.g. a joystick
#[wasm_bindgen]
#[derive(Copy,Clone)]
pub struct AnalogueInput2D {
    pub x: f32,
    pub y: f32,
}

// A binary 2D input e.g. dpad or arrow keys
#[wasm_bindgen]
#[derive(Copy,Clone)]
pub struct Input2D {
    pub up: bool,
    pub down: bool,
    pub left: bool,
    pub right: bool,
}

/// State of the virtual input device
#[wasm_bindgen]
#[derive(Copy,Clone)]
pub struct InputState {
    pub dpad: Input2D,
    pub a: bool,
    pub b: bool,
}
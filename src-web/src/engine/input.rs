
/// Set of opcodes representing each key
pub mod keycodes {
    pub const W: u8 = 0;
    pub const A: u8 = 1;
    pub const S: u8 = 2;
    pub const D: u8 = 3;
}

/// Current state of all the inputs on the keyboard device
pub struct RawKeyboardInputState {
    pub up: bool,
    pub down: bool,
    pub left: bool,
    pub right: bool,
}

/// Current state of all the inputs on all the input devices.
/// This is used to compute the input state of the console
pub struct RawInputState {
    pub keyboard: RawKeyboardInputState,
}

/// An "analogue" 2D input e.g. a joystick
pub struct AnalogueInput2D {
    pub x: f32,
    pub y: f32,
}

// A binary 2D input e.g. dpad or arrow keys
pub struct Input2D {
    pub up: bool,
    pub down: bool,
    pub left: bool,
    pub right: bool,
}

/// State of the virtual input device
pub struct InputState {
    pub dpad: Input2D,
}
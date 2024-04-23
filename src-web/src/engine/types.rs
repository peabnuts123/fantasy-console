use std::rc::Rc;

use glam::Vec3;

pub type Color = [u8; 3];

pub const COLOR_WHITE: Color = [0xFF, 0xFF, 0xFF];
pub const COLOR_RED: Color = [0xFF, 0x00, 0x00];
pub const COLOR_GREEN: Color = [0x00, 0xFF, 0x00];
pub const COLOR_BLUE: Color = [0x00, 0x00, 0xFF];
pub const COLOR_CYAN: Color = [0x00, 0xFF, 0xFF];
pub const COLOR_MAGENTA: Color = [0xFF, 0x00, 0xFF];
pub const COLOR_YELLOW: Color = [0xFF, 0xFF, 0x00];

pub const COLOR_LOVELY_PINK: Color = [255, 153, 223];

pub struct Triangle {
    pub indices: [usize; 3],
    pub color: Color,
}

pub struct Mesh {
    pub vertices: Vec<Vec3>,
    pub triangles: Vec<Triangle>,
}

pub struct Object {
    pub position: Vec3,
    pub rotation: f32, // @TODO expressed as a 1D angle for now
    pub mesh: Rc<Mesh>,
}

pub struct Scene {
    pub objects: Vec<Object>,
}
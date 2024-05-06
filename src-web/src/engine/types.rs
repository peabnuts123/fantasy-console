use std::rc::Rc;

use glam::{Vec2, Vec3, Vec4};

// @TODO could probably be a struct with to_pixel and to_color or whatever
pub type Color = [f32; 3];

pub const COLOR_WHITE: Color = [1.0, 1.0, 1.0];
pub const COLOR_RED: Color = [1.0, 0.0, 0.0];
pub const COLOR_GREEN: Color = [0.0, 1.0, 0.0];
pub const COLOR_BLUE: Color = [0.0, 0.0, 1.0];
pub const COLOR_CYAN: Color = [0.0, 1.0, 1.0];
pub const COLOR_MAGENTA: Color = [1.0, 0.0, 1.0];
pub const COLOR_YELLOW: Color = [1.0, 1.0, 0.0];

pub const COLOR_LOVELY_PINK: Color = [1.0, 0.6, 0.87];

#[derive(Debug)]
pub struct Triangle {
    pub id: usize,
    pub indices: [usize; 3],
    pub color: Color,
    pub texture_index: Option<usize>,
}

pub enum VertexAxis {
    X,
    Y,
    Z,
}

#[derive(Clone,Debug)]
pub struct Vertex {
    pub pos: Vec4,
    pub normal: Option<Vec3>,
    pub texture_coord: Option<Vec2>,
}

impl Vertex {
    pub fn is_inside_frustum(&self) -> bool {
        let w_abs = self.pos.w.abs();
        self.pos.x.abs() <= w_abs &&
            self.pos.y.abs() <= w_abs &&
            self.pos.z.abs() <= w_abs
    }

    pub fn get_axis(&self, clip_axis: &VertexAxis) -> f32 {
        match clip_axis {
            VertexAxis::X => self.pos.x,
            VertexAxis::Y => self.pos.y,
            VertexAxis::Z => self.pos.z,
            _ => panic!("Invalid clip axis"),
        }
    }

    pub fn lerp(&self, other: &Vertex, lerp_amount: f32) -> Vertex {
        let pos = self.pos.lerp(other.pos, lerp_amount);
        let normal = match (&self.normal, &other.normal) {
            (Some(n1), Some(n2)) => Some(n1.lerp(*n2, lerp_amount)),
            _ => None,
        };
        let texture_coord = match (&self.texture_coord, &other.texture_coord) {
            (Some(tc1), Some(tc2)) => Some(tc1.lerp(*tc2, lerp_amount)),
            _ => None,
        };
        Vertex { pos, normal, texture_coord }
    }
}

pub struct Mesh {
    pub vertices: Vec<Vertex>,
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
use std::rc::Rc;

use glam::{Vec2, Vec3, Vec4};

use crate::{meshes::MeshAssetId, renderer::Color, textures::TextureAssetId};

pub struct CartridgeDefinition {
    pub scenes: Vec<SceneDefinition>,
    // @TODO files? virtual file system?
}

pub struct SceneDefinition {
    pub objects: Vec<ObjectDefinition>,
}

pub struct ObjectDefinition {
    pub position: Vec3,
    pub rotation: f32, // @TODO expressed as a 1D angle for now
    pub components: Vec<ComponentDefinition>,
}

pub enum ComponentDefinition {
    MeshRenderer(MeshRendererComponentDefinition),
    // @TODO
    // Script(ScriptComponentDefinition),
}

pub struct MeshRendererComponentDefinition {
    pub mesh: MeshAssetReference,
}

pub struct ScriptComponentDefinition {
    pub script: ScriptAssetReference,
}

pub struct MeshAssetReference {
    pub path: String,  // @TODO ID? usize?
}

pub struct ScriptAssetReference {
    pub path: String, // @TODO ID? usize?
}

pub struct Cartridge {
    pub scenes: Vec<Rc::<Scene>>,
}

pub struct Scene {
    pub objects: Vec<Object>,
}

pub struct Object {
    pub position: Vec3,
    pub rotation: f32, // @TODO expressed as a 1D angle for now
    pub components: Vec<Component>,
}

pub enum Component {
    MeshRenderer(MeshRendererComponent),
    // Script(ScriptComponent),
}

pub struct MeshRendererComponent {
    pub mesh_id: MeshAssetId,
}

pub struct ScriptComponent {
    pub source: Rc::<ScriptAsset>,
}

pub struct ScriptAsset {
    pub source: String,
}

pub struct MeshAsset {
    pub vertices: Vec<Vertex>,
    pub triangles: Vec<Triangle>,
}

#[derive(Clone,Debug)]
pub struct Triangle {
    pub id: usize,
    pub indices: [usize; 3],
    pub color: Color,
    pub texture_id: Option<TextureAssetId>,
    pub normal: Vec3,
}

pub enum VertexAxis {
    X,
    Y,
    Z,
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


#[derive(Clone,Debug)]
pub struct Vertex {
    pub pos: Vec4,
    pub normal: Option<Vec3>,
    pub texture_coord: Option<Vec2>,
}

use std::{cell::RefCell, path::{Path, PathBuf}, rc::Rc};

use glam::{Vec2, Vec3, Vec4};
use wasm_bindgen::prelude::*;

use crate::{meshes::MeshAssetId, renderer::Color, textures::TextureAssetId, web};

#[wasm_bindgen(module = "/src/engine/engine.ts")]
extern "C" {
    // @TODO can we alias this?
    pub type GameObject;

    #[wasm_bindgen(method)]
    fn on_update(this: &GameObject, deltaTime: f32);
}



pub struct CartridgeDefinition {
    pub scenes: Vec<SceneDefinition>,
    // @TODO probably this should be its own struct for things to borrow individually
    pub files: Vec<VirtualFile>,
}

impl CartridgeDefinition {
    pub fn get_file_by_id(&self, VirtualFileId(id): VirtualFileId) -> &VirtualFile {
        self.files.iter().find(|file| file.id == id).expect(format!("No file found with id '{id}'").as_str())
    }
    pub fn get_file_by_path(&self, path: String) -> &VirtualFile {
        let canonical_path = self.canonicalise_path(path);
        self.files.iter().find(|file| file.path == canonical_path).expect(format!("No file found with path '{canonical_path}'").as_str())
    }

    fn canonicalise_path(&self, path: String) -> String {
        Path::new(&path).iter().fold(PathBuf::new(), |mut path, segment| {
            if segment == ".." {
                if path.pop() == false {
                    panic!("Couldn't resolve parent reference (..) in path")
                }
                path
            } else {
                path.join(segment)
            }
        }).to_str().unwrap().to_string()
    }
}

#[derive(Copy,Clone,Debug)]
pub struct VirtualFileId(pub usize);

#[derive(Eq, PartialEq)]
pub enum VirtualFileType {
    Model,
    Script,
    Texture,
}

pub struct VirtualFile {
    pub id: usize,
    pub file_type: VirtualFileType,
    pub path: String,
    pub bytes: Vec<u8>,
}

impl VirtualFile {
    pub async fn new(id: usize, file_type: VirtualFileType, path: String) -> Self {
        let bytes = web::get_file_data(format!("/{path}")).await.expect("Failed to get file data");
        Self {
            id,
            file_type,
            path,
            bytes,
        }
    }
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
    Script(ScriptComponentDefinition),
}

pub struct MeshRendererComponentDefinition {
    pub mesh: MeshAssetReference,
}

pub struct ScriptComponentDefinition {
    pub script: ScriptAssetReference,
}

pub struct MeshAssetReference {
    pub file: VirtualFileId,
}

pub struct ScriptAssetReference {
    pub file: VirtualFileId,
}

pub struct Cartridge {
    pub scenes: Vec<Rc<Scene>>,
}

pub struct Scene {
    pub objects: Vec<Object>,
}

pub struct ObjectData {
    pub position: Vec3,
    pub rotation: f32, // @TODO expressed as a 1D angle for now
}

pub struct Object {
    pub data: Rc<RefCell<ObjectData>>,
    pub components: Vec<Component>,
}

impl Object {
    pub fn on_update(&self, delta_time: f32) {
        for component in self.components.iter() {
            match component {
                Component::Script(script) => {
                    script.on_update(delta_time);
                },
                _ => ()
            }
        }
    }
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

pub enum Component {
    MeshRenderer(MeshRendererComponent),
    Script(ScriptComponent),
}

pub struct MeshRendererComponent {
    pub mesh_id: MeshAssetId,
}

pub struct ScriptComponent {
    pub game_object_instance: GameObject,
}

impl ScriptComponent {
    pub fn on_update(&self, delta_time: f32) {
        self.game_object_instance.on_update(delta_time);
    }
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

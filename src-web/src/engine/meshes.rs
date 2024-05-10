use std::{collections::HashMap, path::PathBuf};

use glam::{Vec2, Vec3, Vec4};
use tobj::LoadError;
use web_sys::console;

use crate::{cartridge::{MeshAsset, Triangle, Vertex}, textures::{TextureAssetId, TextureCache}, web};

#[derive(Copy,Clone,Debug)]
pub struct MeshAssetId(usize);

pub struct MeshCache {
    path_to_index: HashMap<String, usize>,
    meshes: Vec<MeshAsset>,
}

impl MeshCache {
    pub fn new() -> MeshCache {
        MeshCache {
            path_to_index: HashMap::new(),
            meshes: Vec::new(),
        }
    }

    pub fn get_mesh_asset(&self, MeshAssetId(id): &MeshAssetId) -> &MeshAsset {
        &self.meshes[*id]
    }

    pub async fn load_mesh(&mut self, obj_path: &String, texture_cache: &mut TextureCache) -> Result<MeshAssetId, String> {
        if self.path_to_index.contains_key(obj_path) {
            return Ok(MeshAssetId(*self.path_to_index.get(obj_path).unwrap()))
        }

        // @NOTE Rust shenanigans ?
        let _path_buf = PathBuf::new().join(obj_path.clone());
        let obj_folder = _path_buf.parent().unwrap();
        let obj_bytes = web::get_file_data(obj_path.clone()).await?;
        let obj_data_result = tobj::load_obj_buf_async(
                &mut obj_bytes.as_slice(),
                &tobj::GPU_LOAD_OPTIONS,
                |mtl_path: String| {
                    // @NOTE resolve `mtl_path` relative to the folder that the obj lives in
                    let data_path: String = obj_folder.join(mtl_path).to_str().unwrap().to_string();
                    async {
                        let mtl_data: Result<Vec<u8>, String> = web::get_file_data(data_path).await;
                        match mtl_data {
                            Ok(data) => tobj::load_mtl_buf(&mut data.as_slice()),
                            // Return LoadError
                            Err(e) => {
                                console::error_1(&format!("Failed to load mtl data: {}", e).into());
                                Err(LoadError::OpenFileFailed)
                            },
                        }
                    }
                }
            ).await;

        if obj_data_result.is_err() {
            return Err(format!("Failed to load obj: {:?}", obj_data_result.err()));
        }

        let (obj_models, obj_materials_result) = obj_data_result.unwrap();
        let obj_materials = obj_materials_result.expect("Materials failed to load");

        let mut vertices: Vec<Vertex> = Vec::new();
        let mut triangles: Vec<Triangle> = Vec::new();
        for model_index in 0..obj_models.len() {
            let model = &obj_models[model_index];
            let index_offset = vertices.len();

            // @TODO assumption that all meshes have a material.
            let material_index = model.mesh.material_id.expect(format!("Model {model_index} has no material for file: {obj_path}").as_str());
            let material: &tobj::Material = &obj_materials[material_index];
            let color_diffuse = material.diffuse.unwrap_or([1.0, 1.0, 1.0]);

            /* Material diffuse texture */
            let mut texture_id_diffuse: Option<TextureAssetId> = None;
            if let Some(texture) = &material.diffuse_texture {
                let texture_path = obj_folder.join(texture).to_str().unwrap().to_string();
                texture_id_diffuse = Some(texture_cache.load_texture(texture_path).await?);
            }

            /* Vertex data */
            let has_normals = !model.mesh.normals.is_empty();
            let has_texture_coords = !model.mesh.texcoords.is_empty();
            for i in (0..model.mesh.positions.len()).step_by(3) {
                let triangle_index: usize = i / 3;
                vertices.push(
                    Vertex {
                        pos: Vec4::new(
                            model.mesh.positions[i],
                            model.mesh.positions[i+1],
                            model.mesh.positions[i+2],
                            1.0
                        ),
                        normal: match has_normals {
                            true => Some(Vec3::new(
                                model.mesh.normals[i],
                                model.mesh.normals[i+1],
                                model.mesh.normals[i+2],
                            )),
                            false => None,
                        },
                        texture_coord: match has_texture_coords {
                            true => Some(Vec2::new(
                                // @TODO Why is the model mirrored?
                                (model.mesh.texcoords[triangle_index * 2]),
                                -(model.mesh.texcoords[triangle_index * 2 + 1]),
                            )),
                            false => None,
                        }
                    }
                )
            }

            /* Triangle data */
            for i in (0..model.mesh.indices.len()).step_by(3) {
                let triangle_index = triangles.len();

                let indices = [
                    // 👀 flip normals
                    (model.mesh.indices[i + 2] as usize) + index_offset,
                    (model.mesh.indices[i + 1] as usize) + index_offset,
                    (model.mesh.indices[i] as usize) + index_offset,
                ];

                let vertices = [
                    &vertices[indices[0]],
                    &vertices[indices[1]],
                    &vertices[indices[2]],
                ];

                triangles.push(
                    Triangle {
                        id: triangle_index,
                        indices,
                        // @NOTE for flat shading
                        normal: (vertices[2].pos - vertices[0].pos).truncate()
                            .cross(
                                (vertices[1].pos - vertices[0].pos).truncate()
                            ).normalize(),
                        color: color_diffuse,
                        texture_id: texture_id_diffuse,
                    }
                );
            }

            web_sys::console::log_1(&format!("Model {model_index} has {} vertices, {} triangles", model.mesh.positions.len(), model.mesh.indices.len() / 3).into());
        }

        console::log_1(&format!("Loaded {} vertices and {} triangles", vertices.len(), triangles.len()).into());

        let next_index = self.meshes.len();
        self.path_to_index.insert(obj_path.clone(), next_index);
        self.meshes.push(MeshAsset {
            vertices,
            triangles,
        });

        Ok(MeshAssetId(next_index))
    }
}

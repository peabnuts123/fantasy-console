use std::{f32::consts::PI, rc::Rc};

use glam::Vec3;
use js_sys::{Math, Uint8Array};
use tobj::LoadError;
use wasm_bindgen::prelude::*;
use web_sys::console;

use crate::types::{
    Object,
    Scene,
    Mesh,
    Triangle,
    COLOR_LOVELY_PINK,
};

#[wasm_bindgen(module = "/src/engine/util.ts")]
extern "C" {
    #[wasm_bindgen(catch)]
    async fn get_resource(url: String) -> Result<JsValue, JsValue>;
}

const MODEL_URI_BASE: &str = "/models";
const MODEL_RESOURCE: &str = "burgerCheese.obj";

async fn get_file_data(url: String) -> Result<Vec<u8>, String> {
    let result: Result<JsValue, JsValue> = get_resource(url).await;
    if result.is_ok() {
        let data: Vec<u8> = result.unwrap().dyn_into::<Uint8Array>().expect("Could not convert response").to_vec();
        Ok(data)
    } else {
        Err("Failed to load resource".to_string())
    }
}

pub async fn load_scene() -> Result<Scene, String> {
    let obj_bytes = get_file_data(format!("{}/{}", MODEL_URI_BASE, MODEL_RESOURCE)).await?;
    let obj_data_result = tobj::load_obj_buf_async(
            &mut obj_bytes.as_slice(),
            &tobj::GPU_LOAD_OPTIONS,
            |mtl_path| {
                let data_path = format!("{}/{}", MODEL_URI_BASE, &mtl_path);
                async {
                    let mtl_data: Result<Vec<u8>, String> = get_file_data(data_path).await;
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

    let mut vertices: Vec<Vec3> = Vec::new();
    let mut triangles: Vec<Triangle> = Vec::new();
    for i_model in 0..obj_models.len() {
        let model = &obj_models[i_model];
        let index_offset = vertices.len();

        // @TODO assumption that all meshes have a material.
        let material = &obj_materials[model.mesh.material_id.unwrap()];
        let color = material.diffuse.map_or(COLOR_LOVELY_PINK, |diffuse| {
            [
                (diffuse[0] * 255.0) as u8,
                (diffuse[1] * 255.0) as u8,
                (diffuse[2] * 255.0) as u8,
            ]
        });

        vertices.extend(
            model.mesh.positions.chunks_exact(3)
                .map(|chunk| Vec3 {
                    x: chunk[0],
                    y: chunk[1],
                    z: chunk[2],
                })
        );
        triangles.extend(
            model.mesh.indices.chunks_exact(3)
                .map(|chunk| Triangle {
                    indices: [
                        // 👀
                        (chunk[2] as usize) + index_offset,
                        (chunk[1] as usize) + index_offset,
                        (chunk[0] as usize) + index_offset,
                    ],
                    color,
                })
        );
    }

    console::log_1(&format!("Loaded {} vertices and {} triangles", vertices.len(), triangles.len()).into());

    let mesh = Rc::new(Mesh {
        vertices,
        triangles,
    });

    let num_objects = 25;
    let mut scene = Scene {
        objects: Vec::with_capacity(num_objects),
    };

    let scene_origin: Vec3 = Vec3::new(0.0, 0.0, 5.0);

    let variance = 3.5;
    let variance_offset = variance / 2.0;
    for _ in 0..num_objects {
        scene.objects.push(Object {
            position: Vec3::new(
                (Math::random() * variance - variance_offset) as f32,
                (Math::random() * variance - variance_offset) as f32,
                (Math::random() * variance - variance_offset) as f32
            ) + scene_origin,
            rotation: Math::random() as f32 * PI,
            mesh: mesh.clone(),
        });
    }

    Ok(scene)
}
use std::rc::Rc;

use glam::{Vec2, Vec3, Vec4};
use tobj::LoadError;
use web_sys::console;

use crate::{
    textures::TextureCache, types::{
        Mesh, Object, Scene, Triangle, Vertex, COLOR_BLUE, COLOR_CYAN, COLOR_GREEN, COLOR_LOVELY_PINK, COLOR_MAGENTA, COLOR_RED, COLOR_WHITE, COLOR_YELLOW
    }, web
};

const MODEL_URI_BASE: &str = "/models";
const MODEL_RESOURCE: &str = "kitchen.obj";
// const MODEL_RESOURCE: &str = "burgerCheese.obj";
// const MODEL_RESOURCE: &str = "detailDumpster_closed.obj";

async fn load_obj(path: String, texture_cache: &mut TextureCache, scale: f32) -> Result<Mesh, String> {
    let obj_bytes = web::get_file_data(path).await?;
    let obj_data_result = tobj::load_obj_buf_async(
            &mut obj_bytes.as_slice(),
            &tobj::GPU_LOAD_OPTIONS,
            |mtl_path: String| {
                let data_path = format!("{}/{}", MODEL_URI_BASE, &mtl_path);
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
        let material_index = model.mesh.material_id.expect("Mesh has no material");
        let material: &tobj::Material = &obj_materials[material_index];
        let color_diffuse = material.diffuse.unwrap_or([1.0, 1.0, 1.0]);

        /* Material diffuse texture */
        let mut texture_index_diffuse: Option<usize> = None;
        if let Some(texture) = &material.diffuse_texture {
            web_sys::console::log_1(&format!("Loading texture: {}", texture).into());
            texture_index_diffuse = Some(texture_cache.load_texture(format!("{MODEL_URI_BASE}/{texture}")).await?);
        }

        /* Vertex data */
        let has_normals = !model.mesh.normals.is_empty();
        web_sys::console::log_1(&format!("Mesh {model_index} has normals: {}", model.mesh.normals.len()).into());
        let has_texture_coords = !model.mesh.texcoords.is_empty();
        for i in (0..model.mesh.positions.len()).step_by(3) {
            let triangle_index: usize = i / 3;
            vertices.push(
                Vertex {
                    pos: Vec4::new(
                        model.mesh.positions[i] * scale,
                        model.mesh.positions[i+1] * scale,
                        model.mesh.positions[i+2] * scale,
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
                            (model.mesh.texcoords[triangle_index * 2])/* .rem_euclid(1.0) */,
                            -(model.mesh.texcoords[triangle_index * 2 + 1])/* .rem_euclid(1.0) */,
                        )),
                        false => None,
                    }
                }
            )
        }

        /* Triangle data */
        for i in (0..model.mesh.indices.len()).step_by(3) {
            let triangle_index = triangles.len();

            triangles.push(
                Triangle {
                    id: triangle_index,
                    indices: [
                        // 👀
                        (model.mesh.indices[i + 2] as usize) + index_offset,
                        (model.mesh.indices[i + 1] as usize) + index_offset,
                        (model.mesh.indices[i] as usize) + index_offset,
                    ],
                    // color: COLOR_WHITE,
                    color: color_diffuse,
                    texture_index: texture_index_diffuse,
                }
            );
        }
    }

    console::log_1(&format!("Loaded {} vertices and {} triangles", vertices.len(), triangles.len()).into());

    Ok(Mesh {
        vertices,
        triangles,
    })
}

pub async fn load_scene(texture_cache: &mut TextureCache) -> Result<Scene, String> {
    /* Loaded OBJ mesh */
    let obj_path = format!("{MODEL_URI_BASE}/{MODEL_RESOURCE}").to_string();
    let mesh = Rc::new(load_obj(obj_path, texture_cache, 1.0).await?);

    /* Single triangle */
    // let triangle_scale = 5.0;
    // let texture_index = texture_cache.load_texture(format!("{MODEL_URI_BASE}/Textures/wall.png")).await?;
    // let mesh = Rc::new(Mesh {
    //     vertices : vec![
    //         Vertex { pos: Vec4::new(-1.0, -1.0, 0.0, 1.0) * triangle_scale, normal: None, texture_coord: Some(Vec2::new(0.0, 0.0)) },
    //         Vertex { pos: Vec4::new(1.0, -1.0, 0.0, 1.0) * triangle_scale, normal: None, texture_coord: Some(Vec2::new(1.0, 0.0)) },
    //         Vertex { pos: Vec4::new(0.0, 1.0, 0.0, 1.0) * triangle_scale, normal: None, texture_coord: Some(Vec2::new(0.5, 1.0)) },
    //     ],
    //     triangles: vec![
    //         Triangle {
    //             id: 0,
    //             indices: [0, 1, 2],
    //             color: COLOR_WHITE,
    //             texture_index: Some(texture_index),
    //         },
    //     ],
    // });

    // Big cube
    // let cube_size: f32 = 1.0;
    // let mesh = Rc::new(Mesh {
    //     vertices: vec![
    //         Vertex { pos: Vec4::new(-cube_size, cube_size, cube_size, 1.0), normal: None, texture_coord: None },
    //         Vertex { pos: Vec4::new(-cube_size, cube_size, -cube_size, 1.0), normal: None, texture_coord: None },
    //         Vertex { pos: Vec4::new(cube_size, cube_size, -cube_size, 1.0), normal: None, texture_coord: None },
    //         Vertex { pos: Vec4::new(cube_size, cube_size, cube_size, 1.0), normal: None, texture_coord: None },
    //         Vertex { pos: Vec4::new(-cube_size, -cube_size, cube_size, 1.0), normal: None, texture_coord: None },
    //         Vertex { pos: Vec4::new(-cube_size, -cube_size, -cube_size, 1.0), normal: None, texture_coord: None },
    //         Vertex { pos: Vec4::new(cube_size, -cube_size, -cube_size, 1.0), normal: None, texture_coord: None },
    //         Vertex { pos: Vec4::new(cube_size, -cube_size, cube_size, 1.0), normal: None, texture_coord: None },
    //     ],
    //     triangles: vec![
    //         /* OUTWARDS BOX */
    //         // TOP
    //         Triangle { id: 0, indices: [0, 1, 2], color: COLOR_RED, texture_index: None },
    //         Triangle { id: 1, indices: [0, 2, 3], color: COLOR_RED, texture_index: None },
    //         // FRONT
    //         Triangle { id: 2, indices: [1, 5, 6], color: COLOR_GREEN, texture_index: None },
    //         Triangle { id: 3, indices: [1, 6, 2], color: COLOR_GREEN, texture_index: None },
    //         // RIGHT
    //         Triangle { id: 4, indices: [2, 6, 7], color: COLOR_BLUE, texture_index: None },
    //         Triangle { id: 5, indices: [2, 7, 3], color: COLOR_BLUE, texture_index: None },
    //         // BACK
    //         Triangle { id: 6, indices: [3, 7, 4], color: COLOR_MAGENTA, texture_index: None },
    //         Triangle { id: 7, indices: [3, 4, 0], color: COLOR_MAGENTA, texture_index: None },
    //         // LEFT
    //         Triangle { id: 8, indices: [0, 4, 5], color: COLOR_YELLOW, texture_index: None },
    //         Triangle { id: 9, indices: [0, 5, 1], color: COLOR_YELLOW, texture_index: None },
    //         // BOTTOM
    //         Triangle { id: 10, indices: [4, 7, 6], color: COLOR_CYAN, texture_index: None },
    //         Triangle { id: 11, indices: [4, 6, 5], color: COLOR_CYAN, texture_index: None },

    //         /* INWARDS BOX */
    //         // // TOP
    //         // Triangle { id: 0, indices: [0, 2, 1], color: COLOR_RED, texture_index: None },
    //         // Triangle { id: 1, indices: [0, 3, 2], color: COLOR_RED, texture_index: None },
    //         // // FRONT
    //         // Triangle { id: 2, indices: [1, 6, 5], color: COLOR_GREEN, texture_index: None },
    //         // Triangle { id: 3, indices: [1, 2, 6], color: COLOR_GREEN, texture_index: None },
    //         // // RIGHT
    //         // Triangle { id: 4, indices: [2, 7, 6], color: COLOR_BLUE, texture_index: None },
    //         // Triangle { id: 5, indices: [2, 3, 7], color: COLOR_BLUE, texture_index: None },
    //         // // BACK
    //         // Triangle { id: 6, indices: [3, 4, 7], color: COLOR_MAGENTA, texture_index: None },
    //         // Triangle { id: 7, indices: [3, 0, 4], color: COLOR_MAGENTA, texture_index: None },
    //         // // LEFT
    //         // Triangle { id: 8, indices: [0, 5, 4], color: COLOR_YELLOW, texture_index: None },
    //         // Triangle { id: 9, indices: [0, 1, 5], color: COLOR_YELLOW, texture_index: None },
    //         // // BOTTOM
    //         // Triangle { id: 10, indices: [4, 6, 7], color: COLOR_CYAN, texture_index: None },
    //         // Triangle { id: 11, indices: [4, 5, 6], color: COLOR_CYAN, texture_index: None },
    //     ]
    // });




    let mut scene = Scene {
        objects: Vec::new(),
    };

    let scene_origin: Vec3 = Vec3::new(0.0, 0.0, 0.0);

    // Randomly generated objects
    // let num_objects = 4000;
    // let variance: f64 = (num_objects as f64) / 150.0;
    // let variance_offset = variance / 2.0;
    // let scene_origin: Vec3 = Vec3::new(0.0, 0.0, variance as f32);
    // for _ in 0..num_objects {
    //     scene.objects.push(Object {
    //         position: Vec3::new(
    //             (Math::random() * variance - variance_offset) as f32,
    //             (Math::random() * variance - variance_offset) as f32,
    //             (Math::random() * variance - variance_offset) as f32
    //         ) + scene_origin,
    //         rotation: Math::random() as f32 * PI,
    //         mesh: mesh.clone(),
    //     });
    // }
    // console::log_1(&format!("{} objects, {} total triangles", num_objects, num_objects * mesh.triangles.len()).into());

    // @NOTE single object at `scene_origin`
    scene.objects.push(Object {
        position: scene_origin,
        rotation: 0.0,
        mesh: mesh.clone(),
    });

    Ok(scene)
}
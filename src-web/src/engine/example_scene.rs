
use std::{f32::consts::PI, rc::Rc};

use glam::Vec3;
use js_sys::Math;
use crate::types::{
    Object,
    Scene,
    Mesh,
    Triangle,
    COLOR_LOVELY_PINK,
};

pub fn load_scene() -> Scene {
    let mesh = Rc::new(Mesh {
        vertices: vec![
            Vec3::new(-1.0, 1.0, 1.0),
            Vec3::new(-1.0, 1.0, -1.0),
            Vec3::new(1.0, 1.0, -1.0),
            Vec3::new(1.0, 1.0, 1.0),
            Vec3::new(-1.0, -1.0, 1.0),
            Vec3::new(-1.0, -1.0, -1.0),
            Vec3::new(1.0, -1.0, -1.0),
            Vec3::new(1.0, -1.0, 1.0),
        ],
        triangles: vec![
            // TOP
            // Triangle { indices: [0, 1, 2], color: COLOR_RED, },
            // Triangle { indices: [0, 2, 3], color: COLOR_RED, },
            // FRONT
            // Triangle { indices: [1, 5, 6], color: COLOR_GREEN, },
            // Triangle { indices: [1, 6, 2], color: COLOR_GREEN, },
            // RIGHT
            // Triangle { indices: [2, 6, 7], color: COLOR_BLUE, },
            // Triangle { indices: [2, 7, 3], color: COLOR_BLUE, },
            // BACK
            // Triangle { indices: [3, 7, 4], color: COLOR_CYAN, },
            // Triangle { indices: [3, 4, 0], color: COLOR_CYAN, },
            // LEFT
            // Triangle { indices: [0, 4, 5], color: COLOR_MAGENTA, },
            // Triangle { indices: [0, 5, 1], color: COLOR_MAGENTA, },
            // BOTTOM
            // Triangle { indices: [4, 7, 6], color: COLOR_YELLOW, },
            // Triangle { indices: [4, 6, 5], color: COLOR_YELLOW, },

            /* Box - Single colour */
            // TOP
            Triangle { indices: [0, 1, 2], color: COLOR_LOVELY_PINK, },
            Triangle { indices: [0, 2, 3], color: COLOR_LOVELY_PINK, },
            // FRONT
            Triangle { indices: [1, 5, 6], color: COLOR_LOVELY_PINK, },
            Triangle { indices: [1, 6, 2], color: COLOR_LOVELY_PINK, },
            // RIGHT
            Triangle { indices: [2, 6, 7], color: COLOR_LOVELY_PINK, },
            Triangle { indices: [2, 7, 3], color: COLOR_LOVELY_PINK, },
            // BACK
            Triangle { indices: [3, 7, 4], color: COLOR_LOVELY_PINK, },
            Triangle { indices: [3, 4, 0], color: COLOR_LOVELY_PINK, },
            // LEFT
            Triangle { indices: [0, 4, 5], color: COLOR_LOVELY_PINK, },
            Triangle { indices: [0, 5, 1], color: COLOR_LOVELY_PINK, },
            // BOTTOM
            Triangle { indices: [4, 7, 6], color: COLOR_LOVELY_PINK, },
            Triangle { indices: [4, 6, 5], color: COLOR_LOVELY_PINK, },
        ],
    });

    let num_objects = 40;
    let mut scene = Scene {
        objects: Vec::with_capacity(num_objects),
    };

    let scene_origin: Vec3 = Vec3::new(0.0, 0.0, 35.0);

    let variance = 25.0;
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

    scene
}
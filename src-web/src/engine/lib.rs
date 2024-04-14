
use std::{
    cmp::{max, min},
    f32::consts::PI,
};

use glam::{FloatExt, Quat, Vec3};
use js_sys::Math;
use wasm_bindgen::prelude::*;
use web_sys::console;

mod webgl_demo;

const CAMERA_FOV_V: f32 = 50.0 * PI / 180.0;
const CAMERA_NEAR: f32 = 0.1;

const LIGHT_ANGLE: Vec3 = Vec3::new(1.0, 1.0, -2.0);
const CUBE_POSITION: Vec3 = Vec3::new(0.0, 0.0, 35.0);
const VERTICES: [Vec3; 8] = [
    /* Simple triangle */
    // Vec3::new(0.0, 0.5, 1.0),
    // Vec3::new(-0.5, -0.25, 1.0),
    // Vec3::new(0.5, -0.25, 1.0),

    /* Fourth vertex for second (inverted) triangle */
    // Vec3::new(1.0, 0.5, 1.0),

    /* Second triangle (behind first) */
    // Vec3::new(0.5, 0.5, 1.5),
    // Vec3::new(0.0, -0.25, 1.5),
    // Vec3::new(1.0, -0.25, 1.5),

    /* Box coordinates */
    Vec3::new(-1.0, 1.0, 1.0),
    Vec3::new(-1.0, 1.0, -1.0),
    Vec3::new(1.0, 1.0, -1.0),
    Vec3::new(1.0, 1.0, 1.0),
    Vec3::new(-1.0, -1.0, 1.0),
    Vec3::new(-1.0, -1.0, -1.0),
    Vec3::new(1.0, -1.0, -1.0),
    Vec3::new(1.0, -1.0, 1.0),
];

pub type Color = [u8; 3];
struct Triangle {
    indices: [usize; 3],
    color: Color,
}

const COLOR_WHITE: Color = [0xFF, 0xFF, 0xFF];
const COLOR_RED: Color = [0xFF, 0x00, 0x00];
const COLOR_GREEN: Color = [0x00, 0xFF, 0x00];
const COLOR_BLUE: Color = [0x00, 0x00, 0xFF];
const COLOR_CYAN: Color = [0x00, 0xFF, 0xFF];
const COLOR_MAGENTA: Color = [0xFF, 0x00, 0xFF];
const COLOR_YELLOW: Color = [0xFF, 0xFF, 0x00];

const COLOR_LOVELY_PINK: Color = [255, 153, 223];

/* Array of triangles the will get rendered */
const TRIANGLES: [Triangle; 12] = [
    /* Simple triangle */
    // Triangle {
    //     indices: [0, 1, 2],
    //     color: [0xFF, 0x00, 0x00],
    // },
    /* Second (inverted) triangle */
    // Triangle {
    //     // indices: [0, 2, 3],
    //     indices: [3, 4, 5],
    //     color: [0x00, 0xFF, 0x00],
    // },

    /* Box - Coloured */
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
];

/* Clear color for the screen */
const CLEAR_COLOR: Color = [
    // 0x87, 0xCE, 0xEB, // Sky Blue
    0xFF, 0xFF, 0xFF, // White
];

/* Mesh that will get rendered, defined by TRIANGLES */
struct Mesh {
    position: Vec3,
    angle_offset: f32,
}

#[wasm_bindgen(start)]
fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    {
        console_error_panic_hook::set_once();
        console::warn_1(&"[DEBUG] Registered console.error panic hook".into());
    }

    console::log_1(&"Successfully initialised FantasyConsole engine".into());
}

#[wasm_bindgen]
pub fn run_gl_demo() {
    webgl_demo::main();
}

#[wasm_bindgen]
pub struct WasmUint8Array {
    canvas_width: u16,
    canvas_height: u16,
    pixel_data: Vec<u8>,
    depth_data: Vec<f32>,
    offset: u16,
    angle: f32,
    meshes: Vec<Mesh>,
}

/* Poorly named, I'm sorry. It was originally just an array */
#[wasm_bindgen]
impl WasmUint8Array {
    #[wasm_bindgen(constructor)]
    pub fn new(canvas_width: u16, canvas_height: u16) -> Self {
        // Generate N random positions for meshes to be drawn at
        let num_meshes = 40;
        let mut meshes = Vec::with_capacity(num_meshes);
        let variance = 25.0;
        let variance_offset = variance / 2.0;
        for _ in 0..num_meshes {
            meshes.push(Mesh {
                position: Vec3::new(
                    (Math::random() * variance - variance_offset) as f32,
                    (Math::random() * variance - variance_offset) as f32,
                    (Math::random() * variance - variance_offset) as f32
                ) + CUBE_POSITION,
                angle_offset: Math::random() as f32 * PI,
            });
        }

        Self {
            canvas_width,
            canvas_height,
            pixel_data: vec![0; (canvas_width as usize) * (canvas_height as usize) * 4 /* rgba */],
            depth_data: vec![0.0; (canvas_width as usize) * (canvas_height as usize)],
            offset: 0,
            angle: 0.0,
            meshes,
        }
    }

    /// Fetch underlying frame buffer
    #[wasm_bindgen(getter, js_name = buffer)]
    pub fn buffer(&mut self) -> js_sys::Uint8ClampedArray {
        unsafe {
            js_sys::Uint8ClampedArray::view_mut_raw(
                self.pixel_data.as_mut_ptr(),
                self.pixel_data.len(),
            )
        }
    }

    /// Fill the frame buffer with a rainbow pattern
    fn rainbow_demo(&mut self) {
        let mut x: u16 = 0;
        let mut y: u16 = 0;
        let mut i: usize = 0;
        let pixel_data_len = self.pixel_data.len();
        let offset = self.offset;
        while i < pixel_data_len {
            self.pixel_data[i] = (x + offset) as u8;
            self.pixel_data[i + 1] = (y + offset) as u8;
            self.pixel_data[i + 2] = (i + offset as usize) as u8;

            x += 1;
            if x >= self.canvas_width {
                x = 0;
                y += 1;
            }
            i += 4;
        }
        self.offset += 1;
    }

    /// Draw the mesh defined in `TRIANGLES` at position defined in mesh struct
    /// with index `mesh_index`
    fn render_mesh(&mut self, mesh_index: usize) {
        let mesh = &self.meshes[mesh_index];
        let canvas_w = self.canvas_width as f32;
        let canvas_h = self.canvas_height as f32;
        let camera_fov_h_half = CAMERA_FOV_V * canvas_w / canvas_h / 2.0;
        let camera_fov_v_half = CAMERA_FOV_V / 2.0;
        let near_plane_width_half = CAMERA_NEAR * camera_fov_h_half.tan();
        let near_plane_height_half = CAMERA_NEAR * camera_fov_v_half.tan();

        let rotation_point = mesh.position;
        let spin = Quat::from_rotation_y(self.angle + mesh.angle_offset) * Quat::from_rotation_x((self.angle + mesh.angle_offset) / 4.0);

        for triangle_index in 0..TRIANGLES.len() {
            let triangle = &TRIANGLES[triangle_index];
            let mut v0 = VERTICES[triangle.indices[0]] + mesh.position;
            let mut v1 = VERTICES[triangle.indices[1]] + mesh.position;
            let mut v2 = VERTICES[triangle.indices[2]] + mesh.position;

            // Apply rotation to vertices
            v0 = spin * (v0 - rotation_point) + rotation_point;
            v1 = spin * (v1 - rotation_point) + rotation_point;
            v2 = spin * (v2 - rotation_point) + rotation_point;

            // Rendering calculations based on
            // https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/ray-triangle-intersection-geometric-solution.html

            let edge0 = v1 - v0;
            let edge1 = v2 - v1;
            let edge2 = v0 - v2;

            let triangle_normal = edge0.cross(v2 - v0).normalize();
            let triangle_plane_distance = -triangle_normal.dot(v0);
            // Arbitrary set minimum to 20%
            let lightness = 0.2_f32.max(LIGHT_ANGLE.angle_between(triangle_normal) / PI);

            // Calculate triangle bounds on screen (so as to not render the entire screen for every triangle)
            let v0_screen = self.vertex_position_on_screen(v0, near_plane_width_half, near_plane_height_half);
            let v1_screen = self.vertex_position_on_screen(v1, near_plane_width_half, near_plane_height_half);
            let v2_screen = self.vertex_position_on_screen(v2, near_plane_width_half, near_plane_height_half);

            // Add 1 pixel to ensure triangle is fully rendered (since coordinates are just getting truncated, not rounded)
            let triangle_bounds_min = [
                max(0, min(v0_screen[0], min(v1_screen[0], v2_screen[0])) - 1) as u16,
                max(0, min(v0_screen[1], min(v1_screen[1], v2_screen[1])) - 1) as u16,
            ];
            let triangle_bounds_max = [
                min(self.canvas_width, (max(v0_screen[0], max(v1_screen[0], v2_screen[0])) + 1) as u16),
                min(self.canvas_height, (max(v0_screen[1], max(v1_screen[1], v2_screen[1])) + 1) as u16),
            ];

            for y in triangle_bounds_min[1]..triangle_bounds_max[1] {
                for x in triangle_bounds_min[0]..triangle_bounds_max[0] {
                    let pixel_index = (y as usize) * (self.canvas_width as usize) + (x as usize);
                    let pixel_color_index = pixel_index * 4;

                    let x_normalised = (x as f32) / canvas_w;
                    let y_normalised = 1.0 - (y as f32) / canvas_h;

                    let ray_direction = Vec3::new(
                        (-near_plane_width_half).lerp(near_plane_width_half, x_normalised),
                        (-near_plane_height_half).lerp(near_plane_height_half, y_normalised),
                        CAMERA_NEAR,
                    ).normalize();

                    // Ensure ray and triangle normal are not perpendicular
                    // (otherwise consider ray not intersection)
                    if ray_direction.dot(triangle_normal) > f32::EPSILON {
                        let ray_length =
                            -(triangle_plane_distance / triangle_normal.dot(ray_direction));

                        if ray_length > CAMERA_NEAR {
                            let intersection_point = ray_direction * ray_length;

                            let c_0 = intersection_point - v0;
                            let c_1 = intersection_point - v1;
                            let c_2 = intersection_point - v2;

                            if triangle_normal.dot(edge0.cross(c_0)) > 0.0
                                && triangle_normal.dot(edge1.cross(c_1)) > 0.0
                                && triangle_normal.dot(edge2.cross(c_2)) > 0.0
                            {
                                // Ray intersects triangle (great job)
                                if ray_length < self.depth_data[pixel_index] {
                                    // Ray intersection is nearest so far, draw it
                                    self.depth_data[pixel_index] = ray_length;

                                    self.pixel_data[pixel_color_index] = ((triangle.color[0] as f32) * lightness) as u8; /* R */
                                    self.pixel_data[pixel_color_index + 1] = ((triangle.color[1] as f32) * lightness) as u8; /* G */
                                    self.pixel_data[pixel_color_index + 2] = ((triangle.color[2] as f32) * lightness) as u8; /* B */
                                }
                            }
                        }
                    }
                }
            }
            // @DEBUG Draw pixels of triangle vertices
            // self.debug_draw_pixel(v0_screen);
            // self.debug_draw_pixel(v1_screen);
            // self.debug_draw_pixel(v2_screen);
        }
    }

    /// A demo that renders a scene using a custom 3d software renderer
    fn custom_renderer(&mut self) {
        let pixel_data_len = self.pixel_data.len();

        // Clear frame buffer
        let mut i: usize = 0;
        while i < pixel_data_len {
            self.pixel_data[i] = CLEAR_COLOR[0]; /* R */
            self.pixel_data[i + 1] = CLEAR_COLOR[1]; /* G */
            self.pixel_data[i + 2] = CLEAR_COLOR[2]; /* B */
            i += 4;
        }

        // Clear depth buffer
        for i in 0..self.depth_data.len() {
            self.depth_data[i] = f32::MAX;
        }

        // Render each mesh
        for mesh in 0..self.meshes.len() {
            self.render_mesh(mesh);
        }

        self.angle += 0.01;
    }

    /// Entrypoint to the library (lol)
    /// Fill the framebuffer with the next frame's data
    #[wasm_bindgen]
    pub fn set_image_data(&mut self) {
        self.custom_renderer();
    }

    /// Debug function to draw a pixel on the screen
    fn debug_draw_pixel(&mut self, pixel: [i16; 2]) {
        let x = pixel[0];
        let y = pixel[1];
        if x >= 0 && (x as u16) < self.canvas_width && y >= 0 && (y as u16) < self.canvas_height {
            let i = ((y as usize) * (self.canvas_width as usize) + (x as usize)) as usize * 4;
            self.pixel_data[i] = 0xFF;
            self.pixel_data[i + 1] = 0x00;
            self.pixel_data[i + 2] = 0xFF;
        }
    }

    /// Convert a 3D vertex to a 2D screen position
    fn vertex_position_on_screen(
        &self,
        vertex: Vec3,
        near_plane_width_half: f32,
        near_plane_height_half: f32,
    ) -> [i16; 2] {
        let near_plane_intersection_point = vertex * (CAMERA_NEAR / vertex.z);
        [
            (f32::inverse_lerp(
                -near_plane_width_half,
                near_plane_width_half,
                near_plane_intersection_point.x,
            ) * self.canvas_width as f32) as i16,
            (f32::inverse_lerp(
                -near_plane_height_half,
                near_plane_height_half,
                -near_plane_intersection_point.y,
            ) * self.canvas_height as f32) as i16,
        ]
    }
}

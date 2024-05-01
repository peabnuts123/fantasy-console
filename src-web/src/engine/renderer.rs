use std::{
    cmp::{max, min},
    f32::consts::PI,
};

use glam::{FloatExt, Quat, Vec3};
use crate::types::{Color, Object};

const CAMERA_FOV_V: f32 = 50.0 * PI / 180.0;
const CAMERA_NEAR: f32 = 0.1;

const LIGHT_ANGLE: Vec3 = Vec3::new(-1.0, -1.0, 2.0);

/* Clear color for the screen */
const CLEAR_COLOR: Color = [
    0x87, 0xCE, 0xEB, // Sky Blue
    // 0xFF, 0xFF, 0xFF, // White
];

pub const VEC_UP: Vec3 = Vec3::new(0.0, 1.0, 0.0);
pub const VEC_DOWN: Vec3 = Vec3::new(0.0, 1.0, 0.0);
pub const VEC_LEFT: Vec3 = Vec3::new(-1.0, 0.0, 0.0);
pub const VEC_RIGHT: Vec3 = Vec3::new(1.0, 0.0, 0.0);
pub const VEC_FORWARD: Vec3 = Vec3::new(0.0, 0.0, 1.0);
pub const VEC_BACKWARD: Vec3 = Vec3::new(0.0, 0.0, -1.0);


pub struct Renderer {
    canvas_width: u16,
    canvas_height: u16,
    pixel_data: Vec<u8>,
    depth_data: Vec<f32>,
    offset: u16,
    pub camera_position: Vec3,
    pub camera_rotation: Vec3,
}

impl Renderer {
    pub fn new(canvas_width: u16, canvas_height: u16) -> Self {
        Self {
            canvas_width,
            canvas_height,
            pixel_data: vec![0; (canvas_width as usize) * (canvas_height as usize) * 4 /* rgba */],
            depth_data: vec![0.0; (canvas_width as usize) * (canvas_height as usize)],
            offset: 0,
            camera_position: Vec3::ZERO,
            camera_rotation: Vec3::ZERO,
        }
    }

    pub fn buffer(&mut self) -> js_sys::Uint8ClampedArray {
        unsafe {
            js_sys::Uint8ClampedArray::view_mut_raw(
                self.pixel_data.as_mut_ptr(),
                self.pixel_data.len(),
            )
        }
    }

    /// Fill the frame buffer with a rainbow pattern
    pub fn rainbow_demo(&mut self) {
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

    // @TODO make renderer have more of a `render scene` function or something
    pub fn clear_buffers(&mut self) {
        // Clear frame buffer
        // self.rainbow_demo(); // 🌈 Fun for the whole family
        let pixel_data_len = self.pixel_data.len();
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
    }

    pub fn render_object(&mut self, object: &Object, angle: f32) {
        let mesh = &object.mesh;
        let canvas_w = self.canvas_width as f32;
        let canvas_h = self.canvas_height as f32;
        let camera_fov_h_half = CAMERA_FOV_V * canvas_w / canvas_h / 2.0;
        let camera_fov_v_half = CAMERA_FOV_V / 2.0;
        let near_plane_width = CAMERA_NEAR * camera_fov_h_half.tan() * 2.0;
        let near_plane_height = CAMERA_NEAR * camera_fov_v_half.tan() * 2.0;

        let rotation_point = object.position;
        let spin: Quat = Quat::from_rotation_y(angle + object.rotation) * Quat::from_rotation_x((angle + object.rotation) / 4.0);

        let camera_rotation = Quat::from_euler(glam::EulerRot::ZXY, self.camera_rotation.z, self.camera_rotation.x, self.camera_rotation.y);

        let light_angle = camera_rotation * LIGHT_ANGLE;

        for triangle_index in 0..mesh.triangles.len() {
            let triangle = &mesh.triangles[triangle_index];
            let mut v0 = mesh.vertices[triangle.indices[0]] + object.position;
            let mut v1 = mesh.vertices[triangle.indices[1]] + object.position;
            let mut v2 = mesh.vertices[triangle.indices[2]] + object.position;

            // Apply rotation to vertices, offset camera position
            v0 = camera_rotation * (spin * (v0 - rotation_point) + rotation_point - self.camera_position);
            v1 = camera_rotation * (spin * (v1 - rotation_point) + rotation_point - self.camera_position);
            v2 = camera_rotation * (spin * (v2 - rotation_point) + rotation_point - self.camera_position);

            // Cull triangles that are behind the camera
            if v0.z < CAMERA_NEAR && v1.z < CAMERA_NEAR && v2.z < CAMERA_NEAR {
                continue;
            }

            // Clipping
            // Algorithm:
            //  - Iterate each edge
            //  - If the first vertex is in front of the camera, add it to the list
            //  - If the edge intersects the near plane, add a new vertex at that position
            let mut vertices: Vec<Vec3> = Vec::new();
            for [a,b] in [[v0, v1], [v1, v2], [v2, v0]] {
                if a.z < CAMERA_NEAR && b.z < CAMERA_NEAR {
                    // Edge wholly behind camera
                    continue;
                } else if a.z < CAMERA_NEAR {
                    // A behind camera, B in front of camera
                    // Add intersection point
                    let t = f32::inverse_lerp(a.z, b.z, CAMERA_NEAR);
                    vertices.push(a.lerp(b, t));
                } else if b.z < CAMERA_NEAR {
                    // A in front of camera, B behind camera
                    // Add A to list of vertices, and add intersection point
                    vertices.push(a);
                    let t = f32::inverse_lerp(a.z, b.z, CAMERA_NEAR);
                    vertices.push(a.lerp(b, t));
                } else {
                    // A and B both in front of camera
                    // Add only A (B will get its turn being A at some point)
                    vertices.push(a);
                }
            }
            // console::log_1(&format!("Triangle {} has {} vertices: {:?}", triangle_index, vertices.len(), vertices).into());

            if vertices.len() < 3 {
                // Triangle is entirely behind the camera
                continue;
            }
            for i in 2..vertices.len() {
                let v0 = vertices[0];
                let v1 = vertices[i - 1];
                let v2 = vertices[i];

                self.render_triangle(v0, v1, v2, triangle.color, near_plane_width, near_plane_height, canvas_w, canvas_h, light_angle);
            }
        }
    }

    fn render_triangle(&mut self, v0: Vec3, v1: Vec3, v2: Vec3, color: Color, near_plane_width: f32, near_plane_height: f32, canvas_w: f32, canvas_h: f32, light_angle: Vec3) {
        // Rendering calculations based on
        // https://www.scratchapixel.com/lessons/3d-basic-rendering/rasterization-practical-implementation/overview-rasterization-algorithm.html

        // Calculate triangle bounds on screen (so as to not render the entire screen for every triangle)
        let v0_ndc = vertex_position_to_ndc(v0, near_plane_width, near_plane_height);
        let v1_ndc = vertex_position_to_ndc(v1, near_plane_width, near_plane_height);
        let v2_ndc = vertex_position_to_ndc(v2, near_plane_width, near_plane_height);

        let triangle_normal_ndc = (v2_ndc - v0_ndc).cross(v1_ndc - v0_ndc).normalize();
        // Cull triangles that are facing away from the camera
        if triangle_normal_ndc.z > 0.0 {
            return;
        }

        // @TODO vertex attributes pre-computing

        let v0_raster = Vec3::new(v0_ndc.x * canvas_w, v0_ndc.y * canvas_h, /* @NOTE pre-calculate reciprocal */ 1.0 / v0.z);
        let v1_raster = Vec3::new(v1_ndc.x * canvas_w, v1_ndc.y * canvas_h, /* @NOTE pre-calculate reciprocal */ 1.0 / v1.z);
        let v2_raster: Vec3 = Vec3::new(v2_ndc.x * canvas_w, v2_ndc.y * canvas_h, /* @NOTE pre-calculate reciprocal */ 1.0 / v2.z);


        let triangle_normal: Vec3 = (v2 - v0).cross(v1 - v0).normalize();

        // Arbitrary set minimum to 20%
        let lightness = 0.2_f32.max(light_angle.angle_between(triangle_normal) / PI);
        // let lightness:f32 = 1.0;

        // Add 1 pixel to ensure triangle is fully rendered (since coordinates are just getting truncated, not rounded)
        let triangle_bounds_min = [
            // Smallest of the 3 vertices, minus 1, clamped to 0
            0_i32.max(
                v0_raster.x.min(v1_raster.x.min(v2_raster.x)) as i32 - 1
            ) as u16,
            0_i32.max(
                v0_raster.y.min(v1_raster.y.min(v2_raster.y)) as i32 - 1
            ) as u16,
        ];
        let triangle_bounds_max = [
            // Largest of the 3 vertices, plus 1, clamped to canvas size
            self.canvas_width.min(
                v0_raster.x.max(v1_raster.x.max(v2_raster.x)) as u16 + 1
            ),
            self.canvas_height.min(
                v0_raster.y.max(v1_raster.y.max(v2_raster.y)) as u16 + 1
            ),
        ];

        let triangle_double_area = vertex_edge_function(v0_raster, v1_raster, v2_raster);

        let z1_minus_z0 = v1_raster.z - v0_raster.z;
        let z2_minus_z0 = v2_raster.z - v0_raster.z;

        for y in triangle_bounds_min[1]..triangle_bounds_max[1] {
            let y_inverse = self.canvas_height - y - 1;
            // @TODO do this optimisation for Y as well
            // Initial edge function values
            let p: Vec3 = Vec3::new(triangle_bounds_min[0] as f32 + 0.5, y as f32 + 0.5, 0.0);

            let mut w0 = vertex_edge_function(v1_raster, v2_raster, p);
            let mut w1 = vertex_edge_function(v2_raster, v0_raster, p);
            let mut w2 = vertex_edge_function(v0_raster, v1_raster, p);

            // Amount of change for edge function values per column
            let w0_step = vertex_edge_function_step(v1_raster, v2_raster);
            let w1_step = vertex_edge_function_step(v2_raster, v0_raster);
            let w2_step = vertex_edge_function_step(v0_raster, v1_raster);
            for x in triangle_bounds_min[0]..triangle_bounds_max[0] {
                let pixel_index = (y_inverse as usize) * (self.canvas_width as usize) + (x as usize);
                let pixel_color_index = pixel_index * 4;

                // Test pixel is in triangle
                if w0 >= 0.0 && w1 >= 0.0 && w2 >= 0.0 {
                    // Compute barycentric coordinates as proportion of triangle area
                    let w0 = w0 / triangle_double_area;
                    let w1 = w1 / triangle_double_area;
                    let w2 = w2 / triangle_double_area;

                    /*
                        Note: w0 + w1 + w2 = 1
                        Note: Z = (w0 * z0) + (w1 * z1) + (w2 * z2)

                        Can simplify to:
                        Z = z0 + w1 * (z1 - z0) + w2 * (z2 - z0)

                        Where (z1 - z0) and (z2 - z0) can be precomputed
                     */

                    // let z: f32 = 1.0 / (v0_raster.z * w0 + v1_raster.z * w1 + v2_raster.z * w2);
                    let z: f32 = 1.0 / (v0_raster.z + w1 * z1_minus_z0 + w2 * z2_minus_z0);

                    if z > CAMERA_NEAR && z < self.depth_data[pixel_index] {
                        // Pixel is nearest so far, draw it
                        self.depth_data[pixel_index] = z;

                        self.pixel_data[pixel_color_index]     = ((color[0] as f32) * lightness) as u8; /* R */
                        self.pixel_data[pixel_color_index + 1] = ((color[1] as f32) * lightness) as u8; /* G */
                        self.pixel_data[pixel_color_index + 2] = ((color[2] as f32) * lightness) as u8; /* B */
                    }
                }

                // Increase edge function results
                w0 = w0 + w0_step;
                w1 = w1 + w1_step;
                w2 = w2 + w2_step;
            }
        }
    }

    pub fn render_object_raytraced(&mut self, object: &Object, angle: f32) {
        let mesh = &object.mesh;
        let canvas_w = self.canvas_width as f32;
        let canvas_h = self.canvas_height as f32;
        let camera_fov_h_half = CAMERA_FOV_V * canvas_w / canvas_h / 2.0;
        let camera_fov_v_half = CAMERA_FOV_V / 2.0;
        let near_plane_width_half = CAMERA_NEAR * camera_fov_h_half.tan();
        let near_plane_height_half = CAMERA_NEAR * camera_fov_v_half.tan();

        let rotation_point = object.position;
        let spin = Quat::from_rotation_y(angle + object.rotation) * Quat::from_rotation_x((angle + object.rotation) / 4.0);

        for triangle_index in 0..mesh.triangles.len() {
            let triangle = &mesh.triangles[triangle_index];
            let mut v0 = mesh.vertices[triangle.indices[0]] + object.position;
            let mut v1 = mesh.vertices[triangle.indices[1]] + object.position;
            let mut v2 = mesh.vertices[triangle.indices[2]] + object.position;

            // Apply rotation to vertices, offset camera position
            v0 = spin * (v0 - rotation_point) + rotation_point - self.camera_position;
            v1 = spin * (v1 - rotation_point) + rotation_point - self.camera_position;
            v2 = spin * (v2 - rotation_point) + rotation_point - self.camera_position;

            // Rendering calculations based on
            // https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/ray-triangle-intersection-geometric-solution.html

            // Calculate triangle bounds on screen (so as to not render the entire screen for every triangle)
            let v0_screen_result = self.vertex_position_on_screen_raytraced(v0, near_plane_width_half, near_plane_height_half);
            let v1_screen_result = self.vertex_position_on_screen_raytraced(v1, near_plane_width_half, near_plane_height_half);
            let v2_screen_result = self.vertex_position_on_screen_raytraced(v2, near_plane_width_half, near_plane_height_half);

            // NOTE: triangle is entirely off-screen
            if v0_screen_result.is_err() && v1_screen_result.is_err() && v2_screen_result.is_err() {
                continue;
            }

            // Unwrap results into real values
            // Coordinates may be off-screen, but at least 1 will not be
            let v0_screen = v0_screen_result.unwrap_or_else(|v| v);
            let v1_screen = v1_screen_result.unwrap_or_else(|v| v);
            let v2_screen = v2_screen_result.unwrap_or_else(|v| v);

            // Add 1 pixel to ensure triangle is fully rendered (since coordinates are just getting truncated, not rounded)
            let triangle_bounds_min = [
                max(0, min(v0_screen[0], min(v1_screen[0], v2_screen[0])) - 1) as u16,
                max(0, min(v0_screen[1], min(v1_screen[1], v2_screen[1])) - 1) as u16,
            ];
            let triangle_bounds_max = [
                min(self.canvas_width, (max(v0_screen[0], max(v1_screen[0], v2_screen[0])) + 1) as u16),
                min(self.canvas_height, (max(v0_screen[1], max(v1_screen[1], v2_screen[1])) + 1) as u16),
            ];

            let edge0 = v1 - v0;
            let edge1 = v2 - v1;
            let edge2 = v0 - v2;

            let triangle_normal = edge0.cross(v2 - v0).normalize();
            let triangle_plane_distance: f32 = -triangle_normal.dot(v0);
            // Arbitrary set minimum to 20%
            let lightness = 0.2_f32.max(LIGHT_ANGLE.angle_between(triangle_normal) / PI);

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

    /// Convert a 3D vertex to a 2D screen position
    fn vertex_position_on_screen_raytraced(
        &self,
        vertex: Vec3,
        near_plane_width_half: f32,
        near_plane_height_half: f32,
    ) -> Result<[u16; 2], [u16; 2]> {
        let near_plane_intersection_point = vertex * (CAMERA_NEAR / vertex.z);
        let normalised_x = f32::inverse_lerp(
            -near_plane_width_half,
            near_plane_width_half,
            near_plane_intersection_point.x,
        );
        let normalised_y = f32::inverse_lerp(
            -near_plane_height_half,
            near_plane_height_half,
            -near_plane_intersection_point.y,
        );

        let result = [
            (normalised_x * self.canvas_width as f32) as u16,
            (normalised_y * self.canvas_height as f32) as u16,
        ];

        if  normalised_x < 0.0 || normalised_x > 1.0 ||
            normalised_y < 0.0 || normalised_y > 1.0 {
            Err(result)
        } else {
            Ok(result)
        }

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
}


fn vertex_position_to_raster(
    vertex: Vec3,
    near_plane_width: f32,
    near_plane_height: f32,
    canvas_w: f32,
    canvas_h: f32
) -> Vec3 {
    Vec3::new(
        ((vertex.x * (CAMERA_NEAR / vertex.z)) / near_plane_width + 0.5) * canvas_w,
        ((vertex.y * (CAMERA_NEAR / vertex.z)) / near_plane_height + 0.5) * canvas_h,
        // @NOTE pre-calculate reciprocal
        1.0 / vertex.z
    )
}

fn vertex_position_to_ndc(
    vertex: Vec3,
    near_plane_width: f32,
    near_plane_height: f32,
) -> Vec3 {
    Vec3::new(
        (vertex.x * (CAMERA_NEAR / vertex.z)) / near_plane_width + 0.5,
        (vertex.y * (CAMERA_NEAR / vertex.z)) / near_plane_height + 0.5,
        vertex.z
    )
}

fn vertex_edge_function(a: Vec3, b: Vec3, c: Vec3) -> f32 {
    ((b.x - a.x) * (c.y - a.y)) - ((b.y - a.y) * (c.x - a.x))
}
fn vertex_edge_function_step(a: Vec3, b: Vec3) -> f32 {
    -(b.y - a.y)
}

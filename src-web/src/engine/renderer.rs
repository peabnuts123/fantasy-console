use std::{
    f32::consts::PI, ops::{Add, Mul, Sub},
};

use glam::{Mat4, Vec2, Vec3, Vec4};
use crate::{
    cartridge::{MeshAsset, Triangle, Vertex, VertexAxis}, textures::{Texture, TextureCache}
};

type PixelColor = [u8; 3];

const CAMERA_FOV_V: f32 = 50.0 * PI / 180.0;
const CAMERA_NEAR: f32 = 0.1;
const CAMERA_FAR: f32 = 100.0;

pub type Color = [f32; 3];
pub type ColorRgba = [f32; 4];

/* Clear color for the screen */
const CLEAR_COLOR: PixelColor = [
    0x87, 0xCE, 0xEB, // Sky Blue
];


pub struct Renderer {
    canvas_width: u16,
    canvas_height: u16,
    pixel_data: Vec<u8>,
    depth_data: Vec<f32>,
    pub camera_position: Vec3,
    pub camera_rotation: Vec3,
    projection_matrix: Mat4,
    screen_space_matrix: Mat4,
    light_angle: Vec3,
}

impl Renderer {
    pub fn new(canvas_width: u16, canvas_height: u16) -> Self {
        let half_canvas_width = canvas_width as f32 * 0.5;
        let half_canvas_height = canvas_height as f32 * 0.5;
        let aspect_ratio = half_canvas_width / half_canvas_height;

        Self {
            canvas_width,
            canvas_height,
            pixel_data: vec![0; (canvas_width as usize) * (canvas_height as usize) * 4 /* rgba */],
            depth_data: vec![0.0; (canvas_width as usize) * (canvas_height as usize)],
            // camera_position: Vec3::new(0.0, 0.0, -5.0),
            // camera_rotation: Vec3::ZERO,
            camera_position: Vec3::new(2.0399384, 2.0847206, -3.8119411),
            camera_rotation: Vec3::new(-0.275, 0.31499982, 0.0),
            projection_matrix: Mat4::from_cols(
                Vec4::new(1.0 / ((CAMERA_FOV_V * 0.5).tan() * aspect_ratio), 0.0, 0.0, 0.0),
                Vec4::new(0.0, 1.0 / (CAMERA_FOV_V * 0.5).tan().tan(), 0.0, 0.0),
                Vec4::new(0.0, 0.0, (CAMERA_FAR + CAMERA_NEAR) / (CAMERA_FAR - CAMERA_NEAR), -(2.0 * CAMERA_FAR * CAMERA_NEAR) / (CAMERA_FAR - CAMERA_NEAR)),
                Vec4::new(0.0, 0.0, 1.0, 0.0),
            ).transpose(),
            screen_space_matrix: Mat4::from_cols(
                Vec4::new(half_canvas_width, 0.0, 0.0, half_canvas_width - 0.5),
                Vec4::new(0.0, -half_canvas_height, 0.0, half_canvas_height - 0.5),
                Vec4::new(0.0, 0.0, 1.0, 0.0),
                Vec4::new(0.0, 0.0, 0.0, 1.0),
            ).transpose(),
            light_angle: Vec3::new(2.0, 10.0, 1.0).normalize(),
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

    pub fn clear_buffers(&mut self) {
        // Clear frame buffer
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

    pub fn render_mesh(&mut self, position: Vec3, mesh: &MeshAsset, texture_cache: &TextureCache) {
        // Object (local) to world (global) coordinates
        let object_matrix: Mat4 = Mat4::from_translation(position); // * Mat4::from_rotation_y(angle + object.rotation) * Mat4::from_rotation_x(angle + object.rotation);

        // World to camera-relative coordinates (i.e. apply offset by camera position, rotation)
        let camera_matrix = Mat4::from_euler(glam::EulerRot::ZXY, self.camera_rotation.z, self.camera_rotation.x, self.camera_rotation.y) * Mat4::from_translation(-self.camera_position);

        // Full projection matrix for object + camera + perspective projection
        let model_view_matrix = self.projection_matrix * camera_matrix * object_matrix;

        // @NOTE used by clipping
        let mut temp_vertex_buffer: Vec<Vertex> = Vec::new();

        for triangle_index in 0..mesh.triangles.len() {
            let mut triangle = mesh.triangles[triangle_index].clone();

            // Look up vertices from triangle indices
            let mut v0 = mesh.vertices[triangle.indices[0]].clone();
            let mut v1 = mesh.vertices[triangle.indices[1]].clone();
            let mut v2 = mesh.vertices[triangle.indices[2]].clone();

            // Transform vertex positions to clip space coordinates
            v0.pos = model_view_matrix * v0.pos;
            v1.pos = model_view_matrix * v1.pos;
            v2.pos = model_view_matrix * v2.pos;

            // Transform normals to world space
            v0.normal = v0.normal.map_or(v0.normal, |normal|
                Some(object_matrix.transform_vector3(normal))
            );
            v1.normal = v1.normal.map_or(v1.normal, |normal|
                Some(object_matrix.transform_vector3(normal))
            );
            v2.normal = v2.normal.map_or(v2.normal, |normal|
                Some(object_matrix.transform_vector3(normal))
            );
            triangle.normal = object_matrix.transform_vector3(triangle.normal);

            /* Clipping */

            // If triangle needs no clipping, just draw it
            if v0.is_inside_frustum() && v1.is_inside_frustum() && v2.is_inside_frustum() {
                // Transform vertices to screen space coordinates
                v0.pos = perspective_divide(self.screen_space_matrix * v0.pos);
                v1.pos = perspective_divide(self.screen_space_matrix * v1.pos);
                v2.pos = perspective_divide(self.screen_space_matrix * v2.pos);

                self.render_triangle(
                    &v0, &v1, &v2,
                    &triangle,
                    texture_cache,
                );
                continue;
            }

            let mut vertices = vec![v0, v1, v2];

            // Clip triangle successively against each axis
            // As the triangle is clipped, it turns into a polygon with more than 3 edges
            // If the entire triangle is clipped, skip drawing entirely
            if
                clip_polygon_to_axis(&mut vertices, &VertexAxis::X, &mut temp_vertex_buffer) &&
                clip_polygon_to_axis(&mut vertices, &VertexAxis::Y, &mut temp_vertex_buffer) &&
                clip_polygon_to_axis(&mut vertices, &VertexAxis::Z, &mut temp_vertex_buffer)
            {
                // Transform vertices to screen space coordinates
                for vertex in vertices.iter_mut() {
                    vertex.pos = perspective_divide(self.screen_space_matrix * vertex.pos);
                }

                // Draw clipped triangle as a triangle fan
                for i in 1..(vertices.len() - 1)
                {
                    self.render_triangle(
                        &mut vertices[0].clone(), &mut vertices[i].clone(), &mut vertices[i + 1].clone(),
                        &triangle,
                        texture_cache,
                    );
                }
            }
        }
    }

    fn render_triangle(&mut self,
        v0: &Vertex, v1: &Vertex, v2: &Vertex,
        triangle: &Triangle,
        texture_cache: &TextureCache,
    ) {
        // let debug_backup_normal: Vec3 = (v2.pos - v0.pos).truncate().cross((v1.pos - v0.pos).truncate()).normalize();

        // Arbitrary set minimum lightness to 20%
        // let backup_lightness = debug_backup_normal.dot(light_angle).clamp(0.0, 1.0) * 0.8 + 0.2;
        // let default_lightness
        // let backup_lightness: f32 = 0.2_f32.max(light_angle.angle_between(triangle_normal) / PI);
        // let backup_lightness = 1.0;

        /* Backface culling */
        if triangle_signed_area_double(v0.pos, v1.pos, v2.pos) < 0.0 {
            return;
        }

        let mut v0 = v0;
        let mut v1 = v1;
        let mut v2 = v2;

        // Make sure vertices are sorted by their Y coordinate
        if v2.pos.y < v1.pos.y {
            (v2, v1) = (v1, v2);
        }
        if v1.pos.y < v0.pos.y {
            (v1, v0) = (v0, v1);
        }
        if v2.pos.y < v1.pos.y {
            (v2, v1) = (v1, v2);
        }

        // Interpolation constant
        let one_over_dx: f32 = 1.0 / ((v1.pos.x - v2.pos.x) * (v0.pos.y - v2.pos.y)
            - (v0.pos.x - v2.pos.x) * (v1.pos.y - v2.pos.y));

        let mut left_delta_x = (v2.pos.x - v0.pos.x) / (v2.pos.y - v0.pos.y);
        let mut right_delta_x = (v1.pos.x - v0.pos.x) / (v1.pos.y - v0.pos.y);

        let triangle_sign = triangle_signed_area_double(v0.pos, v1.pos, v2.pos);
        if triangle_sign >= 0.0 {
            (left_delta_x, right_delta_x) = (right_delta_x, left_delta_x);
        }

        let y_start_offset = v0.pos.y.ceil() - v0.pos.y;

        let mut x_start = v0.pos.x + left_delta_x * y_start_offset;
        let mut x_end = v0.pos.x + right_delta_x * y_start_offset;

        /* Interpolators */
        // - 1 / z
        let mut one_over_z_interpolator = Interpolator::<f32>::new(
            1.0 / v0.pos.w, 1.0 / v1.pos.w, 1.0 / v2.pos.w,
            &v0.pos, &v1.pos, &v2.pos,
            one_over_dx,
        );
        one_over_z_interpolator.reset_left(0, y_start_offset, left_delta_x);

        // Texture coordinate
        let triangle_has_texture = triangle.texture_id.is_some();
        let mut texture_coord_interpolator = Interpolator::<Vec2>::new_perspective_correct(
            // @TODO use `triangle_has_texture` and panic if they don't agree
            v0.texture_coord.unwrap_or(Vec2::ZERO),
            v1.texture_coord.unwrap_or(Vec2::ZERO),
            v2.texture_coord.unwrap_or(Vec2::ZERO),
            &v0.pos, &v1.pos, &v2.pos,
            one_over_dx,
        );
        texture_coord_interpolator.reset_left(0, y_start_offset, left_delta_x);

        let texture = if triangle_has_texture {
            Some(texture_cache.get_texture_asset(&triangle.texture_id.unwrap()))
        } else {
            None
        };

        // Normal
        let triangle_has_normals: bool = v0.normal.is_some() && v1.normal.is_some() && v2.normal.is_some();
        let mut normal_interpolator = Interpolator::<Vec3>::new_perspective_correct(
            v0.normal.unwrap_or(Vec3::ZERO),
            v1.normal.unwrap_or(Vec3::ZERO),
            v2.normal.unwrap_or(Vec3::ZERO),
            &v0.pos, &v1.pos, &v2.pos,
            one_over_dx,
        );
        normal_interpolator.reset_left(0, y_start_offset, left_delta_x);
        let flat_lightness: f32 = triangle.normal.dot(self.light_angle).clamp(0.0, 1.0) * 0.8 + 0.2;

        // - Color
        // @TODO @DEBUG REMOVE
        // let mut color_interpolator = Interpolator::<Vec3>::new(
        //     v0_color, v1_color, v2_color,
        //     v0_raster, v1_raster, v2_raster,
        //     one_over_dx,
        // );
        // color_interpolator.reset_left(0, y_start_offset, left_delta_x);

        /* ==========
         * UPPER HALF
         * ========= */
        for y in (v0.pos.y.ceil() as u16)..(v1.pos.y.ceil() as u16) {
            let pixel_index_y_component = (y as usize) * (self.canvas_width as usize);
            for x in (x_start.ceil() as u16)..(x_end.ceil() as u16) {

                let depth_z = 1.0 / one_over_z_interpolator.value();

                if depth_z > CAMERA_NEAR && depth_z < CAMERA_FAR {
                    let pixel_index = pixel_index_y_component + (x as usize);

                    if depth_z < self.depth_data[pixel_index] {
                        let pixel_color_index: usize = pixel_index * 4;

                        /* Draw debug interpolated color @TODO @REMOVE */
                        // let c: Vec3 = color_interpolator.value();
                        // self.pixel_data[pixel_color_index]     = c.x as u8;  /* R */
                        // self.pixel_data[pixel_color_index + 1] = c.y as u8;  /* G */
                        // self.pixel_data[pixel_color_index + 2] = c.z as u8;  /* B */

                        let mut is_pixel_invisible = false;
                        let mut pixel = triangle.color;
                        if triangle_has_texture {
                            let texture_coord = texture_coord_interpolator.value_perspective_correct(depth_z);
                            let sample = sample_texture(&texture_coord, texture.expect("Texture was empty"));
                            if sample[3] < 0.5 {
                                is_pixel_invisible = true;
                            }
                            pixel[0] = pixel[0] * sample[0];
                            pixel[1] = pixel[1] * sample[1];
                            pixel[2] = pixel[2] * sample[2];
                        }

                        if !is_pixel_invisible {
                            if triangle_has_normals {
                                let normal = normal_interpolator.value_perspective_correct(depth_z);
                                let lightness = normal.dot(self.light_angle).clamp(0.0, 1.0) * 0.8 + 0.2;

                                pixel[0] = pixel[0] * lightness;
                                pixel[1] = pixel[1] * lightness;
                                pixel[2] = pixel[2] * lightness;
                            } else {
                                pixel[0] = pixel[0] * flat_lightness;
                                pixel[1] = pixel[1] * flat_lightness;
                                pixel[2] = pixel[2] * flat_lightness;
                            }

                            self.pixel_data[pixel_color_index]     = (pixel[0] * 255.0) as u8; /* R */
                            self.pixel_data[pixel_color_index + 1] = (pixel[1] * 255.0) as u8; /* G */
                            self.pixel_data[pixel_color_index + 2] = (pixel[2] * 255.0) as u8; /* B */

                            /* Visualise depth buffer */
                            // self.pixel_data[pixel_color_index]     = ((1.0 - (depth_z / CAMERA_FAR)) * 255.0) as u8;  /* R */
                            // self.pixel_data[pixel_color_index + 1] = ((1.0 - (depth_z / CAMERA_FAR)) * 255.0) as u8;  /* G */
                            // self.pixel_data[pixel_color_index + 2] = ((1.0 - (depth_z / CAMERA_FAR)) * 255.0) as u8;  /* B */

                            // Pixel is nearest so far
                            self.depth_data[pixel_index] = depth_z;
                        }
                    }
                }

                // Interpolators
                one_over_z_interpolator.step();
                // color_interpolator.step();
                texture_coord_interpolator.step();
                normal_interpolator.step();
            }

            x_start = x_start + left_delta_x;
            x_end = x_end + right_delta_x;

            // Interpolators
            one_over_z_interpolator.step_line();
            // color_interpolator.step_line();
            texture_coord_interpolator.step_line();
            normal_interpolator.step_line();
        }

        // Reset stateful counters
        let v1_y_start_offset = v1.pos.y.ceil() - v1.pos.y;
        if triangle_sign >= 0.0 {
            // Update left edge of triangle
            left_delta_x = (v2.pos.x - v1.pos.x) / (v2.pos.y - v1.pos.y);
            x_start = v1.pos.x + left_delta_x * v1_y_start_offset;

            // Interpolators
            one_over_z_interpolator.reset_left(1, v1_y_start_offset, left_delta_x);
            // color_interpolator.reset_left(1, v1_y_start_offset, left_delta_x);
            texture_coord_interpolator.reset_left(1, v1_y_start_offset, left_delta_x);
            normal_interpolator.reset_left(1, v1_y_start_offset, left_delta_x);
        } else {
            // Update right edge of triangle
            right_delta_x = (v2.pos.x - v1.pos.x) / (v2.pos.y - v1.pos.y);
            x_end = v1.pos.x + right_delta_x * v1_y_start_offset;

            // @NOTE no need to reset interpolators for right edge
        }

        /* ==========
         * LOWER HALF
         * ========= */
        for y in (v1.pos.y.ceil() as u16)..(v2.pos.y.ceil() as u16) {
            let pixel_index_y_component = (y as usize) * (self.canvas_width as usize);
            for x in (x_start.ceil() as u16)..(x_end.ceil() as u16) {

                let depth_z = 1.0 / one_over_z_interpolator.value();

                if depth_z > CAMERA_NEAR && depth_z < CAMERA_FAR {
                    let pixel_index = pixel_index_y_component + (x as usize);

                    if depth_z < self.depth_data[pixel_index] {
                        let pixel_color_index: usize = pixel_index * 4;

                        /* Draw debug interpolated color @TODO @REMOVE */
                        // let c: Vec3 = color_interpolator.value();
                        // self.pixel_data[pixel_color_index]     = c.x as u8;  /* R */
                        // self.pixel_data[pixel_color_index + 1] = c.y as u8;  /* G */
                        // self.pixel_data[pixel_color_index + 2] = c.z as u8;  /* B */

                        let mut is_pixel_invisible = false;
                        let mut pixel = triangle.color;
                        if triangle_has_texture {
                            let texture_coord = texture_coord_interpolator.value_perspective_correct(depth_z);
                            let sample = sample_texture(&texture_coord, texture.expect("Texture was empty"));
                            if sample[3] < 0.5 {
                                is_pixel_invisible = true;
                            }
                            pixel[0] = pixel[0] * sample[0];
                            pixel[1] = pixel[1] * sample[1];
                            pixel[2] = pixel[2] * sample[2];
                        }

                        if !is_pixel_invisible {
                            if triangle_has_normals {
                                let normal = normal_interpolator.value_perspective_correct(depth_z);
                                let lightness = normal.dot(self.light_angle).clamp(0.0, 1.0) * 0.8 + 0.2;

                                pixel[0] = pixel[0] * lightness;
                                pixel[1] = pixel[1] * lightness;
                                pixel[2] = pixel[2] * lightness;
                            } else {
                                pixel[0] = pixel[0] * flat_lightness;
                                pixel[1] = pixel[1] * flat_lightness;
                                pixel[2] = pixel[2] * flat_lightness;
                            }

                            self.pixel_data[pixel_color_index]     = (pixel[0] * 255.0) as u8; /* R */
                            self.pixel_data[pixel_color_index + 1] = (pixel[1] * 255.0) as u8; /* G */
                            self.pixel_data[pixel_color_index + 2] = (pixel[2] * 255.0) as u8; /* B */

                            /* Visualise depth buffer */
                            // self.pixel_data[pixel_color_index]     = ((1.0 - (depth_z / CAMERA_FAR)) * 255.0) as u8;  /* R */
                            // self.pixel_data[pixel_color_index + 1] = ((1.0 - (depth_z / CAMERA_FAR)) * 255.0) as u8;  /* G */
                            // self.pixel_data[pixel_color_index + 2] = ((1.0 - (depth_z / CAMERA_FAR)) * 255.0) as u8;  /* B */

                            // Pixel is nearest so far
                            self.depth_data[pixel_index] = depth_z;
                        }
                    }
                }

                // Interpolators
                one_over_z_interpolator.step();
                // color_interpolator.step();
                texture_coord_interpolator.step();
                normal_interpolator.step();
            }

            x_start = x_start + left_delta_x;
            x_end = x_end + right_delta_x;

            // Interpolators
            one_over_z_interpolator.step_line();
            // color_interpolator.step_line();
            texture_coord_interpolator.step_line();
            normal_interpolator.step_line();
        }
    }

    /// Debug function to draw a pixel on the screen
    fn debug_draw_pixel(&mut self, pixel: [i16; 2], color: PixelColor) {
        let x = pixel[0];
        let y = pixel[1];
        if x >= 0 && (x as u16) < self.canvas_width && y >= 0 && (y as u16) < self.canvas_height {
            let i = (((self.canvas_height - y as u16) as usize) * (self.canvas_width as usize) + (x as usize)) as usize * 4;
            self.pixel_data[i] = color[0];
            self.pixel_data[i + 1] = color[1];
            self.pixel_data[i + 2] = color[2];
        }
    }
}

// Mostly hot garbage
fn vertex_position_to_ndc(
    vertex: Vec3,
    near_plane_half_width: f32,
    near_plane_half_height: f32,
) -> Vec3 {
    // @NOTE Perform perspective divide then scale coordinates to [0,1]
    Vec3::new(
        vertex.x / near_plane_half_width,
        vertex.y / near_plane_half_height,
        vertex.z
    )
}

fn vertex_edge_function(a: Vec3, b: Vec3, c: Vec3) -> f32 {
    // @NOTE just 2D cross product of edges AC x AB
    ((b.x - a.x) * (c.y - a.y)) - ((b.y - a.y) * (c.x - a.x))
}
fn vertex_edge_function_step_y(a: Vec3, b: Vec3) -> f32 {
    /* @NOTE derived from vertex_edge_function(a,b,c) - vertex_edge_function(a,b,(c.x, c.y + 1)) */
    b.x - a.x
}
fn vertex_edge_function_step_x(a: Vec3, b: Vec3) -> f32 {
    /* @NOTE derived from vertex_edge_function(a,b,c) - vertex_edge_function(a,b,(c.x + 1, c.y)) */
    a.y - b.y
}

fn perspective_divide(v: Vec4) -> Vec4 {
    Vec4::new(
        v.x / v.w,
        v.y / v.w,
        v.z / v.w,
        v.w
    )
}

fn triangle_signed_area_double(a: Vec4, b: Vec4, c: Vec4) -> f32 {
    ((c.x - a.x) * (b.y - a.y)) - ((c.y - a.y) * (b.x - a.x))
}

fn clip_polygon_to_axis(vertices: &mut Vec<Vertex>, clip_axis: &VertexAxis, temp_storage: &mut Vec<Vertex>) -> bool {
    clip_polygon_to_axis_half(vertices, clip_axis, 1.0, temp_storage);
    vertices.clear();

    if temp_storage.is_empty() {
        return false;
    }

    clip_polygon_to_axis_half(&temp_storage, clip_axis, -1.0, vertices);
    temp_storage.clear();

    !vertices.is_empty()
}

fn clip_polygon_to_axis_half(vertices: &Vec<Vertex>, clip_axis: &VertexAxis, w_sign: f32, results: &mut Vec<Vertex>) {
    let mut previous_vertex = vertices.last().unwrap();
    let mut previous_value = previous_vertex.get_axis(clip_axis) * w_sign;
    let mut previous_was_inside = previous_value <= previous_vertex.pos.w;

    for current_vertex in vertices {
        let current_value = current_vertex.get_axis(clip_axis) * w_sign;
        let current_is_inside = current_value <= current_vertex.pos.w;

        if current_is_inside ^ previous_was_inside {
            // Calculate intersection point with `w`
            // @NOTE I'm not entirely sure how different w values are being
            // mixed here
            let lerp_amount = (previous_vertex.pos.w - previous_value) /
					((previous_vertex.pos.w - previous_value) -
					 (current_vertex.pos.w - current_value));

            let clipped_vertex = previous_vertex.lerp(current_vertex, lerp_amount);
            results.push(clipped_vertex);
        }

        if current_is_inside {
            results.push(current_vertex.clone());
        }

        previous_vertex = current_vertex;
        previous_value = current_value;
        previous_was_inside = current_is_inside;
    }
}

fn sample_texture(texture_coord: &Vec2, texture: &Texture) -> ColorRgba {
    let u = ((texture_coord.x.fract()) + 1.0).fract();
    let v = ((texture_coord.y.fract()) + 1.0).fract();
    let texture_x = (u * ((texture.width - 1) as f32)) as usize;
    let texture_y = (v * ((texture.height - 1) as f32)) as usize;

    let texture_index = ((texture_y * texture.width) + texture_x) * 4;

    [
        texture.data[texture_index],
        texture.data[texture_index + 1],
        texture.data[texture_index + 2],
        texture.data[texture_index + 3],
    ]
}

struct Interpolator<T: Mul<f32, Output=T> + Sub<Output=T> + Add<Output=T> + Copy> {
    values: [T; 3],
    step_x: T,
    step_y: T,
    left: T,
    current_value_for_line: T,
    step_x_times_left_delta_x_plus_step_y: T, // Cached computation
}

impl<T: Mul<f32, Output=T> + Sub<Output=T> + Add<Output=T> + Copy> Interpolator<T> {
    fn new_perspective_correct(
        c0: T, c1: T, c2: T,
        v0: &Vec4, v1: &Vec4, v2: &Vec4,
        one_over_dx: f32
    ) -> Self {
        Self::new(
            c0 * (1.0 / v0.w), c1 * (1.0 / v1.w), c2 * (1.0 / v2.w),
            v0, v1, v2,
            one_over_dx,
        )
    }

    fn new(
        c0: T, c1: T, c2: T,
        v0: &Vec4, v1: &Vec4, v2: &Vec4,
        one_over_dx: f32
    ) -> Self {
        Interpolator {
            values: [c0, c1, c2],
            step_x: (
                (c1 - c2) * (v0.y - v2.y)
                - (c0 - c2) * (v1.y - v2.y)
            ) * one_over_dx,
            step_y: (
                (c1 - c2) * (v0.x - v2.x)
                - (c0 - c2) * (v1.x - v2.x)
            ) * (-one_over_dx),
            left: c0,
            current_value_for_line: c0,
            step_x_times_left_delta_x_plus_step_y: c0 * 0.0, // @NOTE some kind of nonsense value as default, expected to call reset_left before use
        }
    }

    fn reset_left(&mut self, value_index: usize, y_start_offset: f32, left_delta_x: f32) {
        let step_x_times_left_delta_x = self.step_x * left_delta_x;
        // @NOTE Pre-compute this calculation as it is re-used per-line and is constant
        self.step_x_times_left_delta_x_plus_step_y = step_x_times_left_delta_x + self.step_y;

        let c = self.values[value_index];
        self.left = c + (self.step_y * y_start_offset) + (step_x_times_left_delta_x * y_start_offset);

        // Reset line value
        self.current_value_for_line = self.left;
    }

    fn step(&mut self) {
        self.current_value_for_line = self.current_value_for_line + self.step_x;
    }

    fn step_line(&mut self) {
        // @NOTE same calculation as `reset_left` except we know `y_start_offset` = 1
        // Precomputed because it is constant since `reset_left`
        self.left = self.left + self.step_x_times_left_delta_x_plus_step_y;
        self.current_value_for_line = self.left;
    }

    fn value(&self) -> T {
        self.current_value_for_line
    }

    fn value_perspective_correct(&self, z: f32) -> T {
        self.value() * z
    }
}

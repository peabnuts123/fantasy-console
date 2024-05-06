use std::{
    cmp::{max, min},
    f32::consts::PI, ops::{Add, Mul, Sub},
};

use glam::{FloatExt, Mat4, Quat, Vec2, Vec3, Vec4};
use crate::{textures::{Texture, TextureCache}, types::{Color, Object, Triangle, Vertex, VertexAxis, COLOR_BLUE, COLOR_GREEN, COLOR_LOVELY_PINK, COLOR_RED}};

type PixelColor = [u8; 3];

const CAMERA_FOV_V: f32 = 50.0 * PI / 180.0;
const CAMERA_NEAR: f32 = 0.1;
const CAMERA_FAR: f32 = 100.0;

const LIGHT_ANGLE: Vec3 = Vec3::new(1.0, 1.0, -2.0);

/* Clear color for the screen */
const CLEAR_COLOR: PixelColor = [
    0x87, 0xCE, 0xEB, // Sky Blue
    // 0xFF, 0xFF, 0xFF, // White
];

pub const VEC_UP: Vec3 = Vec3::new(0.0, 1.0, 0.0);
pub const VEC_DOWN: Vec3 = Vec3::new(0.0, 1.0, 0.0);
pub const VEC_LEFT: Vec3 = Vec3::new(-1.0, 0.0, 0.0);
pub const VEC_RIGHT: Vec3 = Vec3::new(1.0, 0.0, 0.0);
pub const VEC_FORWARD: Vec3 = Vec3::new(0.0, 0.0, 1.0);
pub const VEC_BACKWARD: Vec3 = Vec3::new(0.0, 0.0, -1.0);



struct Interpolator<T: Mul<f32, Output=T> + Sub<Output=T> + Add<Output=T> + Copy> {
    values: [T; 3],
    step_x: T,
    step_y: T,
    left: T,
    current_value_for_line: T,
}

impl<T: Mul<f32, Output=T> + Sub<Output=T> + Add<Output=T> + Copy> Interpolator<T> {
    fn new_perspective_correct(
        c0: T, c1: T, c2: T,
        v0: Vec4, v1: Vec4, v2: Vec4,
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
        v0: Vec4, v1: Vec4, v2: Vec4,
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
        }
    }

    fn reset_left(&mut self, value_index: usize, y_start_offset: f32, left_delta_x: f32) {
        let c = self.values[value_index];
        self.left = c + (self.step_y * y_start_offset) + (self.step_x * (y_start_offset * left_delta_x));
        // @NOTE Also reset line value
        self.current_value_for_line = self.left;
    }

    fn step(&mut self) {
        self.current_value_for_line = self.current_value_for_line + self.step_x;
    }

    fn step_line(&mut self, left_delta_x: f32) {
        self.left = self.left + self.step_y + (self.step_x * left_delta_x);
        // self.right = self.right + self.step_y + (self.step_x * right_delta_x);
        self.current_value_for_line = self.left;
    }

    fn value(&self) -> T {
        self.current_value_for_line
    }

    fn value_perspective_correct(&self, z: f32) -> T {
        self.value() * z
    }
}


pub struct Renderer {
    canvas_width: u16,
    canvas_height: u16,
    pixel_data: Vec<u8>,
    depth_data: Vec<f32>,
    offset: u16,
    pub camera_position: Vec3,
    pub camera_rotation: Vec3,
    projection_matrix: Mat4,
    screen_space_matrix: Mat4,
    pub texture_cache: TextureCache,
}

impl Renderer {
    pub fn new(canvas_width: u16, canvas_height: u16) -> Self {
        let half_canvas_width = canvas_width as f32 * 0.5;
        let half_canvas_height = canvas_height as f32 * 0.5;
        let aspect_ratio = half_canvas_width / half_canvas_height;

        Self {
            canvas_width,
            canvas_height,
            texture_cache: TextureCache::new(),
            pixel_data: vec![0; (canvas_width as usize) * (canvas_height as usize) * 4 /* rgba */],
            depth_data: vec![0.0; (canvas_width as usize) * (canvas_height as usize)],
            offset: 0,
            camera_position: Vec3::new(0.0, 0.0, -5.0),
            camera_rotation: Vec3::ZERO,
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

    /* Render Object using scanline rasterization */
    pub fn render_object(&mut self, object: &Object, angle: f32) {
        let mesh = &object.mesh;

        // Object (local) to world (global) coordinates
        let object_matrix: Mat4 = Mat4::from_translation(object.position);// * Mat4::from_rotation_y(angle + object.rotation) * Mat4::from_rotation_x(angle + object.rotation);

        // World to camera-relative coordinates (i.e. apply offset by camera position, rotation)
        let camera_rotation: Mat4 = Mat4::from_euler(glam::EulerRot::ZXY, self.camera_rotation.z, self.camera_rotation.x, self.camera_rotation.y);
        let camera_matrix = camera_rotation * Mat4::from_translation(-self.camera_position);

        // Full projection matrix for object + camera + perspective projection
        let model_view_matrix = self.projection_matrix * camera_matrix * object_matrix;

        // @TODO gotta be a better way of doing this. Can we just use `camera_matrix`?
        let light_angle = camera_rotation.transform_vector3(LIGHT_ANGLE);

        // @NOTE used by clipping
        let mut temp_vertex_buffer: Vec<Vertex> = Vec::new();

        for triangle_index in 0..mesh.triangles.len() {
            let triangle = &mesh.triangles[triangle_index];

            // Look up vertices from triangle indices
            let mut v0 = mesh.vertices[triangle.indices[0]].clone();
            let mut v1 = mesh.vertices[triangle.indices[1]].clone();
            let mut v2 = mesh.vertices[triangle.indices[2]].clone();

            // Transform vertex positions to clip space coordinates
            v0.pos = model_view_matrix * v0.pos;
            v1.pos = model_view_matrix * v1.pos;
            v2.pos = model_view_matrix * v2.pos;

            /* Clipping */

            // If triangle needs no clipping, just draw it
            if v0.is_inside_frustum() && v1.is_inside_frustum() && v2.is_inside_frustum() {
                self.render_triangle(
                    &mut v0, &mut v1, &mut v2,
                    triangle,
                    light_angle
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
                // Draw clipped triangle as a triangle fan
                for i in 1..(vertices.len() - 1)
                {
                    self.render_triangle(
                        &mut vertices[0].clone(), &mut vertices[i].clone(), &mut vertices[i + 1].clone(),
                        triangle,
                        light_angle
                    );
                }
            }
        }
    }

    fn render_triangle(&mut self,
        // v0_pos: Vec4, v1_pos: Vec4, v2_pos: Vec4,
        v0: &mut Vertex, v1: &mut Vertex, v2: &mut Vertex,
        triangle: &Triangle,
        light_angle: Vec3
    ) {
        let debug_backup_normal: Vec3 = (v2.pos - v0.pos).truncate().cross((v1.pos - v0.pos).truncate()).normalize();

        // @TODO do before drawing the triangle to remove need for mutable reference
        // Transform vertices to screen space coordinates
        v0.pos = perspective_divide(self.screen_space_matrix * v0.pos);
        v1.pos = perspective_divide(self.screen_space_matrix * v1.pos);
        v2.pos = perspective_divide(self.screen_space_matrix * v2.pos);


        // Arbitrary set minimum lightness to 20%
        let backup_lightness = debug_backup_normal.dot(light_angle).clamp(0.0, 1.0) * 0.8 + 0.2;
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

        /* Draw first half of triangle */
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
            v0.pos, v1.pos, v2.pos,
            one_over_dx,
        );
        one_over_z_interpolator.reset_left(0, y_start_offset, left_delta_x);

        // Texture coordinate
        let triangle_has_texture = triangle.texture_index.is_some();
        let mut texture_coord_interpolator = Interpolator::<Vec2>::new_perspective_correct(
            // @TODO use `triangle_has_texture` and panic if they don't agree
            v0.texture_coord.unwrap_or(Vec2::ZERO),
            v1.texture_coord.unwrap_or(Vec2::ZERO),
            v2.texture_coord.unwrap_or(Vec2::ZERO),
            v0.pos, v1.pos, v2.pos,
            one_over_dx,
        );
        texture_coord_interpolator.reset_left(0, y_start_offset, left_delta_x);

        let texture = if triangle_has_texture {
            Some(self.texture_cache.get_texture(triangle.texture_index.unwrap()))
        } else {
            None
        };

        // - Color
        // @TODO @DEBUG REMOVE
        // let mut color_interpolator = Interpolator::<Vec3>::new(
        //     v0_color, v1_color, v2_color,
        //     v0_raster, v1_raster, v2_raster,
        //     one_over_dx,
        // );
        // color_interpolator.reset_left(0, y_start_offset, left_delta_x);


        for y in (v0.pos.y.ceil() as u16)..(v1.pos.y.ceil() as u16) {
            for x in (x_start.ceil() as u16)..(x_end.ceil() as u16) {

                let depth_z = 1.0 / one_over_z_interpolator.value();

                if depth_z > CAMERA_NEAR {
                    let pixel_index = (y as usize) * (self.canvas_width as usize) + (x as usize);

                    if depth_z < self.depth_data[pixel_index] {
                        // Pixel is nearest so far, draw it
                        self.depth_data[pixel_index] = depth_z;

                        let pixel_color_index: usize = pixel_index * 4;

                        /* Draw debug interpolated color @TODO @REMOVE */
                        // let c: Vec3 = color_interpolator.value();
                        // self.pixel_data[pixel_color_index]     = c.x as u8;  /* R */
                        // self.pixel_data[pixel_color_index + 1] = c.y as u8;  /* G */
                        // self.pixel_data[pixel_color_index + 2] = c.z as u8;  /* B */

                        let mut pixel = triangle.color;
                        if triangle_has_texture {
                            let texture_coord = texture_coord_interpolator.value_perspective_correct(depth_z);
                            let sample = sample_texture(&texture_coord, texture.expect("Texture was empty"));
                            pixel[0] = pixel[0] * sample[0];
                            pixel[1] = pixel[1] * sample[1];
                            pixel[2] = pixel[2] * sample[2];
                        }

                        self.pixel_data[pixel_color_index]     = (pixel[0] * backup_lightness * 255.0) as u8; /* R */
                        self.pixel_data[pixel_color_index + 1] = (pixel[1] * backup_lightness * 255.0) as u8; /* G */
                        self.pixel_data[pixel_color_index + 2] = (pixel[2] * backup_lightness * 255.0) as u8; /* B */

                        /* Visualise depth buffer */
                        // self.pixel_data[pixel_color_index]     = ((1.0 - (depth_z / CAMERA_FAR)) * 255.0) as u8;  /* R */
                        // self.pixel_data[pixel_color_index + 1] = ((1.0 - (depth_z / CAMERA_FAR)) * 255.0) as u8;  /* G */
                        // self.pixel_data[pixel_color_index + 2] = ((1.0 - (depth_z / CAMERA_FAR)) * 255.0) as u8;  /* B */
                    }
                }

                // Interpolators
                one_over_z_interpolator.step();
                // color_interpolator.step();
                texture_coord_interpolator.step();
            }

            x_start = x_start + left_delta_x;
            x_end = x_end + right_delta_x;

            // Interpolators
            one_over_z_interpolator.step_line(left_delta_x);
            // color_interpolator.step_line(left_delta_x);
            texture_coord_interpolator.step_line(left_delta_x);
        }

        /* Draw second half of triangle */
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
        } else {
            // Update right edge of triangle
            right_delta_x = (v2.pos.x - v1.pos.x) / (v2.pos.y - v1.pos.y);
            x_end = v1.pos.x + right_delta_x * v1_y_start_offset;

            // @NOTE no need to reset interpolators for right edge
        }

        for y in (v1.pos.y.ceil() as u16)..(v2.pos.y.ceil() as u16) {
            for x in (x_start.ceil() as u16)..(x_end.ceil() as u16) {

                let depth_z = 1.0 / one_over_z_interpolator.value();

                if depth_z > CAMERA_NEAR {
                    let pixel_index = (y as usize) * (self.canvas_width as usize) + (x as usize);

                    if depth_z < self.depth_data[pixel_index] {
                        // Pixel is nearest so far, draw it
                        self.depth_data[pixel_index] = depth_z;

                        let pixel_color_index: usize = pixel_index * 4;

                        /* Draw debug interpolated color @TODO @REMOVE */
                        // let c: Vec3 = color_interpolator.value();
                        // self.pixel_data[pixel_color_index]     = c.x as u8;  /* R */
                        // self.pixel_data[pixel_color_index + 1] = c.y as u8;  /* G */
                        // self.pixel_data[pixel_color_index + 2] = c.z as u8;  /* B */

                        let mut pixel = triangle.color;
                        if triangle_has_texture {
                            let texture_coord = texture_coord_interpolator.value_perspective_correct(depth_z);
                            let sample = sample_texture(&texture_coord, texture.expect("Texture was empty"));
                            pixel[0] = pixel[0] * sample[0];
                            pixel[1] = pixel[1] * sample[1];
                            pixel[2] = pixel[2] * sample[2];
                        }

                        self.pixel_data[pixel_color_index]     = (pixel[0] * backup_lightness * 255.0) as u8; /* R */
                        self.pixel_data[pixel_color_index + 1] = (pixel[1] * backup_lightness * 255.0) as u8; /* G */
                        self.pixel_data[pixel_color_index + 2] = (pixel[2] * backup_lightness * 255.0) as u8; /* B */

                        /* Visualise depth buffer */
                        // self.pixel_data[pixel_color_index]     = ((1.0 - (depth_z / CAMERA_FAR)) * 255.0) as u8;  /* R */
                        // self.pixel_data[pixel_color_index + 1] = ((1.0 - (depth_z / CAMERA_FAR)) * 255.0) as u8;  /* G */
                        // self.pixel_data[pixel_color_index + 2] = ((1.0 - (depth_z / CAMERA_FAR)) * 255.0) as u8;  /* B */
                    }
                }

                // Interpolators
                one_over_z_interpolator.step();
                // color_interpolator.step();
                texture_coord_interpolator.step();
            }

            x_start = x_start + left_delta_x;
            x_end = x_end + right_delta_x;

            // Interpolators
            one_over_z_interpolator.step_line(left_delta_x);
            // color_interpolator.step_line(left_delta_x);
            texture_coord_interpolator.step_line(left_delta_x);
        }
    }

    pub fn render_object_edge_function_rasterized(&mut self, object: &Object, angle: f32) {
        let mesh = &object.mesh;
        let canvas_w = self.canvas_width as f32;
        let canvas_h = self.canvas_height as f32;
        let camera_fov_h_half = CAMERA_FOV_V * canvas_w / canvas_h / 2.0;
        let camera_fov_v_half = CAMERA_FOV_V / 2.0;
        let near_plane_width = CAMERA_NEAR * camera_fov_h_half.tan() * 2.0;
        let near_plane_height = CAMERA_NEAR * camera_fov_v_half.tan() * 2.0;

        let spin: Quat = Quat::from_rotation_y(angle + object.rotation) * Quat::from_rotation_x((angle + object.rotation) / 4.0);

        let camera_rotation = Quat::from_euler(glam::EulerRot::ZXY, self.camera_rotation.z, self.camera_rotation.x, self.camera_rotation.y);

        let light_angle = camera_rotation * LIGHT_ANGLE;

        let position_offset = object.position - self.camera_position;

        for triangle_index in 0..mesh.triangles.len() {
            let triangle = &mesh.triangles[triangle_index];
            let mut v0 = mesh.vertices[triangle.indices[0]].pos.truncate();
            let mut v1 = mesh.vertices[triangle.indices[1]].pos.truncate();
            let mut v2 = mesh.vertices[triangle.indices[2]].pos.truncate();

            // Apply rotation to vertices, offset camera position
            v0 = camera_rotation * (spin * v0 + position_offset);
            v1 = camera_rotation * (spin * v1 + position_offset);
            v2 = camera_rotation * (spin * v2 + position_offset);

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

                self.render_triangle_edge_function_rasterized(v0, v1, v2, triangle.color, near_plane_width, near_plane_height, canvas_w, canvas_h, light_angle);
            }
        }
    }

    fn render_triangle_edge_function_rasterized(&mut self, v0: Vec3, v1: Vec3, v2: Vec3, color: Color, near_plane_width: f32, near_plane_height: f32, canvas_w: f32, canvas_h: f32, light_angle: Vec3) {
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
        let v2_raster = Vec3::new(v2_ndc.x * canvas_w, v2_ndc.y * canvas_h, /* @NOTE pre-calculate reciprocal */ 1.0 / v2.z);


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
        // let one_over_triangle_area = 1.0 / triangle_double_area;

        let z1_minus_z0 = (v1_raster.z - v0_raster.z) / triangle_double_area;
        let z2_minus_z0 = (v2_raster.z - v0_raster.z) / triangle_double_area;

        let p: Vec3 = Vec3::new(triangle_bounds_min[0] as f32 + 0.5, triangle_bounds_min[1] as f32 + 0.5, 0.0);

        // Initial edge function values
        let mut w0_y = vertex_edge_function(v1_raster, v2_raster, p);
        let mut w1_y = vertex_edge_function(v2_raster, v0_raster, p);
        let mut w2_y = vertex_edge_function(v0_raster, v1_raster, p);

        let w0_step_y = vertex_edge_function_step_y(v1_raster, v2_raster);
        let w1_step_y = vertex_edge_function_step_y(v2_raster, v0_raster);
        let w2_step_y = vertex_edge_function_step_y(v0_raster, v1_raster);

        // Amount of change for edge function values per column
        let w0_step_x = vertex_edge_function_step_x(v1_raster, v2_raster);
        let w1_step_x = vertex_edge_function_step_x(v2_raster, v0_raster);
        let w2_step_x = vertex_edge_function_step_x(v0_raster, v1_raster);

        for y in triangle_bounds_min[1]..triangle_bounds_max[1] {
            let y_inverse = self.canvas_height - y - 1;

            // let p: Vec3 = Vec3::new(triangle_bounds_min[0] as f32 + 0.5, y as f32 + 0.5, 0.0);

            // let mut w0 = vertex_edge_function(v1_raster, v2_raster, p);
            // let mut w1 = vertex_edge_function(v2_raster, v0_raster, p);
            // let mut w2 = vertex_edge_function(v0_raster, v1_raster, p);

            let mut w0 = w0_y;
            let mut w1 = w1_y;
            let mut w2 = w2_y;

            for x in triangle_bounds_min[0]..triangle_bounds_max[0] {
                // Test pixel is in triangle
                if w0 >= 0.0 && w1 >= 0.0 && w2 >= 0.0 {
                    // Compute barycentric coordinates as proportion of triangle area
                    // let w0 = w0 * one_over_triangle_area;
                    // let w1 = w1 * one_over_triangle_area;
                    // let w2 = w2 * one_over_triangle_area;

                    /*
                        Note: w0 + w1 + w2 = 1
                        Note: Z = (w0 * z0) + (w1 * z1) + (w2 * z2)

                        Can simplify to:
                        Z = z0 + w1 * (z1 - z0) + w2 * (z2 - z0)

                        Where (z1 - z0) and (z2 - z0) can be precomputed
                     */

                    // let z: f32 = 1.0 / (v0_raster.z * w0 + v1_raster.z * w1 + v2_raster.z * w2);
                    let z: f32 = 1.0 / (v0_raster.z + w1 * z1_minus_z0 + w2 * z2_minus_z0);


                    if z > CAMERA_NEAR {
                        let pixel_index = (y_inverse as usize) * (self.canvas_width as usize) + (x as usize);

                        if z < self.depth_data[pixel_index] {
                            // Pixel is nearest so far, draw it
                            self.depth_data[pixel_index] = z;

                            let pixel_color_index: usize = pixel_index * 4;

                            self.pixel_data[pixel_color_index]     = ((color[0] as f32) * lightness) as u8; /* R */
                            self.pixel_data[pixel_color_index + 1] = ((color[1] as f32) * lightness) as u8; /* G */
                            self.pixel_data[pixel_color_index + 2] = ((color[2] as f32) * lightness) as u8; /* B */
                        }
                    }
                }

                // Increase edge function results
                w0 = w0 + w0_step_x;
                w1 = w1 + w1_step_x;
                w2 = w2 + w2_step_x;
            }

            // Increase edge function results
            w0_y = w0_y + w0_step_y;
            w1_y = w1_y + w1_step_y;
            w2_y = w2_y + w2_step_y;
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
            let mut v0 = mesh.vertices[triangle.indices[0]].pos.truncate() + object.position;
            let mut v1 = mesh.vertices[triangle.indices[1]].pos.truncate() + object.position;
            let mut v2 = mesh.vertices[triangle.indices[2]].pos.truncate() + object.position;

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

fn sample_texture(texture_coord: &Vec2, texture: &Texture) -> Color {
    let u = ((texture_coord.x.fract()) + 1.0).fract();
    let v = ((texture_coord.y.fract()) + 1.0).fract();

    texture.get_pixel(
        (u * (texture.width() as f32)) as u32,
        (v * (texture.height() as f32)) as u32,
    ).0
}
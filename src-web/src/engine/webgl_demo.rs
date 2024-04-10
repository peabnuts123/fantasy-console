use gl_matrix::{
    common::{to_radian, Mat4, Vec3},
    mat4, vec3,
};
use core::panic;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use web_sys::{window, WebGl2RenderingContext, WebGlProgram, WebGlShader, WebGlUniformLocation};

struct WebGLDemoLoopContext {
    gl: WebGl2RenderingContext,
    mat_world_location: WebGlUniformLocation,
    num_indices: i32,
    angle: f32,
    x_rotation_matrix: Mat4,
    y_rotation_matrix: Mat4,
    world_matrix: Mat4,
    identity_matrix: Mat4,
    x_axis: Vec3,
    y_axis: Vec3,
}

pub fn main() {
    let document = web_sys::window().unwrap().document().unwrap();
    let canvas = document
        .get_element_by_id("canvas")
        .expect("No element with ID #canvas found")
        .dyn_into::<web_sys::HtmlCanvasElement>()
        .expect("Should be an HTMLCanvasElement");
    let canvas_width = canvas.width();
    let canvas_height = canvas.height();

    let gl = canvas
        .get_context("webgl2")
        .expect("Failed to get WebGL2 context: A")
        .expect("Failed to get WebGL2 context: B")
        .dyn_into::<WebGl2RenderingContext>()
        .expect("Should be a WebGL2 context");

    gl.viewport(0, 0, canvas_width as i32, canvas_height as i32);
    gl.enable(WebGl2RenderingContext::DEPTH_TEST);
    gl.enable(WebGl2RenderingContext::CULL_FACE);

    let vert_shader = compile_shader(
        &gl,
        WebGl2RenderingContext::VERTEX_SHADER,
        r##"
        precision mediump float;

        attribute vec3 vertPosition;
        attribute vec3 vertColor;
        varying vec3 fragColor;
        uniform mat4 mWorld;
        uniform mat4 mView;
        uniform mat4 mProj;

        void main() {
            fragColor = vertColor;
            gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
        }
        "##,
    );

    let frag_shader = compile_shader(
        &gl,
        WebGl2RenderingContext::FRAGMENT_SHADER,
        r##"
        precision mediump float;

        varying vec3 fragColor;
        void main() {
            gl_FragColor = vec4(fragColor, 1.0);
        }
        "##,
    );

    let program = link_program(&gl, &vert_shader, &frag_shader);

    let vertices = [
        //top
        -1.0, 1.0, -1.0, 0.5, 0.5, 0.5,
        -1.0, 1.0, 1.0, 0.5, 0.5, 0.5,
        1.0, 1.0, 1.0, 0.5, 0.5, 0.5,
        1.0, 1.0, -1.0, 0.5, 0.5, 0.5,
        //left
        -1.0, 1.0, 1.0, 0.75, 0.25, 0.5,
        -1.0, -1.0, 1.0, 0.75, 0.25, 0.5,
        -1.0, -1.0, -1.0, 0.75, 0.25, 0.5,
        -1.0, 1.0, -1.0, 0.75, 0.25, 0.5,
        //right
        1.0, 1.0, 1.0, 0.25, 0.25, 0.75,
        1.0, -1.0, 1.0, 0.25, 0.25, 0.75,
        1.0, -1.0, -1.0, 0.25, 0.25, 0.75,
        1.0, 1.0, -1.0, 0.25, 0.25, 0.75,
        //front
        1.0, 1.0, 1.0, 1.0, 0.0, 0.15,
        1.0, -1.0, 1.0, 1.0, 0.0, 0.15,
        -1.0, -1.0, 1.0, 1.0, 0.0, 0.15,
        -1.0, 1.0, 1.0, 1.0, 0.0, 0.15,
        //back
        1.0, 1.0, -1.0, 0.0, 1.0, 0.15,
        1.0, -1.0, -1.0, 0.0, 1.0, 0.15,
        -1.0, -1.0, -1.0, 0.0, 1.0, 0.15,
        -1.0, 1.0, -1.0, 0.0, 1.0, 0.15,
        //bottom
        -1.0, -1.0, -1.0, 0.5, 0.5, 1.0,
        -1.0, -1.0, 1.0, 0.5, 0.5, 1.0,
        1.0, -1.0, 1.0, 0.5, 0.5, 1.0,
        1.0, -1.0, -1.0, 0.5, 0.5, 1.0,
    ];
    let indices = [
        //top
        0, 1, 2,
        0, 2, 3,
        //left
        5, 4, 6,
        6, 4, 7,
        // right
        8, 9, 10,
        8, 10, 11,
        //front
        13, 12, 14,
        15, 14, 12,
        //back
        16, 17, 18,
        16, 18, 19,
        //bottom
        21, 20, 22,
        22, 20, 23
    ];

    let vertex_buffer = gl.create_buffer().unwrap();
    gl.bind_buffer(WebGl2RenderingContext::ARRAY_BUFFER, Some(&vertex_buffer));
    unsafe {
        gl.buffer_data_with_array_buffer_view(
            WebGl2RenderingContext::ARRAY_BUFFER,
            &js_sys::Float32Array::view(&vertices),
            WebGl2RenderingContext::STATIC_DRAW,
        );
    }
    let index_buffer = gl.create_buffer().unwrap();
    gl.bind_buffer(
        WebGl2RenderingContext::ELEMENT_ARRAY_BUFFER,
        Some(&index_buffer),
    );
    unsafe {
        gl.buffer_data_with_array_buffer_view(
            WebGl2RenderingContext::ELEMENT_ARRAY_BUFFER,
            &js_sys::Uint16Array::view(&indices),
            WebGl2RenderingContext::STATIC_DRAW,
        );
    }

    let position_attribute_location = gl.get_attrib_location(&program, "vertPosition");
    gl.vertex_attrib_pointer_with_i32(
        position_attribute_location as u32,
        3,
        WebGl2RenderingContext::FLOAT,
        false,
        6 * /* f32 */ 4,
        0,
    );
    gl.enable_vertex_attrib_array(position_attribute_location as u32);

    let color_attribute_location = gl.get_attrib_location(&program, "vertColor");
    gl.vertex_attrib_pointer_with_i32(
        color_attribute_location as u32,
        3,
        WebGl2RenderingContext::FLOAT,
        false,
        6 * /* f32 */ 4,
        3 * /* f32 */ 4,
    );
    gl.enable_vertex_attrib_array(color_attribute_location as u32);

    gl.use_program(Some(&program));

    let mat_world_location = gl.get_uniform_location(&program, "mWorld").unwrap();
    let mat_view_location = gl.get_uniform_location(&program, "mView").unwrap();
    let mat_proj_location = gl.get_uniform_location(&program, "mProj").unwrap();

    let mut world_matrix: Mat4 = [0.0; 16];
    let mut view_matrix: Mat4 = [0.0; 16];
    let mut proj_matrix: Mat4 = [0.0; 16];

    let eye = vec3::from_values(0., 0., -8.);
    let center = vec3::from_values(0., 0., 0.);
    let up = vec3::from_values(0., 1., 0.);

    mat4::identity(&mut world_matrix);
    mat4::look_at(&mut view_matrix, &eye, &center, &up);
    mat4::perspective(
        &mut proj_matrix,
        to_radian(45.),
        (canvas_width as f32) / (canvas_height as f32),
        0.1,
        Some(1000.0),
    );

    gl.uniform_matrix4fv_with_f32_array(Some(&mat_world_location), false, &world_matrix);
    gl.uniform_matrix4fv_with_f32_array(Some(&mat_view_location), false, &view_matrix);
    gl.uniform_matrix4fv_with_f32_array(Some(&mat_proj_location), false, &proj_matrix);

    // Create the context
    let mut identity_matrix: Mat4 = [0.0; 16];
    mat4::identity(&mut identity_matrix);
    let wbgl_ctx = Rc::new(RefCell::new(Box::new(WebGLDemoLoopContext {
        gl,
        mat_world_location,
        num_indices: indices.len() as i32,
        angle: 0.0,
        x_rotation_matrix: [0.0; 16],
        y_rotation_matrix: [0.0; 16],
        world_matrix: [0.0; 16],
        identity_matrix,
        x_axis: vec3::from_values(1.0, 0.0, 0.0),
        y_axis: vec3::from_values(0.0, 1.0, 0.0),
    })));

    // Enter a request animation frame loop
    request_animation_frame_loop(wbgl_ctx);
}

impl WebGLDemoLoopContext {
    fn draw_loop(&mut self) {
        mat4::rotate(
            &mut self.x_rotation_matrix,
            &self.identity_matrix,
            self.angle / 4.0,
            &self.x_axis,
        );
        mat4::rotate(
            &mut self.y_rotation_matrix,
            &self.identity_matrix,
            self.angle,
            &self.y_axis,
        );

        mat4::multiply(
            &mut self.world_matrix,
            &self.y_rotation_matrix,
            &self.x_rotation_matrix,
        );

        self.gl.uniform_matrix4fv_with_f32_array(
            Some(&self.mat_world_location),
            false,
            &self.world_matrix,
        );
        self.gl.clear_color(1.0, 1.0, 1.0, 1.0);
        self.gl.clear(
            WebGl2RenderingContext::DEPTH_BUFFER_BIT | WebGl2RenderingContext::COLOR_BUFFER_BIT,
        );

        self.gl.draw_elements_with_i32(
            WebGl2RenderingContext::TRIANGLES,
            self.num_indices,
            WebGl2RenderingContext::UNSIGNED_SHORT,
            0,
        );

        self.angle += 0.01;
    }
}

fn compile_shader(
    context: &WebGl2RenderingContext,
    shader_type: u32,
    source: &str,
) -> WebGlShader {
    let shader = context
        .create_shader(shader_type)
        .unwrap();
    context.shader_source(&shader, source);
    context.compile_shader(&shader);

    let compile_status = context
        .get_shader_parameter(&shader, WebGl2RenderingContext::COMPILE_STATUS)
        .as_bool()
        .unwrap_or(false);

    if compile_status == false {
        let error = context
            .get_shader_info_log(&shader)
            .expect("Error compiling shader: Shader info log should exist");
        panic!("Error compiling shader: {}", error);
    }

    shader
}

pub fn link_program(
    context: &WebGl2RenderingContext,
    vert_shader: &WebGlShader,
    frag_shader: &WebGlShader,
) -> WebGlProgram {
    let program = context
        .create_program()
        .expect("Unable to create WebGL program");

    context.attach_shader(&program, vert_shader);
    context.attach_shader(&program, frag_shader);

    context.link_program(&program);
    let link_status = context
        .get_program_parameter(&program, WebGl2RenderingContext::LINK_STATUS)
        .as_bool()
        .unwrap_or(false);
    if link_status == false {
        let error = context
            .get_program_info_log(&program)
            .expect("Error linking program. Program info log should exist");
        panic!("Error linking program: {}", error);
    }

    context.validate_program(&program);
    let validate_status = context
        .get_program_parameter(&program, WebGl2RenderingContext::VALIDATE_STATUS)
        .as_bool()
        .unwrap_or(false);
    if validate_status == false {
        let error = context
            .get_program_info_log(&program)
            .expect("Error validating program. Program info log should exist");
        panic!("Error validating program: {}", error);
    }

    program
}

fn request_animation_frame_loop(ctx: Rc<RefCell<Box<WebGLDemoLoopContext>>>) {
    // LITERALLY WHAT THE FUCK 🫠

    let f = Rc::new(RefCell::new(None::<Closure<dyn FnMut()>>));
    let g = f.clone();

    *g.borrow_mut() = Some(Closure::new(move || {
        ctx.borrow_mut().draw_loop();

        window()
            .unwrap()
            .request_animation_frame(f.borrow().as_ref().unwrap().as_ref().unchecked_ref())
            .unwrap();
    }));

    window()
        .unwrap()
        .request_animation_frame(g.borrow().as_ref().unwrap().as_ref().unchecked_ref())
        .expect("should register `requestAnimationFrame` OK");
}

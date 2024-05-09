use std::{collections::HashMap, io::Cursor};
use image::io::Reader as ImageReader;

use crate::web;

pub struct Texture {
    pub width: usize,
    pub height: usize,
    pub data: Vec<f32>,
}

pub struct TextureCache {
    path_to_index: HashMap<String, usize>,
    textures: Vec<Texture>,
}

impl TextureCache {
    pub fn new() -> TextureCache {
        TextureCache {
            path_to_index: HashMap::new(),
            textures: Vec::new(),
        }
    }

    pub async fn load_texture(&mut self, texture_path: String) -> Result<usize, String> {
        if self.path_to_index.contains_key(&texture_path) {
            return Ok(*self.path_to_index.get(&texture_path).unwrap());
        }

        let image_file_data = web::get_file_data(texture_path.clone()).await?;

        let image = ImageReader::new(Cursor::new(image_file_data.as_slice()))
            .with_guessed_format().map_err(|e| format!("Failed to determine image format: {texture_path} ({e})"))?
            .decode().map_err(|e| format!("Error while decoding image data for texture '{texture_path}': {e}"))?;
        let texture_data: Vec<f32> = image
            .to_rgba32f()
            .as_flat_samples().samples
            .to_vec();

        let next_index = self.textures.len();
        self.path_to_index.insert(texture_path, next_index);
        self.textures.push(Texture {
            width: image.width() as usize,
            height: image.height() as usize,
            data: texture_data,
        });

        Ok(next_index)
    }

    pub fn get_texture(&self, texture_index: usize) -> &Texture {
        &self.textures[texture_index]
    }
}
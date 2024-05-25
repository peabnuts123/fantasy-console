use js_sys::Uint8Array;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(module = "/util.ts")]
extern "C" {
    #[wasm_bindgen(catch)]
    async fn get_resource(url: String) -> Result<JsValue, JsValue>;
}

pub async fn get_file_data(url: String) -> Result<Vec<u8>, String> {
    let result: Result<JsValue, JsValue> = get_resource(url).await;
    if result.is_ok() {
        let data: Vec<u8> = result.unwrap().dyn_into::<Uint8Array>().expect("Could not convert response").to_vec();
        Ok(data)
    } else {
        Err("Failed to load resource".to_string())
    }
}
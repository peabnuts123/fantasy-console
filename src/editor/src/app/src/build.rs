use std::fs::File;
use std::io::{self, Read, Write};
use std::path::Path;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;
use swc::{config::{self, Config, Options, DecoratorVersion},Compiler};
use swc_common::{errors::Handler, source_map::SourceMap, sync::Lrc, GLOBALS};
use swc_ecma_ast::EsVersion;
use swc_ecma_parser::{Syntax, TsSyntax};

/* @TODO remove all the printlns */

pub fn build(
    manifest_file_bytes: &[u8],
    project_root_path: &str,
    asset_paths: Vec<&str>,
    script_paths: Vec<&str>,
) -> Vec<u8> {
    let mut zip_bytes = Vec::new();
    let mut zip = ZipWriter::new(
        std::io::Cursor::new(&mut zip_bytes)
    );

    let zip_options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    // @TODO could this just use a native js toolchain through a sidecar node binary?
    // https://tauri.app/v1/guides/building/sidecar/

    // @NOTE Weird SWC "global" stuff
    GLOBALS.set(&Default::default(), || {
        // SWC compilation setup
        // @NOTE I really don't know what "cm" is. Some kind of container for source files.
        let cm = Lrc::new(SourceMap::new(swc_common::FilePathMapping::empty()));
        let compiler = Compiler::new(cm.clone());
        let handler = Handler::with_emitter_writer(Box::new(io::stderr()), Some(cm.clone()));

         // @NOTE Same options as .swcrc: https://swc.rs/schema.json
         let options = Options {
            config: Config {
                jsc: config::JscConfig {
                    syntax: Some(Syntax::Typescript(TsSyntax {
                        decorators: true,
                        ..Default::default()
                    })),
                    target: Some(EsVersion::Es2016),
                    transform: Some(config::TransformConfig {
                        decorator_version: Some(DecoratorVersion::V202203),
                        ..Default::default()
                    }).into(),
                    ..Default::default()
                },
                module: Some(config::ModuleConfig::Amd(swc_ecma_transforms_module::amd::Config {
                    ..Default::default()
                })),
                ..Default::default()
            },
            ..Default::default()
        };

        /*
         * Add script files to zip
         * But first, compile them to JS using SWC
         */
        for script_path in script_paths {
            let path = Path::new(project_root_path).join(script_path);

            // Create in-memory source file from file on disk
            let file_contents = std::fs::read_to_string(path.clone()).unwrap();
            let source = cm.new_source_file(
                swc_common::FileName::Real(path).into(),
                file_contents,
            );

            // Compile source file
            let program = compiler
                .process_js_file(source, &handler, &options)
                .expect("Failed to process source file");

            // @NOTE Add compiled output to zip directly (do not write to disk)

            // Rename to .js
            let archive_path = Path::new(script_path).with_extension("js");
            let archive_path_str = archive_path.to_str().unwrap();

            // Write to zip
            zip.start_file(archive_path_str, zip_options).unwrap();
            zip.write_all(program.code.as_bytes()).expect("Failed to zip data");

            println!("Added cartridge file: {}", archive_path_str);
        }

        /*
         * Add asset files to zip directly
         */
        for asset_path in asset_paths {
            let path = Path::new(project_root_path).join(asset_path);

            // Read file data into buffer
            let mut file = File::open(path).expect("Failed to open file");
            let mut buffer = Vec::new();
            file.read_to_end(&mut buffer).expect("Failed to read file");

            // Write to zip
            zip.start_file(asset_path, zip_options).unwrap();
            zip.write_all(&buffer).expect("Failed to write file to zip");

            println!("Added cartridge file: {}", asset_path);
        }

        /*
         * Add manifest file to zip
         */
        zip.start_file("manifest.json", zip_options).unwrap();
        zip.write_all(manifest_file_bytes).expect("Failed to write manifest file");
    });

    zip.finish().expect("Failed to write zip file");

    zip_bytes
}
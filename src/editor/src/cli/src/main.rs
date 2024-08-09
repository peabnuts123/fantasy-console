use std::fs::File;
use std::io::{self, Read, Write};
use std::path::Path;
use walkdir::WalkDir;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;
use swc::{config::{self, Config, Options, DecoratorVersion},Compiler};
use swc_common::{errors::Handler, source_map::SourceMap, sync::Lrc, GLOBALS};
use swc_ecma_ast::EsVersion;
use swc_ecma_parser::{Syntax, TsConfig};

// @TODO watch fs: https://docs.rs/notify/latest/notify/index.html#examples

// @NOTE Hard coded constants for now
const CARTRIDGE_CONTENT_PATH: &str = "../../../sample-cartridge/cartridge";
const CARTRIDGE_SRC_PATH: &str = "../../../sample-cartridge/src/scripts";
const CARTRIDGE_ARCHIVED_OUTPUT_PATH: &str = "../../../web-player/public/sample-cartridge.pzcart";
const CARTRIDGE_ARCHIVED_OUTPUT_PATH2: &str = "../web/public/sample-cartridge.pzcart";

fn main() {
    let content_path = Path::new(CARTRIDGE_CONTENT_PATH);
    let src_path = Path::new(CARTRIDGE_SRC_PATH);

    let zip_file = File::create(CARTRIDGE_ARCHIVED_OUTPUT_PATH).expect("Failed to create zip file");
    let mut zip = ZipWriter::new(zip_file);
    let zip_options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

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
                    syntax: Some(Syntax::Typescript(TsConfig {
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
        for entry in WalkDir::new(src_path).into_iter().filter_map(|e| e.ok()) {
            let path = entry.path();

            // @NOTE Only JS and TS files
            if path.is_file() {
                if path.extension().map(|ext| ext == "js" || ext == "ts").unwrap_or(false) {
                    // Create in-memory source file from file on disk
                    let file_contents = std::fs::read_to_string(path).unwrap();
                    let source = cm.new_source_file(
                        swc_common::FileName::Real(path.to_path_buf()),
                        file_contents,
                    );

                    // Compile source file
                    let program = compiler
                        .process_js_file(source, &handler, &options)
                        .expect("Failed to process source file");

                    // @NOTE Add compiled output to zip directly (do not write to disk)

                    // Virtual file name for zip archive
                    let archive_path = format!("scripts/{}", path
                        .strip_prefix(src_path).expect("Failed to strip prefix")
                        .with_extension("js").to_str().unwrap());

                    // Write to zip
                    zip.start_file(archive_path.clone(), zip_options).unwrap();
                    zip.write_all(program.code.as_bytes()).expect("Failed to zip data");

                    println!("Added cartridge file: {}", archive_path);
                } else {
                    // Ignore non-JS/TS files
                    eprintln!("Skipping script. Not a .js or .ts file: {:?}", path);
                }
            }
        }

        /*
         * Add content files to zip directly
         */
        for entry in WalkDir::new(content_path).into_iter().filter_map(|e| e.ok()) {
            let path = entry.path();

            if path.is_file() {
                // Read file data into buffer
                let mut file = File::open(path).expect("Failed to open file");
                let mut buffer = Vec::new();
                file.read_to_end(&mut buffer).expect("Failed to read file");

                // Virtual file name for zip archive
                let archive_path = path
                    .strip_prefix(content_path).expect("Failed to strip prefix")
                    .to_str().unwrap();

                // Write to zip
                zip.start_file(archive_path, zip_options).unwrap();
                zip.write_all(&buffer).expect("Failed to write file to zip");

                println!("Added cartridge file: {}", archive_path);
            }
        }
    });

    let result = zip.finish().expect("Failed to write zip file");

    // Write a second copy to the web project
    std::fs::copy(CARTRIDGE_ARCHIVED_OUTPUT_PATH, CARTRIDGE_ARCHIVED_OUTPUT_PATH2).expect("Failed to copy zip file");

    println!("Wrote cartridge: {} ({} bytes)", CARTRIDGE_ARCHIVED_OUTPUT_PATH, result.metadata().unwrap().len());
    println!("Wrote cartridge: {} ({} bytes)", CARTRIDGE_ARCHIVED_OUTPUT_PATH2, result.metadata().unwrap().len());
}
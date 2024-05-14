
use glam::Vec3;

use crate::
    cartridge::{CartridgeDefinition, ComponentDefinition, MeshAssetReference, MeshRendererComponentDefinition, ObjectDefinition, SceneDefinition, ScriptAssetReference, ScriptComponentDefinition, VirtualFile, VirtualFileId, VirtualFileType}
;


pub async fn load_cartridge_definition() -> Result<CartridgeDefinition, String> {

    let files = vec![
        /* Models */
        VirtualFile::new(1000, VirtualFileType::Model, "cartridge/models/ball.mtl".to_string()).await,
        VirtualFile::new(1001, VirtualFileType::Model, "cartridge/models/ball.obj".to_string()).await,
        VirtualFile::new(1002, VirtualFileType::Model, "cartridge/models/burgerCheese.mtl".to_string()).await,
        VirtualFile::new(1003, VirtualFileType::Model, "cartridge/models/burgerCheese.obj".to_string()).await,
        VirtualFile::new(1004, VirtualFileType::Model, "cartridge/models/detailDumpster_closed.mtl".to_string()).await,
        VirtualFile::new(1005, VirtualFileType::Model, "cartridge/models/detailDumpster_closed.obj".to_string()).await,
        VirtualFile::new(1006, VirtualFileType::Model, "cartridge/models/kitchen.mtl".to_string()).await,
        VirtualFile::new(1007, VirtualFileType::Model, "cartridge/models/kitchen.obj".to_string()).await,
        VirtualFile::new(1008, VirtualFileType::Model, "cartridge/models/scene.mtl".to_string()).await,
        VirtualFile::new(1009, VirtualFileType::Model, "cartridge/models/scene.obj".to_string()).await,
        /* Scripts */
        VirtualFile::new(2000, VirtualFileType::Script, "cartridge/scripts/another-object.js".to_string()).await,
        VirtualFile::new(2001, VirtualFileType::Script, "cartridge/scripts/lib/math.js".to_string()).await,
        VirtualFile::new(2002, VirtualFileType::Script, "cartridge/scripts/lib/util.js".to_string()).await,
        VirtualFile::new(2003, VirtualFileType::Script, "cartridge/scripts/my-object.js".to_string()).await,
        /* Textures */
        VirtualFile::new(3000, VirtualFileType::Texture, "cartridge/textures/asphalt.png".to_string()).await,
        VirtualFile::new(3001, VirtualFileType::Texture, "cartridge/textures/bars.png".to_string()).await,
        VirtualFile::new(3002, VirtualFileType::Texture, "cartridge/textures/clock texture.png".to_string()).await,
        VirtualFile::new(3003, VirtualFileType::Texture, "cartridge/textures/concrete.png".to_string()).await,
        VirtualFile::new(3004, VirtualFileType::Texture, "cartridge/textures/concreteSmooth.png".to_string()).await,
        VirtualFile::new(3005, VirtualFileType::Texture, "cartridge/textures/dirt.png".to_string()).await,
        VirtualFile::new(3006, VirtualFileType::Texture, "cartridge/textures/doors.png".to_string()).await,
        VirtualFile::new(3007, VirtualFileType::Texture, "cartridge/textures/grass.png".to_string()).await,
        VirtualFile::new(3008, VirtualFileType::Texture, "cartridge/textures/metal.png".to_string()).await,
        VirtualFile::new(3009, VirtualFileType::Texture, "cartridge/textures/picture on shelf texture.png".to_string()).await,
        VirtualFile::new(3010, VirtualFileType::Texture, "cartridge/textures/roof.png".to_string()).await,
        VirtualFile::new(3011, VirtualFileType::Texture, "cartridge/textures/roof_plates.png".to_string()).await,
        VirtualFile::new(3012, VirtualFileType::Texture, "cartridge/textures/signs.png".to_string()).await,
        VirtualFile::new(3013, VirtualFileType::Texture, "cartridge/textures/stones.png".to_string()).await,
        VirtualFile::new(3014, VirtualFileType::Texture, "cartridge/textures/treeA.png".to_string()).await,
        VirtualFile::new(3015, VirtualFileType::Texture, "cartridge/textures/treeB.png".to_string()).await,
        VirtualFile::new(3016, VirtualFileType::Texture, "cartridge/textures/truck.png".to_string()).await,
        VirtualFile::new(3017, VirtualFileType::Texture, "cartridge/textures/truck_alien.png".to_string()).await,
        VirtualFile::new(3018, VirtualFileType::Texture, "cartridge/textures/uv_test.png".to_string()).await,
        VirtualFile::new(3019, VirtualFileType::Texture, "cartridge/textures/wall.png".to_string()).await,
        VirtualFile::new(3020, VirtualFileType::Texture, "cartridge/textures/wall_garage.png".to_string()).await,
        VirtualFile::new(3021, VirtualFileType::Texture, "cartridge/textures/wall_lines.png".to_string()).await,
        VirtualFile::new(3022, VirtualFileType::Texture, "cartridge/textures/wall_metal.png".to_string()).await,
        VirtualFile::new(3023, VirtualFileType::Texture, "cartridge/textures/windows.png".to_string()).await,
    ];

    let scenes: Vec<SceneDefinition> = vec![
        SceneDefinition {
            objects: vec![
                /* Environment */
                ObjectDefinition {
                    position: Vec3::ZERO,
                    rotation: 0.0,
                    components: vec![
                        ComponentDefinition::MeshRenderer(MeshRendererComponentDefinition {
                            mesh: MeshAssetReference {
                                // @NOTE models/scene.obj
                                file: VirtualFileId(1009),
                            },
                        })
                    ]
                },
                /* Hamburger */
                ObjectDefinition {
                    position: Vec3::new(2.0, 0.0, 1.0),
                    rotation: 0.0,
                    components: vec![
                        ComponentDefinition::MeshRenderer(MeshRendererComponentDefinition {
                            mesh: MeshAssetReference {
                                // @NOTE models/burgerCheese.obj
                                file: VirtualFileId(1003),
                            },
                        }),
                        ComponentDefinition::Script(ScriptComponentDefinition {
                            script: ScriptAssetReference {
                                // @NOTE scripts/my-object.js
                                file: VirtualFileId(2003),
                            }
                        })
                    ]
                },
            ],
        },
    ];

    let cartridge = CartridgeDefinition {
        scenes,
        files,
    };

    Ok(cartridge)
}

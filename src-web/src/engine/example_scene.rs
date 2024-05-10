
use glam::Vec3;

use crate::
    cartridge::{CartridgeDefinition, ComponentDefinition, MeshAssetReference, MeshRendererComponentDefinition, ObjectDefinition, SceneDefinition}
;


pub async fn load_cartridge_definition() -> Result<CartridgeDefinition, String> {

    let scenes: Vec<SceneDefinition> = vec![
        SceneDefinition {
            objects: vec![
                ObjectDefinition {
                    position: Vec3::ZERO,
                    rotation: 0.0,
                    components: vec![
                        ComponentDefinition::MeshRenderer(MeshRendererComponentDefinition {
                            mesh: MeshAssetReference {
                                path: "cartridge/models/scene.obj".to_string(),
                            },
                        })
                    ]
                },
                ObjectDefinition {
                    position: Vec3::new(2.0, 0.0, 1.0),
                    rotation: 0.0,
                    components: vec![
                        ComponentDefinition::MeshRenderer(MeshRendererComponentDefinition {
                            mesh: MeshAssetReference {
                                path: "cartridge/models/burgerCheese.obj".to_string(),
                            },
                        })
                    ]
                },
            ],
        },
    ];


    let cartridge = CartridgeDefinition {
        scenes,
    };

    Ok(cartridge)
}

import { CameraComponentDefinition, ComponentDefinitionType, DirectionalLightComponentDefinition, MeshComponentDefinition, PointLightComponentDefinition, SceneObjectDefinition, ScriptComponentDefinition, toColor3, toRuntimeVector3 } from "@fantasy-console/runtime/src/cartridge/archive";
import { AssetDb, AssetType, ComponentConfig, GameObjectConfig } from "@fantasy-console/runtime/src/cartridge/config";
import {
  ScriptComponentConfig,
  CameraComponentConfig,
  DirectionalLightComponentConfig,
  PointLightComponentConfig,
} from "@fantasy-console/runtime/src/cartridge/config";
import { MeshComponentConfigComposer } from "./components";


export function loadObjectDefinition(objectDefinition: SceneObjectDefinition, assetDb: AssetDb): GameObjectConfig {
  let components: ComponentConfig[] = [];
  for (let componentDefinition of objectDefinition.components) {
    switch (componentDefinition.type) {
      case ComponentDefinitionType.Mesh: {
        const meshComponentDefinition = componentDefinition as MeshComponentDefinition;
        const meshAsset = assetDb.getById(meshComponentDefinition.meshFileId, AssetType.Mesh);
        components.push(new MeshComponentConfigComposer(meshAsset));
        break;
      }
      case ComponentDefinitionType.Script: {
        const scriptComponentDefinition = componentDefinition as ScriptComponentDefinition;
        const scriptAsset = assetDb.getById(scriptComponentDefinition.scriptFileId, AssetType.Script);
        // @TODO Composer version
        components.push(new ScriptComponentConfig(scriptAsset));
        break;
      }
      case ComponentDefinitionType.Camera: {
        const cameraComponentDefinition = componentDefinition as CameraComponentDefinition;
        // @TODO Composer version
        components.push(new CameraComponentConfig());
        break;
      }
      case ComponentDefinitionType.DirectionalLight: {
        const directionalLightComponentDefinition = componentDefinition as DirectionalLightComponentDefinition;
        const color = toColor3(directionalLightComponentDefinition.color);
        // @TODO Composer version
        components.push(new DirectionalLightComponentConfig(directionalLightComponentDefinition.intensity, color));
        break;
      }
      case ComponentDefinitionType.PointLight: {
        const pointLightComponentDefinition = componentDefinition as PointLightComponentDefinition;
        const color = toColor3(pointLightComponentDefinition.color);
        // @TODO Composer version
        components.push(new PointLightComponentConfig(pointLightComponentDefinition.intensity, color));
        break;
      }
      default: {
        throw new Error(`Unknown component type: ${componentDefinition.type}`);
      }
    }
  }

  // Load children (recursively)
  let children: GameObjectConfig[] = [];
  if (objectDefinition.children !== undefined) {
    children = objectDefinition.children.map((childObjectDefinition) => loadObjectDefinition(childObjectDefinition, assetDb));
  }

  return new GameObjectConfig(
    objectDefinition.id,
    objectDefinition.name,
    {
      position: toRuntimeVector3(objectDefinition.transform.position),
      rotation: 0 /* @TODO */,
    },
    components,
    children
  );
}

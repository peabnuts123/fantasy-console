import { CameraComponentDefinition, ComponentDefinitionType, DirectionalLightComponentDefinition, MeshComponentDefinition, PointLightComponentDefinition, SceneObjectDefinition, ScriptComponentDefinition } from "@fantasy-console/runtime/src/cartridge/archive";
import { AssetDb, AssetType } from "@fantasy-console/runtime/src/cartridge/config";
import { toColor3Babylon, toCoreVector3 } from "@fantasy-console/runtime/src/util";
import { CameraComponentConfigComposer, DirectionalLightComponentConfigComposer, IComposerComponentConfig, MeshComponentConfigComposer, PointLightComponentConfigComposer, ScriptComponentConfigComposer } from "./components";
import { GameObjectConfigComposer } from "./GameObjectConfigComposer";
import { TransformConfigComposer } from "./TransformConfigComposer";


export function loadObjectDefinition(objectDefinition: SceneObjectDefinition, assetDb: AssetDb): GameObjectConfigComposer {
  let components: IComposerComponentConfig[] = [];
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
        components.push(new ScriptComponentConfigComposer(scriptAsset));
        break;
      }
      case ComponentDefinitionType.Camera: {
        const cameraComponentDefinition = componentDefinition as CameraComponentDefinition;
        // @TODO Composer version
        components.push(new CameraComponentConfigComposer());
        break;
      }
      case ComponentDefinitionType.DirectionalLight: {
        const directionalLightComponentDefinition = componentDefinition as DirectionalLightComponentDefinition;
        const color = toColor3Babylon(directionalLightComponentDefinition.color);
        // @TODO Composer version
        components.push(new DirectionalLightComponentConfigComposer(directionalLightComponentDefinition.intensity, color));
        break;
      }
      case ComponentDefinitionType.PointLight: {
        const pointLightComponentDefinition = componentDefinition as PointLightComponentDefinition;
        const color = toColor3Babylon(pointLightComponentDefinition.color);
        // @TODO Composer version
        components.push(new PointLightComponentConfigComposer(pointLightComponentDefinition.intensity, color));
        break;
      }
      default: {
        throw new Error(`Unknown component type: ${componentDefinition.type}`);
      }
    }
  }

  // Load children (recursively)
  let children: GameObjectConfigComposer[] = [];
  if (objectDefinition.children !== undefined) {
    children = objectDefinition.children.map((childObjectDefinition) => loadObjectDefinition(childObjectDefinition, assetDb));
  }

  return new GameObjectConfigComposer(
    objectDefinition.id,
    objectDefinition.name,
    new TransformConfigComposer(
      toCoreVector3(objectDefinition.transform.position),
      toCoreVector3(objectDefinition.transform.rotation),
      toCoreVector3(objectDefinition.transform.scale),
    ),
    components,
    children
  );
}

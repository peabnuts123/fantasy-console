import { CameraComponentDefinition, ComponentDefinitionType, DirectionalLightComponentDefinition, MeshComponentDefinition, PointLightComponentDefinition, GameObjectDefinition, ScriptComponentDefinition } from "@fantasy-console/runtime/src/cartridge/archive";
import { AssetDb, MeshAssetData, ScriptAssetData } from "@fantasy-console/runtime/src/cartridge";
import { toColor3Core, toVector3Core } from "@fantasy-console/runtime/src/util";

import { CameraComponentData, DirectionalLightComponentData, IComposerComponentData, MeshComponentData, PointLightComponentData, ScriptComponentData } from "./components";
import { GameObjectData } from "./GameObjectData";
import { TransformData } from "./TransformData";


export function loadObjectDefinition(objectDefinition: GameObjectDefinition, assetDb: AssetDb): GameObjectData {
  let components: IComposerComponentData[] = [];
  for (let componentDefinition of objectDefinition.components) {
    switch (componentDefinition.type) {
      case ComponentDefinitionType.Mesh: {
        const meshComponentDefinition = componentDefinition as MeshComponentDefinition;
        let meshAsset: MeshAssetData | undefined = undefined;
        if (meshComponentDefinition.meshFileId !== null) {
          meshAsset = assetDb.getById(meshComponentDefinition.meshFileId, MeshAssetData);
        }
        components.push(new MeshComponentData(componentDefinition.id, meshAsset));
        break;
      }
      case ComponentDefinitionType.Script: {
        const scriptComponentDefinition = componentDefinition as ScriptComponentDefinition;
        let scriptAsset: ScriptAssetData | undefined = undefined;
        if (scriptComponentDefinition.scriptFileId !== null) {
          scriptAsset = assetDb.getById(scriptComponentDefinition.scriptFileId, ScriptAssetData);
        }
        components.push(new ScriptComponentData(componentDefinition.id, scriptAsset));
        break;
      }
      case ComponentDefinitionType.Camera: {
        const cameraComponentDefinition = componentDefinition as CameraComponentDefinition;
        components.push(new CameraComponentData(componentDefinition.id));
        break;
      }
      case ComponentDefinitionType.DirectionalLight: {
        const directionalLightComponentDefinition = componentDefinition as DirectionalLightComponentDefinition;
        const color = toColor3Core(directionalLightComponentDefinition.color);
        components.push(new DirectionalLightComponentData(componentDefinition.id, directionalLightComponentDefinition.intensity, color));
        break;
      }
      case ComponentDefinitionType.PointLight: {
        const pointLightComponentDefinition = componentDefinition as PointLightComponentDefinition;
        const color = toColor3Core(pointLightComponentDefinition.color);
        components.push(new PointLightComponentData(componentDefinition.id, pointLightComponentDefinition.intensity, color));
        break;
      }
      default: {
        throw new Error(`Unknown component type: ${(componentDefinition as { type: string }).type}`);
      }
    }
  }

  // Load children (recursively)
  let children: GameObjectData[] = [];
  if (objectDefinition.children !== undefined) {
    children = objectDefinition.children.map((childObjectDefinition) => loadObjectDefinition(childObjectDefinition, assetDb));
  }

  return new GameObjectData(
    objectDefinition.id,
    objectDefinition.name,
    new TransformData(
      toVector3Core(objectDefinition.transform.position),
      toVector3Core(objectDefinition.transform.rotation),
      toVector3Core(objectDefinition.transform.scale),
    ),
    components,
    children
  );
}

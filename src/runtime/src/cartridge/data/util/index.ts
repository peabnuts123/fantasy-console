// @TODO Mixed use of core vs. babylon types?
import { toVector3Core, toColor3Babylon } from '@fantasy-console/runtime/src/util';
import { CameraComponentDefinition, ComponentDefinitionType, MeshComponentDefinition, ScriptComponentDefinition, DirectionalLightComponentDefinition, PointLightComponentDefinition, GameObjectDefinition } from "../../archive";

import { GameObjectData } from "../GameObjectData";
import { CameraComponentData, ComponentData, DirectionalLightComponentData, MeshComponentData, PointLightComponentData, ScriptComponentData } from "../components";
import { AssetDb } from "../assets/AssetDb";
import { TransformData } from "../TransformData";
import { MeshAssetData, ScriptAssetData } from '../assets';


export function loadObjectDefinition(objectDefinition: GameObjectDefinition, assetDb: AssetDb): GameObjectData {
  let components: ComponentData[] = [];
  for (let componentDefinition of objectDefinition.components) {
    switch (componentDefinition.type) {
      case ComponentDefinitionType.Mesh: {
        const meshComponentDefinition = componentDefinition as MeshComponentDefinition;
        let meshAsset: MeshAssetData | undefined = undefined;
        if (meshComponentDefinition.meshFileId !== undefined) {
          meshAsset = assetDb.getById(meshComponentDefinition.meshFileId, MeshAssetData);
        }
        components.push(new MeshComponentData(componentDefinition.id, meshAsset));
        break;
      }
      case ComponentDefinitionType.Script: {
        const scriptComponentDefinition = componentDefinition as ScriptComponentDefinition;
        const scriptAsset = assetDb.getById(scriptComponentDefinition.scriptFileId, ScriptAssetData);
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
        const color = toColor3Babylon(directionalLightComponentDefinition.color);
        components.push(new DirectionalLightComponentData(componentDefinition.id, directionalLightComponentDefinition.intensity, color));
        break;
      }
      case ComponentDefinitionType.PointLight: {
        const pointLightComponentDefinition = componentDefinition as PointLightComponentDefinition;
        const color = toColor3Babylon(pointLightComponentDefinition.color);
        components.push(new PointLightComponentData(componentDefinition.id, pointLightComponentDefinition.intensity, color));
        break;
      }
      default: {
        throw new Error(`Unknown component type: ${componentDefinition.type}`);
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

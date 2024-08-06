import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";

import { Vector3 } from "@fantasy-console/core/src/util/Vector3";

import { GameObjectConfig } from "./GameObjectConfig";
import { CameraComponentDefinition, ComponentDefinitionType, MeshComponentDefinition, SceneDefinition, ScriptComponentDefinition, DirectionalLightComponentDefinition, PointLightComponentDefinition, SceneObjectDefinition } from "../archive";
import { CameraComponentConfig, ComponentConfig, DirectionalLightComponentConfig, MeshComponentConfig, PointLightComponentConfig, ScriptComponentConfig } from "./components";
import { VirtualFileType } from "./VirtualFile";
import { VirtualFileSystem } from "./VirtualFileSystem";

export interface SceneAmbientLightConfig {
  intensity: number;
  color: Color3;
}

/**
 * A game scene "configuration" i.e. loaded from the raw cartridge file
 * but not yet loaded into the game. Think of it like a template.
 */
export class SceneConfig {
  public id: number;
  public objects: GameObjectConfig[];
  public ambientLight: SceneAmbientLightConfig;
  public clearColor: Color4;

  public constructor(sceneDefinition: SceneDefinition, fileSystem: VirtualFileSystem) {
    /* ID */
    this.id = sceneDefinition.id;

    /* Ambient light config */
    this.ambientLight = {
      intensity: sceneDefinition.ambientLight.intensity,
      color: new Color3(
        sceneDefinition.ambientLight.color.r,
        sceneDefinition.ambientLight.color.g,
        sceneDefinition.ambientLight.color.b
      ),
    };

    /* Clear color */
    this.clearColor = new Color4(
      sceneDefinition.clearColor.r,
      sceneDefinition.clearColor.g,
      sceneDefinition.clearColor.b,
      1
    );

    /* Game Objects */
    this.objects = [];
    for (let objectDefinition of sceneDefinition.objects) {
      this.objects.push(this.loadObjectDefinition(objectDefinition, fileSystem));
    }
  }

  private loadObjectDefinition(objectDefinition: SceneObjectDefinition, fileSystem: VirtualFileSystem): GameObjectConfig {
    let components: ComponentConfig[] = [];
    for (let componentDefinition of objectDefinition.components) {
      switch (componentDefinition.type) {
        case ComponentDefinitionType.Mesh: {
          const meshComponentDefinition = componentDefinition as MeshComponentDefinition;
          const meshFile = fileSystem.getById(meshComponentDefinition.meshFileId, VirtualFileType.Model);
          components.push(new MeshComponentConfig(meshFile));
          break;
        }
        case ComponentDefinitionType.Script: {
          const scriptComponentDefinition = componentDefinition as ScriptComponentDefinition;
          const scriptFile = fileSystem.getById(scriptComponentDefinition.scriptFileId, VirtualFileType.Script);
          components.push(new ScriptComponentConfig(scriptFile));
          break;
        }
        case ComponentDefinitionType.Camera: {
          const cameraComponentDefinition = componentDefinition as CameraComponentDefinition;
          components.push(new CameraComponentConfig());
          break;
        }
        case ComponentDefinitionType.DirectionalLight: {
          const directionalLightComponentDefinition = componentDefinition as DirectionalLightComponentDefinition;
          const color = new Color3(
            directionalLightComponentDefinition.color.r,
            directionalLightComponentDefinition.color.g,
            directionalLightComponentDefinition.color.b,
          );
          components.push(new DirectionalLightComponentConfig(directionalLightComponentDefinition.intensity, color));
          break;
        }
        case ComponentDefinitionType.PointLight: {
          const pointLightComponentDefinition = componentDefinition as PointLightComponentDefinition;
          const color = new Color3(
            pointLightComponentDefinition.color.r,
            pointLightComponentDefinition.color.g,
            pointLightComponentDefinition.color.b,
          );
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
      children = objectDefinition.children.map((childObjectDefinition) => this.loadObjectDefinition(childObjectDefinition, fileSystem));
    }

    let position = new Vector3(objectDefinition.position.x, objectDefinition.position.y, objectDefinition.position.z);
    return new GameObjectConfig(objectDefinition.name, position, objectDefinition.rotation, components, children);
  }
}
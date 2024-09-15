import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";

import { toColor3Babylon, toColor4Babylon } from "@fantasy-console/runtime/src/util";

import { SceneDefinition, SceneObjectDefinition } from "../archive";

import { GameObjectConfig } from "./GameObjectConfig";
import { AssetDb } from "./AssetDb";
import { loadObjectDefinition } from "./util";

/**
 * @NOTE whoops... sorry about this type name
 */
export interface SceneConfigConfiguration {
  clearColor: Color4,
  lighting: {
    ambient: {
      intensity: number;
      color: Color3;
    },
  }
}

/**
 * A game scene "configuration" i.e. loaded from the raw cartridge file
 * but not yet loaded into the game. Think of it like a template.
 */
export class SceneConfig {
  public readonly path: string;
  public readonly objects: GameObjectConfig[];
  public readonly config: SceneConfigConfiguration;

  public constructor(sceneDefinition: SceneDefinition, assetDb: AssetDb) {
    /* Path */
    this.path = sceneDefinition.path;

    /* Config */
    this.config = {
      clearColor: toColor4Babylon(sceneDefinition.config.clearColor),
      lighting: {
        ambient: {
          intensity: sceneDefinition.config.lighting.ambient.intensity,
          color: toColor3Babylon(sceneDefinition.config.lighting.ambient.color),
        },
      }
    }

    /* Game Objects */
    this.objects = [];
    for (let objectDefinition of sceneDefinition.objects) {
      this.objects.push(this.loadObjectDefinition(objectDefinition, assetDb));
    }
  }

  // @NOTE Aliased via property so that subclasses can change the implementation
  protected loadObjectDefinition(objectDefinition: SceneObjectDefinition, assetDb: AssetDb): GameObjectConfig {
    return loadObjectDefinition(objectDefinition, assetDb);
  }
}
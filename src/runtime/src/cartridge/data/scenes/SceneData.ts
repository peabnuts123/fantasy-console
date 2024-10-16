import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";

import { toColor3Babylon, toColor4Babylon } from "@fantasy-console/runtime/src/util";

import { SceneDefinition } from "../../archive";
import { AssetDb } from "../assets/AssetDb";
import { GameObjectData } from "../GameObjectData";
import { loadObjectDefinition } from "../util";

export interface SceneDataConfiguration {
  clearColor: Color4,
  lighting: {
    ambient: {
      intensity: number;
      color: Color3;
    },
  }
}

/**
 * Data for a game scene i.e. loaded from the raw cartridge file
 * but not yet loaded into the game.
 */
export class SceneData {
  public readonly id: string;
  public readonly path: string;
  public readonly objects: GameObjectData[];
  public readonly config: SceneDataConfiguration;

  public constructor(sceneDefinition: SceneDefinition, assetDb: AssetDb) {
    this.id = sceneDefinition.id;

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
      this.objects.push(loadObjectDefinition(objectDefinition, assetDb));
    }
  }
}
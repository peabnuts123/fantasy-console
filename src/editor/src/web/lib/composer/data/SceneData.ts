import { makeAutoObservable } from "mobx";

import { SceneDefinition } from "@fantasy-console/runtime/src/cartridge/archive";
import { AssetDb, SceneDataConfiguration } from "@fantasy-console/runtime/src/cartridge";
import { toColor3Babylon, toColor4Babylon } from "@fantasy-console/runtime/src/util";

import { loadObjectDefinition } from "./loadObjectDefinition";
import { GameObjectData } from "./GameObjectData";

export class SceneData {
  public readonly id: string;
  public path: string;
  public objects: GameObjectData[];
  public config: SceneDataConfiguration;

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

    makeAutoObservable(this)
  }

  /**
   * Get a GameObject in the scene by ID. If no GameObject exists with this ID, an Error is thrown.
   * @param gameObjectId ID of the GameObject to find.
   */
  public getGameObject(gameObjectId: string): GameObjectData {
    const result = this.findGameObject(gameObjectId);
    if (result === undefined) {
      throw new Error(`No GameObject exists with ID '${gameObjectId}' in scene '${this.path}' (${this.id})`);
    }
    return result;
  }

  /**
   * Find a GameObject in the scene by ID.
   * @param gameObjectId ID of the GameObject to find.
   */
  public findGameObject(gameObjectId: string): GameObjectData | undefined {
    for (const object of this.objects) {
      if (object.id === gameObjectId) {
        // Found object as top-level object
        return object;
      } else {
        // Look for object as descendent of top-level object's children
        const childResult = object.findGameObjectInChildren(gameObjectId);
        if (childResult !== undefined) {
          return childResult
        }
      }
    }
  }
}

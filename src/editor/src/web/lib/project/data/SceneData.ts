import { makeAutoObservable } from "mobx";

import { SceneDataConfiguration } from "@polyzone/runtime/src/cartridge";
import { toColor3Core } from "@polyzone/runtime/src/util";

import { AssetDb } from "@lib/project/data/AssetDb";
import { loadObjectDefinition } from "./loadObjectDefinition";
import { GameObjectData } from "./GameObjectData";
import { SceneDefinition, SceneManifest } from "../definition";

export class SceneData {
  public readonly id: string;
  public path: string;
  public hash: string;
  public objects: GameObjectData[];
  public config: SceneDataConfiguration;

  public constructor(sceneDefinition: SceneDefinition, sceneManifest: SceneManifest, assetDb: AssetDb) {
    /* Manifest */
    this.id = sceneManifest.id;
    this.path = sceneManifest.path;
    this.hash = sceneManifest.hash;

    /* Config */
    this.config = {
      clearColor: toColor3Core(sceneDefinition.config.clearColor),
      lighting: {
        ambient: {
          intensity: sceneDefinition.config.lighting.ambient.intensity,
          color: toColor3Core(sceneDefinition.config.lighting.ambient.color),
        },
      },
    };

    /* Game Objects */
    this.objects = [];
    for (const objectDefinition of sceneDefinition.objects) {
      this.objects.push(loadObjectDefinition(objectDefinition, assetDb));
    }

    makeAutoObservable(this);
  }

  /**
   * Get a GameObject in the scene by ID. If no GameObject exists with this ID, an Error is thrown.
   * The only difference between this and {@link findGameObject} is that this throws an Error if no GameObject is found,
   * whereas {@link findGameObject} returns undefined.
   * @param gameObjectId ID of the GameObject to find.
   * @throws Error if no GameObject exists with the given ID.
   */
  public getGameObject(gameObjectId: string): GameObjectData {
    const result = this.findGameObject(gameObjectId);
    if (result === undefined) {
      throw new Error(`No GameObject exists with ID '${gameObjectId}' in scene '${this.path}' (${this.id})`);
    }
    return result;
  }

  /**
   * Find the parent of a GameObject in the scene by its ID. If the GameObject is a top-level object, this will return undefined.
   * If no GameObject exists with the given ID, an Error will be thrown.
   * @param gameObjectId The ID of the GameObject whose parent is to be found.
   */
  public getGameObjectParent(gameObjectId: string): GameObjectData | undefined {
    for (const object of this.objects) {
      if (object.id === gameObjectId) {
        // Found object as top-level object
        return undefined;
      } else {
        // Look for object as descendent of top-level object's children
        const childResult = object.findGameObjectParentInChildren(gameObjectId);
        if (childResult !== undefined) {
          return childResult;
        }
      }
    }

    throw new Error(`No GameObject exists with ID '${gameObjectId}' in scene '${this.path}' (${this.id})`);
  }

  /**
   * Find a GameObject in the scene by ID.
   * The only difference between this and {@link getGameObject} is that this returns undefined if no GameObject is found,
   * whereas {@link getGameObject} throws an Error.
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
          return childResult;
        }
      }
    }
  }
}

import type { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { GameObject, GameObjectData } from "./GameObject";


/**
 * The game world, containing all the current {@link GameObject}s
 * and everything loaded in the game.
 */
export class World {
  /** Reference to the game's Babylon scene. */
  private readonly scene: Scene;
  /** All {@link GameObject}s currently in the world. */
  private readonly gameObjects: GameObject[];
  /** Counter for unique {@link GameObject} IDs */
  private nextGameObjectId = 1000; // @TODO base this on the scene max or something

  public constructor(scene: Scene) {
    this.scene = scene;
    this.gameObjects = [];
  }

  /**
   * Called once per frame.
   * @param deltaTime Time (in seconds) since the last frame.
   */
  public update(deltaTime: number): void {
    this.gameObjects.forEach(gameObject => gameObject.update(deltaTime));
  }

  /**
   * Destroy the world and everything in it.
   */
  public destroy() {
    this.gameObjects.forEach(gameObject => gameObject.destroy());
  }

  /**
   * Create a new GameObject and add it to the world.
   * @param data Constructor data for new {@link GameObject}
   * @returns The new {@link GameObject} instance.
   */
  public createGameObject(data: GameObjectData) {
    const id = this.getNextGameObjectId();
    const transform = new TransformNode(`GameObject(${id})`, this.scene);
    const gameObject = new GameObject(transform, this, id, data);
    this.gameObjects.push(gameObject);
    return gameObject;
  }

  /**
   * Destroys a {@link GameObject}, removing it from the world.
   * @param gameObject The {@link GameObject} to remove.
   */
  public destroyObject(gameObject: GameObject) {
    const index = this.gameObjects.indexOf(gameObject);
    if (index === -1) {
      console.error(`[World] (destroyObject) Attempted to destroy object that does not exist in the world: ${gameObject}`);
    } else {
      gameObject.onDestroy();
      this.gameObjects.splice(index, 1);
    }
  }

  private getNextGameObjectId(): number {
    return this.nextGameObjectId++;
  }
}

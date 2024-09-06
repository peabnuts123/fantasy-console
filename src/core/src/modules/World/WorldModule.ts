import { IModule } from '../IModule';
import { GameObject } from "../../world/GameObject";

import { WorldQuery, IQueryResult, GameObjectQuery } from './WorldQuery';

export type QueryFn<TQuery, TResult> = (query: TQuery) => IQueryResult<TResult>;

/**
 * The game world, containing all the current {@link GameObject}s
 * and everything loaded in the game.
 */
export class WorldModule implements IModule {
  /** All {@link GameObject}s currently in the world. */
  public readonly gameObjects: GameObject[];

  public constructor() {
    this.gameObjects = [];
  }

  /**
   * @internal
   */
  public onInit() {
  }

  /**
   * Called once per frame.
   * @param deltaTime Time (in seconds) since the last frame.
   */
  public onUpdate(deltaTime: number): void {
    this.gameObjects.forEach(gameObject => gameObject.update(deltaTime));
  }

  /**
   * Destroy the world and everything in it.
   */
  public addObject(gameObject: GameObject) {
    this.gameObjects.push(gameObject);
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

  public query<TResult>(queryFn: QueryFn<WorldQuery, TResult>): TResult;
  public query<TResult>(relativeTo: GameObject, queryFn: QueryFn<GameObjectQuery, TResult>): TResult;
  public query<TResult>(relativeToOrQueryFn: GameObject | QueryFn<WorldQuery, TResult>, maybeQueryFn?: QueryFn<GameObjectQuery, TResult>): TResult {
    let result: IQueryResult<TResult>;
    if (relativeToOrQueryFn instanceof GameObject) {
      // Relative query to a game object
      const relativeTo = relativeToOrQueryFn;
      const queryFn = maybeQueryFn!;
      result = queryFn(new GameObjectQuery(relativeTo));
    } else {
      // Absolute query relative to world
      const queryFn = relativeToOrQueryFn;
      result = queryFn(new WorldQuery(this));
    }

    return result.result;
  }

  /**
   * @internal
   */
  public dispose(): void {
    // @NOTE copy into temp array to modify `this.gameObjects` while iterating
    [...this.gameObjects].forEach(gameObject => gameObject.destroy());
  }
}

export const World = new WorldModule();

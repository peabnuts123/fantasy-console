import { GameObjectComponent, Transform } from "../../world";
import { GameObject } from "../../world/GameObject";
import { WorldModule } from './WorldModule';


export interface IQueryResult<TResult> {
  get result(): TResult;
}

export type ClassReference<TClass> = { prototype: TClass } & Function;

export class QueryUtils {
  public static getPathSegments(pathString: string): string[] {
    return pathString
      .replace(/(?:^\/+|\/+$)/g, '') // Replace leading and trailing slashes
      .replace(/\/+/g, '/') // Collapse any consecutive slashes into single slashes
      .split('/');
  }

  public static resolvePath(path: string, initialTransformList: Transform[], initialTransform: Transform | undefined): Transform {
    // Normalize path into segments (don't bother canonicalising)
    const pathSegments = QueryUtils.getPathSegments(path);

    if (pathSegments.length === 0) {
      throw new Error(`Could not resolve empty path: ${path}`);
    }

    /**
     * Stateful iteration property.
     * This will be the result once iteration stops
     */
    let currentTransform = initialTransform;
    /**
     * List of transforms we are currently searching for `segment` in
     */
    let currentTransformList = initialTransformList;
    /**
     * Full stack of segments that have been processed (including the current segment).
     * This is just used for diagnostic messages.
     */
    let processedSegments: string[] = [];

    // Iterate from the initial context, one segment at a time
    for (const segment of pathSegments) {
      processedSegments.push(segment);

      // Look up the heirarchy, i.e. the current state's parent
      if (segment === '..') {
        let parent = currentTransform?.parent;
        if (parent === undefined) {
          throw new Error(`Could not resolve path: '${processedSegments.join('/')}'. Attempted to resolve parent node '..' from the world root`);
        } else {
          currentTransform = parent;
          currentTransformList = parent.children;
        }
      } else {
        // Find the transform with the matching name as the current segment
        let matchingTransform = currentTransformList.find((transform) => transform.gameObject.name === segment);
        if (matchingTransform === undefined) {
          // Iteration ended since path does not match any transforms
          throw new Error(`No object exists at path: '${processedSegments.join('/')}'`)
        }

        // Update iteration state
        currentTransform = matchingTransform;
        currentTransformList = matchingTransform.children;
      }
    }

    // Sanity check. Should not be possible (but type system cannot prove it)
    if (currentTransform === undefined) {
      throw new Error(`Unhandled scenario. resolvePath() returned undefined!`);
    }

    return currentTransform;
  }
}

export class WorldQuery {
  private world: WorldModule;

  public constructor(world: WorldModule) {
    this.world = world;

    // Self-binding to support destructuring `WorldQuery` instances
    this.path = this.path.bind(this);
  }

  public path(pathString: string): GameObjectQuery {
    const allWorldTransforms = this.world.gameObjects.map((gameObject) => gameObject.transform);
    let transform = QueryUtils.resolvePath(pathString, allWorldTransforms, undefined);
    return new GameObjectQuery(transform.gameObject);
  }
}

export class GameObjectQuery implements IQueryResult<GameObject> {
  private gameObject: GameObject;
  public constructor(gameObject: GameObject) {
    this.gameObject = gameObject;

    // Self-binding to support destructuring `WorldQuery` instances
    this.path = this.path.bind(this);
    this.component = this.component.bind(this);
  }

  public path(pathString: string): GameObjectQuery {
    let transform = QueryUtils.resolvePath(pathString, this.gameObject.transform.children, this.gameObject.transform);
    return new GameObjectQuery(transform.gameObject);
  }

  public component<TGameObjectComponent extends GameObjectComponent>(componentCtor: ClassReference<TGameObjectComponent>): GameObjectComponentQuery<TGameObjectComponent> {
    const components = this.gameObject.components.filter((component) => {
      return component instanceof componentCtor;
    }) as TGameObjectComponent[];

    if (components.length === 0) {
      throw new Error(`No component of type '${componentCtor.name}' found on ${this.gameObject}`);
    } else if (components.length > 1) {
      // @TODO
      throw new Error(`Not yet implemented. ${this.gameObject} has multiple instances of '${componentCtor.name}' component on it`);
    } else {
      return new GameObjectComponentQuery(components[0]);
    }
  }

  public get result(): GameObject {
    return this.gameObject;
  }

}

export class GameObjectComponentQuery<TGameObjectComponent extends GameObjectComponent> implements IQueryResult<TGameObjectComponent> {
  private component: TGameObjectComponent;
  public constructor(component: TGameObjectComponent) {
    this.component = component;
  }

  public get result(): TGameObjectComponent {
    return this.component;
  }
}

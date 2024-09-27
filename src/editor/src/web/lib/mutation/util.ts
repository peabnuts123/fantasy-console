import { GameObjectConfigComposer, SceneConfigComposer } from "@lib/composer/config";
import { MutationPath, resolvePath, ResolvePathSelector } from "@lib/util/JsoncContainer";

/**
 * Find the path of a GameObject relative to a parent GameObject by recursively searching
 * its children.
 * @param id ID of the GameObject to find.
 * @param parentObject Parent GameObject in which to search.
 */
function findGameObject(id: string, parentObject: GameObjectConfigComposer): [GameObjectConfigComposer, MutationPath] | undefined {
  // Iterate children objects
  for (let i = 0; i < parentObject.children.length; i++) {
    const object = parentObject.children[i];
    const objectPath = resolvePath<GameObjectConfigComposer>((parent) => parent.children[i]);
    if (object.id === id) {
      // Found object as child of parent
      return [object, objectPath];
    } else {
      // Look for object as descendent of child
      const childResult = findGameObject(id, object);
      if (childResult !== undefined) {
        const [targetObject, childPath] = childResult;
        return [targetObject, objectPath.concat(childPath)];
      }
    }
  }
}

/**
 * Given the ID of a GameObject, find its path in the hierarchy of the scene. Additionally,
 * resolve a path relative to this GameObject and return the entire path to the relative property.
 * Intended for JSONC mutation.
 * @param targetId ID of the GameObject to find
 * @param scene Scene in which to find the GameObject
 * @param pathSelector Path resolver function to select a path relative to the target GameObject.
 * @returns The entire path from the scene root to the property returned by `pathSelector`, for use in JSONC mutation.
 * @example
 * ```typescript
 * const path = resolvePathForSceneObjectMutation(gameObject.id, scene, (gameObject) => gameObject.transform.position);
 * console.log(path); // Prints `["objects", 1, "children", 2, "transform", "position"]
 * ```
 */
export function resolvePathForSceneObjectMutation(targetId: string, scene: SceneConfigComposer, pathSelector: ResolvePathSelector<GameObjectConfigComposer>): MutationPath {
  let target: [GameObjectConfigComposer, MutationPath] | undefined = undefined;

  for (let i = 0; i < scene.objects.length; i++) {
    const object = scene.objects[i];
    const objectPath = resolvePath<SceneConfigComposer>((scene) => scene.objects[i]);
    if (object.id === targetId) {
      // Found object as top-level object
      target = [object, objectPath];
      break;
    } else {
      // Look for object as descendent of top-level object
      const childResult = findGameObject(targetId, object);
      if (childResult !== undefined) {
        const [targetObject, childPath] = childResult;
        target = [targetObject, objectPath.concat(childPath)];
        break;
      }
    }
  }

  if (target === undefined) {
    throw new Error(`Could not find any object in scene '${scene.path}' with id: '${targetId}'`)
  }

  // @NOTE No need for the actual game object at this time, but left it in anyways 🤷‍♀️
  const [_, mutationPath] = target;
  const relativePath = resolvePath(pathSelector);

  const debug_result = mutationPath.concat(relativePath);
  console.log(`[resolvePathForSceneObjectMutation] Resolved path: ${debug_result.map((x) => typeof(x) === 'number' ? `[${x}]` : `.${x}`).join('')}`);
  return debug_result;
}

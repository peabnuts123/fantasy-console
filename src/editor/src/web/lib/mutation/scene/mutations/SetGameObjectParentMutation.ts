import { GameObjectDefinition, SceneDefinition } from "@fantasy-console/runtime/src/cartridge";
import { toVector3Definition } from "@fantasy-console/runtime/src/util";

import { GameObjectData } from "@lib/composer/data";
import { readPathInScene, resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { MutationPath, resolvePath } from "@lib/util/JsoncContainer";

import { ISceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";

interface SetGameObjectParentMutationArgs {
  gameObject: GameObjectData;
  newParent: GameObjectData | undefined;
}
interface SetGameObjectParentMutationBeforeArgs extends SetGameObjectParentMutationArgs {
  before: GameObjectData;
}
interface SetGameObjectParentMutationAfterArgs extends SetGameObjectParentMutationArgs {
  after: GameObjectData;
}

interface SiblingTarget {
  type: 'before' | 'after',
  gameObjectId: string;
}

export class SetGameObjectParentMutation implements ISceneMutation {
  // Mutation parameters
  private readonly gameObjectId: string;
  private readonly gameObjectName: string;
  private readonly newParentId: string | undefined;

  private readonly siblingTarget: SiblingTarget | undefined;

  public constructor(args: SetGameObjectParentMutationArgs | SetGameObjectParentMutationBeforeArgs | SetGameObjectParentMutationAfterArgs) {
    const { gameObject, newParent } = args;
    this.gameObjectId = gameObject.id;
    this.gameObjectName = gameObject.name;
    this.newParentId = newParent?.id;

    if ('before' in args) {
      this.siblingTarget = {
        type: 'before',
        gameObjectId: args.before.id,
      };
    } else if ('after' in args) {
      this.siblingTarget = {
        type: 'after',
        gameObjectId: args.after.id,
      };
    } else {
      this.siblingTarget = undefined;
    }
  }

  public apply({ SceneViewController }: SceneViewMutationArguments): void {
    // 1A. Update data
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const newParentData = this.newParentId !== undefined ? SceneViewController.scene.getGameObject(this.newParentId) : undefined;
    let newSiblingDataCollection = newParentData !== undefined ?
      newParentData.children :
      SceneViewController.scene.objects;
    const currentParentData = SceneViewController.scene.getGameObjectParent(this.gameObjectId);
    const currentParentChildrenData = currentParentData !== undefined ? currentParentData.children : SceneViewController.scene.objects;

    // Remove from old parent
    const currentGameObjectDataIndex = currentParentChildrenData.findIndex((child) => child.id === this.gameObjectId);
    if (currentGameObjectDataIndex === -1) throw new Error(`Cannot apply mutation - cannot find object with ID '${this.gameObjectId}' ${currentParentData === undefined ? "as top-level object" : `as child of object with ID '${currentParentData.id}'`}`);
    currentParentChildrenData.splice(currentGameObjectDataIndex, 1);

    // Add to new parent
    if (this.siblingTarget === undefined) {
      // No specific index in children, just add new child
      newSiblingDataCollection.push(gameObjectData);
    } else {
      // Add object before/after specific child
      const siblingIndex = newSiblingDataCollection.findIndex((object) => object.id === this.siblingTarget!.gameObjectId);
      if (siblingIndex === -1) throw new Error(`Cannot apply mutation - cannot find object with ID '${this.siblingTarget.gameObjectId}' ${this.newParentId === undefined ? "as top-level object" : `as child of object with ID '${this.newParentId}'`}`);
      if (this.siblingTarget.type === 'before') {
        if (siblingIndex === 0) {
          // Add item as first child
          newSiblingDataCollection.unshift(gameObjectData);
        } else {
          // Insert item before sibling
          newSiblingDataCollection.splice(siblingIndex, 0, gameObjectData);
        }
      } else {
        if (siblingIndex === newSiblingDataCollection.length - 1) {
          // Add item as last child
          newSiblingDataCollection.push(gameObjectData);
        } else {
          // Insert item after sibling
          newSiblingDataCollection.splice(siblingIndex + 1, 0, gameObjectData);
        }
      }
    }

    // 1B*
    // Now we need to update the object's transform so that it doesn't move in world space
    // This involves recalculating the absolute position / rotation / scale of the object
    //  which we could do but would be complicated and error-prone. We can instead just update the
    //  Babylon scene and read the results from there.

    // 2. Update scene
    const gameObject = gameObjectData.sceneInstance!;
    if (newParentData !== undefined) {
      // Set parent to new object
      const newParent = newParentData.sceneInstance!;
      gameObject.transform.parent = newParent.transform;
    } else {
      // Set parent to undefined i.e. top-level object
      gameObject.transform.parent = undefined;
    }
    // @TODO update World list of object instances if parent is null (?)

    // 1B. Update transform with new absolute values
    const newLocalPosition = gameObject.transform.localPosition;
    const newLocalRotation = gameObject.transform.localRotation;
    const newLocalScale = gameObject.transform.localScale;

    gameObjectData.transform.position = newLocalPosition;
    gameObjectData.transform.rotation = newLocalRotation;
    gameObjectData.transform.scale = newLocalScale;

    // 3. Update JSONC
    // Find the current path of the game object that is being reparented
    const currentPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
    );
    // Store the current definition of the game object being reparented
    const currentDefinitionValue = readPathInScene(currentPath, SceneViewController.sceneDefinition);
    // Remove the target game object from the scene definition
    SceneViewController.sceneJson.delete(currentPath);

    // Update object definition before writing back to JSON
    currentDefinitionValue.transform.position = toVector3Definition(newLocalPosition);
    currentDefinitionValue.transform.rotation = toVector3Definition(newLocalRotation);
    currentDefinitionValue.transform.scale = toVector3Definition(newLocalScale);

    // Read parent data (if specified)
    let newParentDefinition: GameObjectDefinition | undefined = undefined;
    if (this.newParentId !== undefined) {
      const newParentPath = resolvePathForSceneObjectMutation(
        this.newParentId,
        SceneViewController.sceneDefinition,
      );
      newParentDefinition = readPathInScene(newParentPath, SceneViewController.sceneDefinition);
    }

    // Find the new path of the thing
    let newJsonPath: MutationPath<GameObjectDefinition>;
    if (this.siblingTarget === undefined) {
      // No specific index in children, just add new child
      if (newParentDefinition === undefined) {
        // Object is to be a top-level object
        newJsonPath = resolvePath((scene: SceneDefinition) => scene.objects[SceneViewController.sceneDefinition.objects.length]);
      } else {
        // Object is to be a child of another object
        newJsonPath = resolvePathForSceneObjectMutation(
          this.newParentId!,
          SceneViewController.sceneDefinition,
          (newParent) => newParent.children![newParentDefinition?.children?.length ?? 0]
        )
      }
    } else {
      // Add object before/after specific child sibling
      let indexOffset = this.siblingTarget.type === 'before' ? 0 : 1;
      if (newParentDefinition === undefined) {
        // Sibling is a top-level object
        const siblingJsonIndex = SceneViewController.sceneDefinition.objects.findIndex((object) => object.id === this.siblingTarget!.gameObjectId);
        newJsonPath = resolvePath((scene: SceneDefinition) => scene.objects[siblingJsonIndex + indexOffset]);
      } else {
        // Sibling is a child of another object
        const siblingJsonIndex = newParentDefinition?.children?.findIndex((object) => object.id === this.siblingTarget!.gameObjectId);
        if (siblingJsonIndex === undefined) {
          throw new Error(`Cannot apply mutation - cannot find object with ID '${this.siblingTarget.gameObjectId}' ${this.newParentId === undefined ? "as top-level object" : `as child of object with ID '${this.newParentId}'`}`);
        }
        newJsonPath = resolvePathForSceneObjectMutation(
          this.newParentId!,
          SceneViewController.sceneDefinition,
          (newParent) => newParent.children![siblingJsonIndex + indexOffset]
        );
      }
    }

    // Add the definition at the new path
    SceneViewController.sceneJson.mutate(newJsonPath, currentDefinitionValue, { isArrayInsertion: true });
  }

  public undo(args: SceneViewMutationArguments): void {
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `Move ${this.gameObjectName} in scene Hierarchy`;
  }
}

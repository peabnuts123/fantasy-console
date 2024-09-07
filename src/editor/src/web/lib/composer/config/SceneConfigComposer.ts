import { SceneDefinition, SceneObjectDefinition } from "@fantasy-console/runtime/src/cartridge/archive";
import { AssetDb, SceneConfig } from "@fantasy-console/runtime/src/cartridge/config";

import { loadObjectDefinition } from "./loadObjectDefinition";
import { makeObservable, observable } from "mobx";
import { GameObjectConfigComposer } from "./GameObjectConfigComposer";

export class SceneConfigComposer extends SceneConfig {
  // @NOTE Override base types
  declare public readonly objects: GameObjectConfigComposer[];

  public constructor(sceneDefinition: SceneDefinition, assetDb: AssetDb) {
    super(sceneDefinition, assetDb);
    makeObservable(this, {
      path: observable,
      objects: observable,
      config: observable,
    })
  }

  protected override loadObjectDefinition(objectDefinition: SceneObjectDefinition, assetDb: AssetDb): GameObjectConfigComposer {
    // @NOTE use composer version of `loadObjectDefinition` to produce Composer versions of each class
    return loadObjectDefinition(objectDefinition, assetDb);
  }
}

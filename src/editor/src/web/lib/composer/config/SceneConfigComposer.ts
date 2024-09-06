import { SceneDefinition, SceneObjectDefinition } from "@fantasy-console/runtime/src/cartridge/archive";
import { AssetDb, GameObjectConfig, SceneConfig } from "@fantasy-console/runtime/src/cartridge/config";

import { loadObjectDefinition } from "./loadObjectDefinition";
import { makeObservable, observable } from "mobx";

export class SceneConfigComposer extends SceneConfig {

  public constructor(sceneDefinition: SceneDefinition, assetDb: AssetDb) {
    super(sceneDefinition, assetDb);
    makeObservable(this, {
      path: observable,
      objects: observable,
      config: observable,
    })
  }

  protected override loadObjectDefinition(objectDefinition: SceneObjectDefinition, assetDb: AssetDb): GameObjectConfig {
    // @NOTE use composer version of `loadObjectDefinition` to produce Composer versions of each class
    return loadObjectDefinition(objectDefinition, assetDb);
  }
}

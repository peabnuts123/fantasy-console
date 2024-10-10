import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

import { GameObjectData } from "@lib/composer/data";


export class ComposerSelectionCache {
  private cache: Map<AbstractMesh, GameObjectData>;

  public constructor() {
    this.cache = new Map();
  }

  public get(asset: AbstractMesh): GameObjectData | undefined {
    return this.cache.get(asset);
  }

  public add(gameObjectData: GameObjectData, assets: AbstractMesh[]) {
    for (const asset of assets) {
      this.cache.set(asset, gameObjectData);
    }
  }

  public remove(assets: AbstractMesh[]) {
    for (const asset of assets) {
      this.cache.delete(asset);
    }
  }
}

import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

import { GameObjectConfigComposer } from "@lib/composer/config/GameObjectConfigComposer";


export class ComposerSelectionCache {
  private cache: Map<AbstractMesh, GameObjectConfigComposer>;

  public constructor() {
    this.cache = new Map();
  }

  public get(asset: AbstractMesh): GameObjectConfigComposer | undefined {
    return this.cache.get(asset);
  }

  public add(gameObjectConfig: GameObjectConfigComposer, assets: AbstractMesh[]) {
    for (const asset of assets) {
      this.cache.set(asset, gameObjectConfig);
    }
  }

  public remove(assets: AbstractMesh[]) {
    for (const asset of assets) {
      this.cache.delete(asset);
    }
  }
}

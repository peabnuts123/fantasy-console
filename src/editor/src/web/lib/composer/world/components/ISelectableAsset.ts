import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { GameObject } from "@fantasy-console/core/src/world"

export type ComposerSelectionCache = Map<AbstractMesh, GameObject>;

export interface ISelectableAsset {
  addToSelectionCache(cache: ComposerSelectionCache): void;
  removeFromSelectionCache(cache: ComposerSelectionCache): void;
}
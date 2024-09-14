import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

export interface ISelectableAsset {
  get allSelectableMeshes(): AbstractMesh[];
}

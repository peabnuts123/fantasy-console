import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

export interface ISelectableObject {
  get allSelectableMeshes(): AbstractMesh[];
}

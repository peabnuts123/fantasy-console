import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

export interface ISelectableObject {
  get allSelectableMeshes(): AbstractMesh[];
}

export function isSelectableObject(object: object | undefined): object is ISelectableObject {
  return typeof object === 'object' && 'allSelectableMeshes' in object;
}

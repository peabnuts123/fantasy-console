import { makeAutoObservable } from "mobx";

import type { MeshAssetData } from "@fantasy-console/runtime/src/cartridge";

import type { MeshComponent } from "@lib/composer/scene/components";
import type { IComposerComponentData } from "./IComposerComponentData";

export class MeshComponentData implements IComposerComponentData {
  public readonly id: string;
  /** {@link MeshAssetData} containing the mesh asset. */
  public meshAsset: MeshAssetData;

  public componentInstance: MeshComponent | undefined = undefined;

  public constructor(id: string, meshAsset: MeshAssetData) {
    this.id = id;
    this.meshAsset = meshAsset;

    makeAutoObservable(this);
  }

  get componentName(): string {
    return `Mesh`;
  }
}

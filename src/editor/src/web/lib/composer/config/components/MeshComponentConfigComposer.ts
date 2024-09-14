import { computed, makeObservable, observable } from "mobx";

import { AssetConfig, MeshComponentConfig } from "@fantasy-console/runtime/src/cartridge/config";

import { MeshComponentComposer } from "@lib/composer/scene/components";
import { IComposerComponentConfig } from "./IComposerComponentConfig";

export class MeshComponentConfigComposer extends MeshComponentConfig implements IComposerComponentConfig {
  public componentInstance: MeshComponentComposer | undefined = undefined;

  public constructor(meshAsset: AssetConfig) {
    super(meshAsset);

    makeObservable(this, {
      meshAsset: observable,
      componentInstance: observable,
    });
  }

  get componentName(): string {
    return `Mesh`;
  }
}

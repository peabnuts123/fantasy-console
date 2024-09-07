import { computed, makeObservable, observable } from "mobx";

import { AssetConfig, MeshComponentConfig } from "@fantasy-console/runtime/src/cartridge/config";

import { MeshComponentComposer } from "@lib/composer/world/components/MeshComponentComposer";
import { IComposerComponentConfig } from "./IComposerComponentConfig";

export class MeshComponentConfigComposer extends MeshComponentConfig implements IComposerComponentConfig {
  private _componentInstance: MeshComponentComposer | undefined = undefined;

  public constructor(meshAsset: AssetConfig) {
    super(meshAsset);

    makeObservable(this, {
      meshAsset: observable,
      componentInstance: computed,
    });
  }

  public set componentInstance(instance: MeshComponentComposer | undefined) {
    this._componentInstance = instance;
  }

  public get componentInstance(): MeshComponentComposer | undefined {
    return this._componentInstance;
  }

  get componentName(): string {
    return `Mesh`;
  }
}

import { makeAutoObservable } from "mobx";

import type { ScriptAssetData } from "@fantasy-console/runtime/src/cartridge";

import { IComposerComponentData } from "./IComposerComponentData";

export class ScriptComponentData implements IComposerComponentData {
  public readonly id: string;
  /** {@link ScriptAssetData} containing the script asset. */
  public scriptAsset: ScriptAssetData;

  public constructor(id: string, scriptAsset: ScriptAssetData) {
    this.id = id;
    this.scriptAsset = scriptAsset;

    makeAutoObservable(this);
  }
  get componentName(): string {
    return `Script`;
  }
}

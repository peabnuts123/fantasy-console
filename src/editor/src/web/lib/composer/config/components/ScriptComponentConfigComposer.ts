import { makeObservable, observable } from "mobx";

import { AssetConfig, ScriptComponentConfig } from "@fantasy-console/runtime/src/cartridge/config";

import { IComposerComponentConfig } from "./IComposerComponentConfig";

export class ScriptComponentConfigComposer extends ScriptComponentConfig implements IComposerComponentConfig {
  public constructor(scriptAsset: AssetConfig) {
    super(scriptAsset);

    makeObservable(this, {
      scriptAsset: observable,
    });
  }
  get componentName(): string {
    return `Script`;
  }
}

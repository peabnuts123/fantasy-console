import { makeObservable, observable } from "mobx";

import { GameObjectConfig } from "@fantasy-console/runtime/src/cartridge/config";

import { IComposerComponentConfig } from "./components";
import { TransformConfigComposer } from "./TransformConfigComposer";
import { GameObjectBabylon } from "@fantasy-console/runtime/src/world/GameObjectBabylon";

export class GameObjectConfigComposer extends GameObjectConfig {
  // @NOTE Override base types
  declare public transform: TransformConfigComposer;
  declare public components: IComposerComponentConfig[];
  declare public children: GameObjectConfigComposer[];

  public sceneInstance: GameObjectBabylon | undefined = undefined;

  public constructor(id: string, name: string, transform: TransformConfigComposer, components: IComposerComponentConfig[], children: GameObjectConfigComposer[]) {
    super(id, name, transform, components, children);

    makeObservable(this, {
      children: observable,
      components: observable,
      id: observable,
      name: observable,
      transform: observable,
      sceneInstance: observable,
    });
  }
}

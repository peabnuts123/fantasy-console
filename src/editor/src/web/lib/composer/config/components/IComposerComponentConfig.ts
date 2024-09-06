import { GameObjectComponent } from "@fantasy-console/core";

/**
 * A version of a component config used by the composer that has a reference
 * to the component instance.
 */
export interface IComposerComponentConfig<TComponentInstance extends GameObjectComponent> {
  set componentInstance(instance: TComponentInstance | undefined);
  get componentInstance(): TComponentInstance | undefined;
}

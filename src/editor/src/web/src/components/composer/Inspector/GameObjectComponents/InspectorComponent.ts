import type { FunctionComponent } from "react";

import type { GameObjectData, IComposerComponentData } from "@lib/composer/data";
import { SceneViewController } from "@lib/composer/scene";

export interface InspectorComponentProps<TComponentType extends IComposerComponentData> {
  component: TComponentType;
  controller: SceneViewController;
  gameObject: GameObjectData;
}

export type InspectorComponent<TComponentType extends IComposerComponentData> = FunctionComponent<InspectorComponentProps<TComponentType>>;

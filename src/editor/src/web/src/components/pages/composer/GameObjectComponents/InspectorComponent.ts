import { IComposerComponentConfig } from "@lib/composer/config/components";
import { FunctionComponent } from "react";

export interface InspectorComponentProps<TComponentType extends IComposerComponentConfig> {
  component: TComponentType;
}

export type InspectorComponent<TComponentType extends IComposerComponentConfig> = FunctionComponent<InspectorComponentProps<TComponentType>>;

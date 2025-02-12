import {
  CameraComponentData,
  DirectionalLightComponentData,
  IComposerComponentData,
  MeshComponentData,
  PointLightComponentData,
  ScriptComponentData,
} from "@lib/project/data";
import type { FunctionComponent } from "react";
import type { InspectorComponent } from "./InspectorComponent";
import { InspectorComponentBase } from "./InspectorComponentBase";
import { MeshComponentInspector } from "./MeshComponentInspector";
import { ScriptComponentInspector } from "./ScriptComponentInspector";
import { CameraComponentInspector } from "./CameraComponentInspector";
import { DirectionalLightInspector } from "./DirectionalLightInspector";
import { PointLightInspector } from "./PointLightInspector";

export * from './CameraComponentInspector';
export * from './DirectionalLightInspector';
export * from './InspectorComponent';
export * from './InspectorComponentBase';
export * from './MeshComponentInspector';
export * from './PointLightInspector';
export * from './ScriptComponentInspector';

const UnimplementedComponentInspector: InspectorComponent<IComposerComponentData> = ({ component, controller, gameObject }) => {
  return (
    <InspectorComponentBase component={component} controller={controller} gameObject={gameObject}>
      <p className="italic">Unimplemented Inspector UI!</p>
    </InspectorComponentBase>
  );
};

export function getInspectorFor<TComponentType extends IComposerComponentData>(gameObjectComponentConfig: TComponentType): InspectorComponent<TComponentType> {
  // @NOTE Assigning to a loosely-typed variable just to launder these types a bit
  // Seems TypeScript can't infer that if `gameObjectComponentConfig instanceof A` then result should be `InspectorComponent<A>`
  let result: FunctionComponent<any>;
  if (gameObjectComponentConfig instanceof MeshComponentData) {
    result = MeshComponentInspector;
  } else if (gameObjectComponentConfig instanceof ScriptComponentData) {
    result = ScriptComponentInspector;
  } else if (gameObjectComponentConfig instanceof CameraComponentData) {
    result = CameraComponentInspector;
  } else if (gameObjectComponentConfig instanceof DirectionalLightComponentData) {
    result = DirectionalLightInspector;
  } else if (gameObjectComponentConfig instanceof PointLightComponentData) {
    result = PointLightInspector;
  } else {
    result = UnimplementedComponentInspector;
  }
  return result;
}

import {
  CameraComponentConfigComposer,
  DirectionalLightComponentConfigComposer,
  IComposerComponentConfig,
  MeshComponentConfigComposer,
  PointLightComponentConfigComposer,
  ScriptComponentConfigComposer,
} from "@lib/composer/config/components";
import { FunctionComponent } from "react";
import { InspectorComponent } from "./InspectorComponent";
import { InspectorComponentBase } from "./InspectorComponentBase";
import { MeshComponentInspector } from "./MeshComponentInspector";
import { ScriptComponentInspector } from "./ScriptComponentInspector";
import { CameraComponentInspector } from "./CameraComponentInspector";
import { DirectionalLightInspector } from "./DirectionalLightInspector";
import { PointLightInspector } from "./PointLightInspector";

const UnimplementedComponentInspector: InspectorComponent<IComposerComponentConfig> = ({ component }) => {
  return (
    <InspectorComponentBase component={component}>
      <p className="italic">Unimplemented Inspector UI!</p>
    </InspectorComponentBase>
  )
};

export function getInspectorFor<TComponentType extends IComposerComponentConfig>(gameObjectComponentConfig: TComponentType): InspectorComponent<TComponentType> {
  // @NOTE Assigning to a loosely-typed variable just to launder these types a bit
  // Seems TypeScript can't infer that if `gameObjectComponentConfig instanceof A` then result should be `InspectorComponent<A>`
  let result: FunctionComponent<any>;
  if (gameObjectComponentConfig instanceof MeshComponentConfigComposer) {
    result = MeshComponentInspector;
  } else if (gameObjectComponentConfig instanceof ScriptComponentConfigComposer) {
    result = ScriptComponentInspector;
  } else if (gameObjectComponentConfig instanceof CameraComponentConfigComposer) {
    result = CameraComponentInspector;
  } else if (gameObjectComponentConfig instanceof DirectionalLightComponentConfigComposer) {
    result = DirectionalLightInspector;
  } else if (gameObjectComponentConfig instanceof PointLightComponentConfigComposer) {
    result = PointLightInspector;
  } else {
    result = UnimplementedComponentInspector;
  }
  return result;
}

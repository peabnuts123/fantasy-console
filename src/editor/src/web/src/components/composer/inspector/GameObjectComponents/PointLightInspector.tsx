import type { PointLightComponentData } from "@lib/composer/data";
import { ColorInput } from "../ColorInput";
import type { InspectorComponent } from "./InspectorComponent";
import { InspectorComponentBase } from "./InspectorComponentBase";

export const PointLightInspector: InspectorComponent<PointLightComponentData> = ({ component, controller, gameObject }) => {
  return (
    <InspectorComponentBase component={component} controller={controller} gameObject={gameObject}>
      <label>
        <ColorInput label="Color" color={component.color} />
        <label>
          <span className="font-bold">Intensity</span>
          <input type="text" value={component.intensity} readOnly={true} className="w-full p-1" />
        </label>
      </label>
    </InspectorComponentBase>
  )
};

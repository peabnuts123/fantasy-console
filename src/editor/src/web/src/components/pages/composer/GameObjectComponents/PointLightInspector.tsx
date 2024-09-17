import { PointLightComponentConfigComposer } from "@lib/composer/config/components";
import { InspectorComponent } from "./InspectorComponent";
import { InspectorComponentBase } from "./InspectorComponentBase";
import { ColorInput } from "../inspector/ColorInput";

export const PointLightInspector: InspectorComponent<PointLightComponentConfigComposer> = ({ component }) => {
  return (
    <InspectorComponentBase component={component}>
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

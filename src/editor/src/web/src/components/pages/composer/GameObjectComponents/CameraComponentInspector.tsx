import { CameraComponentConfigComposer } from "@lib/composer/config/components";
import { InspectorComponent } from "./InspectorComponent";
import { InspectorComponentBase } from "./InspectorComponentBase";

export const CameraComponentInspector: InspectorComponent<CameraComponentConfigComposer> = ({ component }) => {
  return (
    <InspectorComponentBase component={component}>
      <label>
        <p className="italic">I am a camera! *takes photo of nearby tree*</p>
      </label>
    </InspectorComponentBase>
  )
};

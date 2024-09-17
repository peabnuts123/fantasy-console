import { ScriptComponentConfigComposer } from "@lib/composer/config/components";
import { InspectorComponent } from "./InspectorComponent";
import { InspectorComponentBase } from "./InspectorComponentBase";

export const ScriptComponentInspector: InspectorComponent<ScriptComponentConfigComposer> = ({ component }) => {
  return (
    <InspectorComponentBase component={component}>
      <label>
        <span className="font-bold">Script</span>
        <input type="text" value={component.scriptAsset.path} readOnly={true} className="w-full p-1" />
      </label>
    </InspectorComponentBase>
  )
};

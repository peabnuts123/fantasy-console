import type { ScriptComponentData } from "@lib/composer/data";
import type { InspectorComponent } from "./InspectorComponent";
import { InspectorComponentBase } from "./InspectorComponentBase";

export const ScriptComponentInspector: InspectorComponent<ScriptComponentData> = ({ component, controller, gameObject }) => {
  return (
    <InspectorComponentBase component={component} controller={controller} gameObject={gameObject}>
      <label>
        <span className="font-bold">Script</span>
        <input type="text" value={component.scriptAsset.path} readOnly={true} className="w-full p-1" />
      </label>
    </InspectorComponentBase>
  )
};

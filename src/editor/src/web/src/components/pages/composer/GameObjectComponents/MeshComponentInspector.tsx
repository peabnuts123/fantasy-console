import { MeshComponentConfigComposer } from "@lib/composer/config/components";
import { InspectorComponent } from "./InspectorComponent";
import { InspectorComponentBase } from "./InspectorComponentBase";

export const MeshComponentInspector: InspectorComponent<MeshComponentConfigComposer> = ({ component }) => {
  return (
    <InspectorComponentBase component={component}>
      <label>
        <span className="font-bold">Mesh</span>
        <input type="text" value={component.meshAsset.path} readOnly={true} className="w-full p-1" />
      </label>
    </InspectorComponentBase>
  )
};

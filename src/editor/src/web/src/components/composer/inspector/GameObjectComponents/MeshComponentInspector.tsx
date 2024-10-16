import { CubeIcon } from "@heroicons/react/24/outline";
import cn from 'classnames';

import { AssetType } from "@fantasy-console/runtime/src/cartridge";

import { useAssetDrop } from "@app/interactions/assets";
import Condition from "@app/components/util/condition";
import type { MeshComponentData } from "@lib/composer/data";
import { SetGameObjectMeshComponentAssetMutation } from "@lib/mutation/scene/mutations";
import type { InspectorComponent } from "./InspectorComponent";
import { InspectorComponentBase } from "./InspectorComponentBase";

export const MeshComponentInspector: InspectorComponent<MeshComponentData> = ({ component, controller, gameObject }) => {
  // Computed state
  const hasMesh = component.meshAsset !== undefined;

  // Drag and drop hook
  const [{ isDragOverTarget }, DropTarget] = useAssetDrop(AssetType.Mesh,
    /* @NOTE On drop */
    ({ assetData, }) => {
      controller.mutator.apply(
        new SetGameObjectMeshComponentAssetMutation(
          gameObject,
          component,
          assetData
        )
      );
    });

  return (
    <InspectorComponentBase component={component} controller={controller} gameObject={gameObject}>
      <label className="font-bold">Mesh</label>
      <div className="flex flex-row">
        {/* Asset icon */}
        <div className="flex bg-blue-300 justify-center items-center p-2">
          <CubeIcon />
        </div>

        {/* Asset reference / name */}
        <div
          ref={DropTarget}
          className={cn("w-full p-2 bg-white overflow-scroll", {
            "!bg-blue-300": isDragOverTarget,
            'italic': !hasMesh,
          })}
        >
          <Condition if={hasMesh}
            then={() => component.meshAsset!.path}
            else={() => "No mesh assigned"}
          />
        </div>

        {/* @TODO Remove reference button */}
      </div>
    </InspectorComponentBase>
  )
};

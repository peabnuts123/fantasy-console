import { CubeIcon } from "@heroicons/react/24/outline";
import cn from 'classnames';

import { AssetType } from "@fantasy-console/runtime/src/cartridge";

import type { MeshComponentData } from "@lib/composer/data";
import type { InspectorComponent } from "./InspectorComponent";
import { InspectorComponentBase } from "./InspectorComponentBase";
import { SetGameObjectMeshComponentAssetMutation } from "@lib/mutation/scene/mutations/SetGameObjectMeshComponentAssetMutation";
import { useAssetDrop } from "@app/interactions/assets";

export const MeshComponentInspector: InspectorComponent<MeshComponentData> = ({ component, controller, gameObject }) => {
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
        <div className="flex bg-blue-300 justify-center items-center p-2">
          <CubeIcon />
        </div>

        <div
          ref={DropTarget}
          className={cn("w-full p-2 bg-white overflow-scroll", {
            "!bg-blue-300": isDragOverTarget,
          })}
        >
          {component.meshAsset.path}
        </div>
      </div>
    </InspectorComponentBase>
  )
};

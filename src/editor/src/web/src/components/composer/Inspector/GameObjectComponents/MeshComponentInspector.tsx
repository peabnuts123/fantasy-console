
import { AssetType } from "@fantasy-console/runtime/src/cartridge";
import { observer } from "mobx-react-lite";

import type { MeshComponentData } from "@lib/project/data";
import { SetGameObjectMeshComponentAssetMutation } from "@lib/mutation/scene/mutations";
import type { MeshAssetData } from "@lib/project/data/AssetData";
import { createAssetReferenceComponentOfType } from "../AssetReference";
import type { InspectorComponent } from "./InspectorComponent";
import { InspectorComponentBase } from "./InspectorComponentBase";

const MeshAssetReference = createAssetReferenceComponentOfType<AssetType.Mesh>();

export const MeshComponentInspector: InspectorComponent<MeshComponentData> = observer(({ component, controller, gameObject }) => {
  const onUpdateMeshAsset = (meshAsset: MeshAssetData | undefined): void => {
    controller.mutator.apply(
      new SetGameObjectMeshComponentAssetMutation(
        gameObject,
        component,
        meshAsset,
      ),
    );
  };

  return (
    <InspectorComponentBase component={component} controller={controller} gameObject={gameObject}>
      <MeshAssetReference
        label='Mesh'
        assetType={AssetType.Mesh}
        asset={component.meshAsset}
        onAssetChange={onUpdateMeshAsset}
      />
    </InspectorComponentBase>
  );
});

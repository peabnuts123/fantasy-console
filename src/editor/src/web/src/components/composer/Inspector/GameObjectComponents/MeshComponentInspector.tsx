
import { AssetType, MeshAssetData } from "@fantasy-console/runtime/src/cartridge";
import { observer } from "mobx-react-lite";

import type { MeshComponentData } from "@lib/composer/data";
import { SetGameObjectMeshComponentAssetMutation } from "@lib/mutation/scene/mutations";
import { createAssetReferenceComponentOfType } from "../AssetReference";
import type { InspectorComponent } from "./InspectorComponent";
import { InspectorComponentBase } from "./InspectorComponentBase";

const MeshAssetReference = createAssetReferenceComponentOfType<AssetType.Mesh>();

export const MeshComponentInspector: InspectorComponent<MeshComponentData> = observer(({ component, controller, gameObject }) => {
  const onUpdateMeshAsset = (meshAsset: MeshAssetData | undefined) => {
    controller.mutator.apply(
      new SetGameObjectMeshComponentAssetMutation(
        gameObject,
        component,
        meshAsset
      )
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
  )
});

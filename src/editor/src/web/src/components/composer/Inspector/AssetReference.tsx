import { FunctionComponent } from "react";
import cn from 'classnames';
import { observer } from "mobx-react-lite";
import { TrashIcon } from '@heroicons/react/24/solid'

import { AssetType } from "@fantasy-console/runtime/src/cartridge";

import { useLibrary } from "@lib/index";
import { showModal } from '@lib/modal';
import { AssetDataOfType } from "@lib/project/data/AssetData";
import { useAssetDrop } from "@app/interactions/assets";
import { AssetReferenceModalAssetReference, AssetReferenceModalData, AssetReferenceResultPayload } from "@app/pages/modal/asset-reference";
import { getIconForAssetType } from "../AssetsAndScenes/AssetList";

interface Props<TAssetType extends AssetType> {
  label: string;
  assetType: TAssetType;
  asset: AssetDataOfType<TAssetType> | undefined;
  onAssetChange?: (asset: AssetDataOfType<TAssetType> | undefined) => void;
}

export function createAssetReferenceComponentOfType<TAssetType extends AssetType>() {
  const AssetReference: FunctionComponent<Props<TAssetType>> = observer(({
    label,
    assetType,
    asset,
    onAssetChange,
  }) => {
    // Prop defaults
    onAssetChange ??= () => { };

    const { ProjectController } = useLibrary();

    // Computed state
    const AssetIcon = getIconForAssetType(assetType);
    const hasAsset = asset !== undefined;

    // Drag and drop hook
    const [{ isDragOverThisZone }, DropTarget] = useAssetDrop<TAssetType, HTMLButtonElement>(assetType,
      /* @NOTE On drop */
      ({ assetData, }) => onAssetChange(assetData)
    );

    // Functions
    const onClickDelete = () => {
      onAssetChange(undefined);
    };
    const onClickAssetButton = async () => {
      // Map asset data into modal data
      const assets = ProjectController.assetDb.assets
        .filter((asset) => asset.type === assetType)
        .map((assetData) => ({
          id: assetData.id,
          type: assetData.type as TAssetType,
          name: assetData.baseName,
          path: assetData.pathList,
        } satisfies AssetReferenceModalAssetReference<TAssetType>));

      // Show modal
      const result = await showModal<AssetReferenceModalData<TAssetType>, AssetReferenceResultPayload>(
        '/modal/asset-reference',
        { assets }
      );

      // Handle result from modal
      if (result.selected) {
        // User selected an asset in the modal
        // Resolve asset ID back into full AssetData instance
        console.log(`[AssetReference] (onClickAssetButton) Selected asset: ${result.assetId}`);
        const selectedAsset = ProjectController.assetDb.assets.find((asset) => asset.id === result.assetId) as AssetDataOfType<TAssetType>;
        onAssetChange(selectedAsset);
      } else {
        // User cancelled
        console.log(`[AssetReference] (onClickAssetButton) Modal cancelled.`);
      }
    };

    return (
      <>
        <label className="font-bold">{label}</label>
        <div className="flex flex-row">
          {/* Asset icon */}
          <div className="flex bg-blue-300 justify-center items-center p-2">
            <AssetIcon className="icon" />
          </div>

          {/* Asset reference / name */}
          <button
            ref={DropTarget}
            className={cn("w-full p-2 bg-white overflow-scroll whitespace-nowrap cursor-pointer text-left overflow-ellipsis", {
              "!bg-blue-300": isDragOverThisZone,
              'italic': !hasAsset,
            })}
            onClick={onClickAssetButton}
          >
            {hasAsset ? (
              asset.path
            ) : (
              "No asset assigned"
            )}
          </button>

          {/* Delete icon */}
          {hasAsset && (
            <button
              className="flex bg-white hover:bg-blue-300 active:bg-blue-500 justify-center items-center p-2 cursor-pointer"
              onClick={onClickDelete}
            >
              <TrashIcon className="icon w-4" />
            </button>
          )}
        </div>
      </>
    );
  });
  return AssetReference;
}

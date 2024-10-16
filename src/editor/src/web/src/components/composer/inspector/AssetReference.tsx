import { FunctionComponent } from "react";
import cn from 'classnames';

import { AssetDataOfType, AssetType } from "@fantasy-console/runtime/src/cartridge";

import { useAssetDrop } from "@app/interactions/assets";
import Condition from "@app/components/util/condition";
import { getIconForAssetType } from "../AssetList";
import { observer } from "mobx-react-lite";

interface Props<TAssetType extends AssetType> {
  label: string;
  assetType: TAssetType;
  asset: AssetDataOfType<TAssetType> | undefined;
  onAssetChange?: (asset: AssetDataOfType<TAssetType>) => void;
}

export function createAssetReferenceComponentOfType<TAssetType extends AssetType>() {
  const AssetReference: FunctionComponent<Props<TAssetType>> = observer(({
    label,
    assetType,
    asset,
    onAssetChange,
  }) => {
    // Computed state
    const AssetIcon = getIconForAssetType(assetType);
    const hasAsset = asset !== undefined;

    // Drag and drop hook
    const [{ isDragOverTarget }, DropTarget] = useAssetDrop(assetType,
      /* @NOTE On drop */
      ({ assetData, }) => {
        if (onAssetChange !== undefined) {
          onAssetChange(assetData)
        }
      }
    );

    return (
      <>
        <label className="font-bold">{label}</label>
        <div className="flex flex-row">
          {/* Asset icon */}
          <div className="flex bg-blue-300 justify-center items-center p-2">
            <AssetIcon />
          </div>

          {/* Asset reference / name */}
          <div
            ref={DropTarget}
            className={cn("w-full p-2 bg-white overflow-scroll", {
              "!bg-blue-300": isDragOverTarget,
              'italic': !hasAsset,
            })}
          >
            <Condition if={hasAsset}
              then={() => asset!.path}
              else={() => "No asset assigned"}
            />
          </div>

          {/* @TODO Remove reference button */}
        </div>
      </>
    );
  });
  return AssetReference;
}

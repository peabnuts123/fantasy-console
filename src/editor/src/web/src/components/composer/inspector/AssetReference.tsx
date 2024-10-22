import { FunctionComponent } from "react";
import cn from 'classnames';
import { observer } from "mobx-react-lite";
import { TrashIcon } from '@heroicons/react/24/solid'

import { AssetDataOfType, AssetType } from "@fantasy-console/runtime/src/cartridge";

import { useAssetDrop } from "@app/interactions/assets";
import Condition from "@app/components/util/condition";
import { getIconForAssetType } from "../AssetList";

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

    // Computed state
    const AssetIcon = getIconForAssetType(assetType);
    const hasAsset = asset !== undefined;

    // Drag and drop hook
    const [{ isDragOverTarget }, DropTarget] = useAssetDrop(assetType,
      /* @NOTE On drop */
      ({ assetData, }) => onAssetChange(assetData)
    );

    // Functions
    const onClickDelete = () => {
      onAssetChange(undefined);
    }

    return (
      <>
        <label className="font-bold">{label}</label>
        <div className="flex flex-row">
          {/* Asset icon */}
          <div className="flex bg-blue-300 justify-center items-center p-2">
            <AssetIcon className="icon" />
          </div>

          {/* Asset reference / name */}
          <div
            ref={DropTarget}
            className={cn("w-full p-2 bg-white overflow-scroll whitespace-nowrap", {
              "!bg-blue-300": isDragOverTarget,
              'italic': !hasAsset,
            })}
          >
            <Condition if={hasAsset}
              then={() => asset!.path}
              else={() => "No asset assigned"}
            />
          </div>

          <Condition if={hasAsset}
            then={() => (
              <button
                className="flex bg-white hover:bg-blue-300 active:bg-blue-500 justify-center items-center p-2 cursor-pointer"
                onClick={onClickDelete}
              >
                <TrashIcon className="icon w-4" />
              </button>
            )}
          />
        </div>
      </>
    );
  });
  return AssetReference;
}

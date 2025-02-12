import type { AssetType } from "@fantasy-console/runtime/src/cartridge";
import type { AssetData, AssetDataOfType } from "@lib/project/data/AssetData";
import { useDrag, useDrop } from "@lib/util/drag-and-drop";

export interface AssetDragState {
  isDragging: boolean;
}

export interface AssetDropState {
  isDragOverTarget: boolean;
}

export interface AssetDragData<TAssetData extends AssetData> {
  assetData: TAssetData;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useAssetDrag<TAssetData extends AssetData, TElement extends HTMLElement = HTMLDivElement>(asset: TAssetData) {
  return useDrag<AssetDragData<TAssetData>, TElement>({
    type: asset.type,
    data: {
      assetData: asset,
    },
    dropEffect: 'link',
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useAssetDrop<TAssetType extends AssetType, TElement extends HTMLElement = HTMLDivElement>(
  acceptedAssetType: TAssetType,
  onDrop: (data: AssetDragData<AssetDataOfType<TAssetType>>) => void,
) {
  return useDrop<AssetDragData<AssetDataOfType<TAssetType>>, never, TElement>({
    accepts: acceptedAssetType,
    onDrop,
  });
}

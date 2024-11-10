import { AssetData, AssetDataOfType, AssetType } from "@fantasy-console/runtime/src/cartridge";
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

export function useAssetDrag<TAssetData extends AssetData, TElement extends HTMLElement = HTMLDivElement>(asset: TAssetData) {
  return useDrag<AssetDragData<TAssetData>, TElement>({
    type: asset.type,
    data: {
      assetData: asset,
    },
    dropEffect: 'link',
  });
}

export function useAssetDrop<TAssetType extends AssetType, TElement extends HTMLElement = HTMLDivElement>(
  acceptedAssetType: TAssetType,
  onDrop: (data: AssetDragData<AssetDataOfType<TAssetType>>) => void
) {
  return useDrop<AssetDragData<AssetDataOfType<TAssetType>>, {}, TElement>({
    accepts: acceptedAssetType,
    onDrop,
  });
}

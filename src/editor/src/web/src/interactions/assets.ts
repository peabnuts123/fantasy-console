import { ConnectDragPreview, ConnectDragSource, ConnectDropTarget, useDrag, useDrop } from "react-dnd";
import { AssetData, AssetDataOfType, AssetType } from "@fantasy-console/runtime/src/cartridge";
import { LegacyRef } from "react";

export interface AssetDragState {
  isDragging: boolean;
}

export interface AssetDropState {
  isDragOverTarget: boolean;
}

export interface AssetDragData<TAssetData extends AssetData> {
  assetData: TAssetData;
}

export function useAssetDrag<TAssetData extends AssetData>(asset: TAssetData) {
  return makeDnDResultMoreUseful(
    useDrag<AssetDragData<TAssetData>, {}, AssetDragState>(() => {
      return {
        type: asset.type,
        item: (_monitor) => {
          return {
            assetData: asset,
          };
        },
        options: { dropEffect: 'link' },
        collect: (monitor) => ({
          isDragging: monitor.isDragging()
        }),
      };
    })
  );
}

export function useAssetDrop<TAssetType extends AssetType, TDropResult>(
  acceptedAssetType: TAssetType,
  onDrop: (data: AssetDragData<AssetDataOfType<TAssetType>>) => TDropResult
) {
  return makeDnDResultMoreUseful(
    useDrop<AssetDragData<AssetDataOfType<TAssetType>>, TDropResult, AssetDropState>(() => ({
      accept: acceptedAssetType,
      drop: (data, _monitor) => {
        return onDrop(data);
      },
      collect: monitor => ({
        isDragOverTarget: !!monitor.isOver(),
      }),
    }))
  );
}

function makeDnDResultMoreUseful<TResult>(
  dndResult: (
    [TResult, ConnectDragSource, ConnectDragPreview] |  // @NOTE useDrag result
    [TResult, ConnectDropTarget]                        // @NOTE useDrop result
  )
): [TResult, LegacyRef<any>] {
  return [dndResult[0], (e) => {
    dndResult[1](e);
  }]
}
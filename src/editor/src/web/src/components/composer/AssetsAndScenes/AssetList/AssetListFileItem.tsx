import { FunctionComponent } from "react";
import { AssetType } from "@polyzone/runtime/src/cartridge";
import { DocumentIcon, DocumentTextIcon, PhotoIcon, CubeIcon } from '@heroicons/react/24/outline';
import { observer } from "mobx-react-lite";

import { useAssetDrag } from "@app/interactions/assets";
import type { AssetDbVirtualFile } from "@lib/project/data/AssetDb";
import { ListItemCommon } from '../ListItemCommon';


export interface AssetListFileItemProps {
  asset: AssetDbVirtualFile;
}

export const AssetListFileItem: FunctionComponent<AssetListFileItemProps> = observer(({ asset }) => {
  const AssetIcon = getIconForAssetType(asset.data.type);

  // Drag and drop hook
  const [{ }, DragSource] = useAssetDrag(asset.data);

  return (
    <ListItemCommon
      label={asset.name}
      Icon={AssetIcon}
      classNames="cursor-grab"
      innerRef={DragSource}
    />
  );
});


export function getIconForAssetType(assetType: AssetType): typeof CubeIcon {
  switch (assetType) {
    case AssetType.Mesh:
      return CubeIcon;
    case AssetType.Script:
      return DocumentTextIcon;
    case AssetType.Texture:
      return PhotoIcon;
    default:
      return DocumentIcon;
  }
}

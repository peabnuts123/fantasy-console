import { FunctionComponent } from "react";
import { FolderIcon } from '@heroicons/react/24/outline'
import cn from 'classnames';
import { observer } from "mobx-react-lite";

import type { AssetDbVirtualDirectory } from "@lib/project/AssetDb";
import { ListItemCommon } from '../ListItemCommon';

export interface AssetListDirectoryItemProps {
  asset: AssetDbVirtualDirectory;
  currentDirectory: string[];
  setCurrentDirectory: (path: string[]) => void;
}

export const AssetListDirectoryItem: FunctionComponent<AssetListDirectoryItemProps> = observer(({ asset, currentDirectory, setCurrentDirectory }) => {
  return (
    <ListItemCommon
      label={asset.name}
      Icon={FolderIcon}
      classNames={cn("cursor-pointer focus:bg-blue-100 active:bg-blue-200")}
      onClick={() => {
        setCurrentDirectory([...currentDirectory, asset.name]);
      }}
    />
  )
});

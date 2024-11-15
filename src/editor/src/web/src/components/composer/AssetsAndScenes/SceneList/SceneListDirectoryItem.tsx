import { FunctionComponent } from "react";
import { FolderIcon } from '@heroicons/react/24/outline'
import cn from 'classnames';
import { observer } from "mobx-react-lite";

import { ListItemCommon } from '../ListItemCommon';

export interface SceneListVirtualDirectory {
  id: string;
  type: 'directory';
  name: string;
}

export interface SceneListDirectoryItemProps {
  directory: SceneListVirtualDirectory;
  currentDirectory: string[];
  setCurrentDirectory: (path: string[]) => void;
}

export const SceneListDirectoryItem: FunctionComponent<SceneListDirectoryItemProps> = observer(({ directory, currentDirectory, setCurrentDirectory }) => {
  return (
    <ListItemCommon
      label={directory.name}
      Icon={FolderIcon}
      classNames={cn("cursor-pointer focus:bg-blue-100 active:bg-blue-200")}
      onClick={() => {
        setCurrentDirectory([...currentDirectory, directory.name]);
      }}
    />
  )
});

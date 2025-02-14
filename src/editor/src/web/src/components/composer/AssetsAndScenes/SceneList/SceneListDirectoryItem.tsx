import { FunctionComponent } from "react";
import { FolderIcon } from '@heroicons/react/24/outline';
import cn from 'classnames';
import { observer } from "mobx-react-lite";

import { baseName } from "@polyzone/runtime/src/util";

import { ListItemCommon } from '../ListItemCommon';
import { useSceneDrop } from "@app/interactions";
import { MoveSceneMutation } from "@lib/mutation/project/mutations";
import { useLibrary } from "@lib/index";

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
  // Hooks
  const { ProjectController } = useLibrary();

  const [{ isDragOverThisZone }, DropTarget] = useSceneDrop(
      ({ sceneData }) => {
      const newPath = currentDirectory
        .concat(directory.name, baseName(sceneData.path))
        .join('/');
      ProjectController.mutator.apply(new MoveSceneMutation(sceneData, newPath));
    },
  );

  return (
    <ListItemCommon
      label={directory.name}
      Icon={FolderIcon}
      classNames={cn({
        "bg-blue-200": isDragOverThisZone,
      })}
      onClick={() => {
        setCurrentDirectory([...currentDirectory, directory.name]);
      }}
      innerRef={DropTarget}
    />
  );
});

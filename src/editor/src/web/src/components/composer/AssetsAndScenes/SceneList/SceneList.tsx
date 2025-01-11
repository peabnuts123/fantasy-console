import type { FunctionComponent } from "react";
import { useState } from "react";
import { PlusIcon } from '@heroicons/react/24/outline'
import { observer } from "mobx-react-lite";
import cn from 'classnames';

import { baseName, toPathList } from "@fantasy-console/runtime/src/util";

import { useSceneDrop } from "@app/interactions";
import { useLibrary } from "@lib/index";
import { CreateNewSceneMutation, MoveSceneMutation } from "@lib/mutation/project/mutations";
import { createDirView } from "@lib/util/path";
import { SceneData } from "@lib/project/data";
import { CreateNewSceneListFileItem, SceneListFileItem, SceneListVirtualFile } from './SceneListFileItem';
import { SceneListDirectoryItem, SceneListVirtualDirectory } from './SceneListDirectoryItem';
import { ListItemCommon } from "../ListItemCommon";

interface Props {
  openScene: (scene: SceneData) => void;
}

export const SceneList: FunctionComponent<Props> = observer(({ openScene }) => {
  // Hooks
  const { ProjectController } = useLibrary();

  // State
  const [currentDirectory, setCurrentDirectory] = useState<string[]>([]);
  const [tempCreatePath, setTempCreatePath] = useState<string | undefined>(undefined);

  // Computed state
  const { scenes } = ProjectController.project;
  const scenesDirView = createDirView(
    scenes.getAllData(),
    currentDirectory,
    /* toPath: */(scene) => toPathList(scene.path),
    /* toFile: */(scene) => ({
      id: scene.id,
      type: 'file',
      scene,
    } satisfies SceneListVirtualFile as SceneListVirtualFile),
    /* toDirectory: */(directoryName, scene) => ({
      id: scene.id,
      type: 'directory',
      name: directoryName,
    } satisfies SceneListVirtualDirectory as SceneListVirtualDirectory)
  );
  const [{ isDragOverThisZone: isDragOverParentDirectory }, ParentDirectoryDropTarget] = useSceneDrop(
    ({ sceneData, }) => {
      const newPath = currentDirectory.slice(0, currentDirectory.length - 1)
        .concat(baseName(sceneData.path))
        .join('/');
      ProjectController.mutator.apply(new MoveSceneMutation(sceneData, newPath));
    }
  );

  // Functions
  const onClickNewScene = () => {
    const namesInCurrentDirectory = scenesDirView.filter((item) => item.type === 'file').map((item) => baseName(item.scene.path));
    const isUniqueName = (name: string) => {
      return !namesInCurrentDirectory.some((otherName) => otherName.localeCompare(name, undefined, { sensitivity: 'accent' }) === 0)
    }
    let newSceneName = "new scene";
    let deduplicationNumber = 1;
    while (!isUniqueName(`${newSceneName}.pzscene`)) {
      newSceneName = `new scene ${deduplicationNumber++}`;
    }

    const newScenePath = [...currentDirectory, `${newSceneName}.pzscene`].join('/');
    setTempCreatePath(newScenePath);
  };

  const onFinishedNamingNewScene = (newScenePath: string) => {
    setTempCreatePath(undefined);
    ProjectController.mutator.apply(new CreateNewSceneMutation(newScenePath));
  }

  const onCancelCreateNewScene = () => {
    setTempCreatePath(undefined);
  };

  return (
    <div className="px-2 h-full overflow-y-scroll grow">
      <button
        className="button"
        onClick={onClickNewScene}
      >
        <PlusIcon className="icon mr-1" /> New scene
      </button>

      {/* @TODO scroll should start here */}

      {/* Parent directory button */}
      {/* Only visible if you are not in the root */}
      {currentDirectory.length > 0 && (
        <ListItemCommon
          label=".."
          onClick={() => setCurrentDirectory(currentDirectory.slice(0, currentDirectory.length - 1))}
          classNames={cn({
            "bg-blue-200": isDragOverParentDirectory,
          })}
          innerRef={ParentDirectoryDropTarget}
        />
      )}

      {/* Assets in the current folder */}
      {scenesDirView.map((item) => {
        if (item.type === 'file') {
          return (
            <SceneListFileItem
              key={item.id}
              file={item}
              onClick={() => openScene(item.scene)}
            />
          )
        } else {
          return (
            <SceneListDirectoryItem
              key={item.id}
              directory={item}
              currentDirectory={currentDirectory}
              setCurrentDirectory={setCurrentDirectory}
            />
          )
        }
      })}

      {/* New scene slot */}
      {tempCreatePath && (
        <CreateNewSceneListFileItem
          newPath={tempCreatePath}
          onCreate={onFinishedNamingNewScene}
          onCancel={onCancelCreateNewScene}
        />
      )}
    </div>
  );
});

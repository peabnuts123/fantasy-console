import type { FunctionComponent } from "react";
import { useState } from "react";
import { PlusIcon } from '@heroicons/react/24/outline'
import { observer } from "mobx-react-lite";

import { baseName, toPathList } from "@fantasy-console/runtime/src/util";

import { useLibrary } from "@lib/index";
import { CreateNewSceneMutation } from "@lib/mutation/project/mutations";
import { createDirView } from "@lib/util/path";
import { SceneData } from "@lib/project/data";
import { SceneListFileItem, SceneListVirtualFile } from './SceneListFileItem';
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

  // Computed state
  const { scenes } = ProjectController.project;
  const scenesDirView = createDirView(
    scenes.getAllData(),
    currentDirectory,
    /* toPath: */(scene) => toPathList(scene.path),
    /* toFile: */(scene) => ({
      id: scene.path,
      type: 'file',
      scene,
    } satisfies SceneListVirtualFile as SceneListVirtualFile),
    /* toDirectory: */(directoryName, scene) => ({
      id: scene.path,
      type: 'directory',
      name: directoryName,
    } satisfies SceneListVirtualDirectory as SceneListVirtualDirectory)
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
    ProjectController.mutator.apply(new CreateNewSceneMutation(newScenePath));
  };

  return (
    <div className="px-2 h-full overflow-y-scroll grow">
      <button
        className="button"
        onClick={onClickNewScene}
      >
        <PlusIcon className="icon mr-1" /> New scene
      </button>

      {/* Parent directory button */}
      {/* Only visible if you are not in the root */}
      {currentDirectory.length > 0 && (
        <ListItemCommon
          label=".."
          onClick={() => setCurrentDirectory(currentDirectory.slice(0, currentDirectory.length - 1))}
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
    </div>
  );
});

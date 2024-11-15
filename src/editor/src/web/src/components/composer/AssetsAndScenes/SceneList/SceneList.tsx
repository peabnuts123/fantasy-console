import type { FunctionComponent } from "react";
import { useState } from "react";
import { PlusIcon } from '@heroicons/react/24/outline'
import { observer } from "mobx-react-lite";

import { useLibrary } from "@lib/index";
import { createDirView, toPathList } from "@fantasy-console/runtime/src/util";

import { SceneListFileItem, SceneListVirtualFile } from './SceneListFileItem';
import { SceneListDirectoryItem, SceneListVirtualDirectory } from './SceneListDirectoryItem';
import { ListItemCommon } from "../ListItemCommon";

export const SceneList: FunctionComponent = observer(({ }) => {
  // Hooks
  const { ProjectController } = useLibrary();

  // State
  const [currentDirectory, setCurrentDirectory] = useState<string[]>([]);

  // Computed state
  const { currentProject: { scenes } } = ProjectController;
  const scenesDirView = createDirView(
    scenes,
    currentDirectory,
    (scene) => toPathList(scene.path),
    (scene) => ({
      id: scene.path,
      type: 'file',
      scene,
    } satisfies SceneListVirtualFile as SceneListVirtualFile),
    (directoryName, scene) => ({
      id: scene.path,
      type: 'directory',
      name: directoryName,
    } satisfies SceneListVirtualDirectory as SceneListVirtualDirectory)
  );

  return (
    <div className="px-2 h-full overflow-y-scroll grow">
      <button className="button"><PlusIcon className="icon mr-1" /> New scene</button>

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

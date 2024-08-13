import { FunctionComponent, useState } from "react";
import { observer } from "mobx-react-lite";
import { open, save } from '@tauri-apps/api/dialog';
import { writeBinaryFile } from '@tauri-apps/api/fs';

import SceneView from "@app/components/pages/composer/SceneView";
import { Condition } from '@app/components/util/condition';
import Spinner from "@app/components/spinner";
import { useComposer } from "@lib/composer/Composer";
import { SceneManifest } from "@lib/composer/project";
import Player from "@app/components/player";


interface Props { }

const ComposerPage: FunctionComponent<Props> = observer(({ }) => {
  const Composer = useComposer();

  // State
  const [tempCartridge, setTempCartridge] = useState<ArrayBuffer | undefined>(undefined);

  // Computed State
  const isPlaying = tempCartridge !== undefined;

  // Functions
  const loadProject = async () => {
    const selected = await open({
      filters: [{
        name: 'PolyZone Project',
        extensions: ['pzproj']
      }]
    }) as string | null;

    if (selected === null) return;

    await Composer.loadProject(selected);
  };

  const loadScene = async (scene: SceneManifest) => {
    await Composer.loadScene(scene);
  };

  const debug_exportScene = async () => {
    const bytes = await Composer.debug_buildCartridge();
    const savePath = await save({
      filters: [{
        name: 'Fantasy Console Cartridge',
        extensions: ['pzcart']
      }]
    });
    if (!savePath) return;

    await writeBinaryFile(savePath, bytes);
  };

  const debug_playProject = async () => {
    const bytes = await Composer.debug_buildCartridge();
    setTempCartridge(bytes);
  };

  const debug_stopPlaying = async () => {
    setTempCartridge(undefined);
  };

  return (
    <div className="page">
      <h1>Composer</h1>
      <Condition if={Composer.hasLoadedProject}
        then={() => (
          <>
            <h1>Project: {Composer.currentProjectManifest.projectName}</h1>
            <Condition if={!isPlaying}
              then={() => (
                <>
                  <button onClick={debug_exportScene}>[Debug] Export</button>
                  <button onClick={debug_playProject}>[Debug] Play</button>

                  <h2>Scenes</h2>
                  <ul>
                    {Composer.currentProject.scenes.map((sceneManifest) => (
                      <li key={sceneManifest.path}>
                        <button onClick={() => loadScene(sceneManifest)}>Load Scene: {sceneManifest.path}</button>
                      </li>
                    ))}
                  </ul>

                  <Condition if={Composer.hasLoadedScene}
                    then={() => (
                      <SceneView scene={Composer.currentScene} />
                    )}
                  />
                </>
              )}
              else={() => (
                <>
                  <button onClick={debug_stopPlaying}>[Debug] Stop</button>
                  <Player cartridge={tempCartridge!} />
                </>
              )}
            />
          </>
        )}
        else={() => (
          <>
            <Condition if={Composer.isLoadingProject}
              then={() => (
                <>
                  <Spinner message="Loading project..." />
                </>
              )}
              else={() => (
                <div>
                  <button onClick={() => loadProject()}>Load project</button>
                </div>
              )}
            />
          </>
        )}
      />
    </div>
  )
});



export default ComposerPage;

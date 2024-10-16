import type { FunctionComponent } from "react";
import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { save } from '@tauri-apps/api/dialog';
import { writeBinaryFile } from '@tauri-apps/api/fs';
import { PlayIcon, StopIcon, ArrowLeftEndOnRectangleIcon, CubeIcon } from '@heroicons/react/24/solid'
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import { useLibrary } from "@lib/index";
import type { SceneManifest } from "@lib/project/definition/scene";
import SceneView from "@app/components/composer/SceneView";
import { Condition } from '@app/components/util/condition';
import Player from "@app/components/player";
import { AssetList } from "@app/components/composer/AssetList";


interface Props { }

const ComposerPage: FunctionComponent<Props> = observer(({ }) => {
  const { ComposerController, ProjectController } = useLibrary();

  // State
  const [tempCartridge, setTempCartridge] = useState<Uint8Array | undefined>(undefined);

  // Computed State
  const isPlaying = tempCartridge !== undefined;

  useEffect(() => {
    ComposerController.onEnter();
    return () => {
      ComposerController.onExit();
    };
  });

  // Functions
  const loadScene = async (scene: SceneManifest) => {
    await ComposerController.loadScene(scene);
  };

  const debug_exportScene = async () => {
    const bytes = await ComposerController.debug_buildCartridge();
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
    const bytes = await ComposerController.debug_buildCartridge();
    setTempCartridge(bytes);
  };

  const debug_stopPlaying = async () => {
    setTempCartridge(undefined);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      {/* Header */}
      <header className="flex items-center w-full justify-between py-1 px-2">
        <Link href="/" className="button"><ArrowLeftEndOnRectangleIcon /> Exit</Link>
        <Condition if={!isPlaying}
          then={() => (
            <>
              <button onClick={debug_playProject} className="button"><PlayIcon /> Play</button>
            </>
          )}
          else={() => (
            <>
              <button onClick={debug_stopPlaying} className="button"><StopIcon /> Stop</button>
            </>
          )}
        />
        <button onClick={debug_exportScene} className="button"><CubeIcon /> Export</button>
      </header>

      <Condition if={!isPlaying}
        then={() => (
          /* Editing scene (not playing) */
          <PanelGroup direction="vertical">
            <Panel defaultSize={75} minSize={25}>
              <Condition if={ComposerController.hasLoadedScene}
                then={() => (
                  /* Scene loaded */
                  <SceneView controller={ComposerController.currentScene} />
                )}
                else={() => (
                  /* No scene loaded */
                  <div className="flex flex-col justify-center items-center h-full">
                    <h1 className="text-h2">No scene loaded</h1>
                    <p>Select a scene to load</p>
                    <ul className="flex flex-col items-center">
                      {ProjectController.currentProject.scenes.map((sceneManifest) => (
                        <button
                          key={sceneManifest.hash}
                          onClick={() => loadScene(sceneManifest)}
                          className="button"
                        >{sceneManifest.path}</button>
                      ))}
                    </ul>
                  </div>
                )}
              />
            </Panel>
            <PanelResizeHandle className="drag-separator" />
            <Panel minSize={10}>
              <AssetList />
            </Panel>
          </PanelGroup>
        )}
        else={() => (
          /* Playing scene */
          <>
            <Player cartridge={tempCartridge!} />
          </>
        )}
      />
    </DndProvider>
  )
});



export default ComposerPage;

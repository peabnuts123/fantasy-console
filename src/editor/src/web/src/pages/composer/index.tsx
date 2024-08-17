import { FunctionComponent, useState } from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { open, save } from '@tauri-apps/api/dialog';
import { writeBinaryFile } from '@tauri-apps/api/fs';
import { PlayIcon, StopIcon, ArrowLeftEndOnRectangleIcon, CubeIcon } from '@heroicons/react/24/solid'
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

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
  const [tempCartridge, setTempCartridge] = useState<Uint8Array | undefined>(undefined);

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
    <>
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


      <Condition if={Composer.hasLoadedProject}
        then={() => (
          /* Project is loaded */
          <>
            <Condition if={!isPlaying}
              then={() => (
                /* Editing scene (not playing) */
                <PanelGroup direction="vertical">
                  <Panel defaultSize={75} minSize={25}>
                    <Condition if={Composer.hasLoadedScene}
                      then={() => (
                        /* Scene loaded */
                        <SceneView scene={Composer.currentScene} />
                      )}
                      else={() => (
                        /* No scene loaded */
                        <div className="flex flex-col justify-center items-center h-full">
                          <h1 className="text-h2">No scene loaded</h1>
                          <p>Select a scene to load</p>
                          <ul className="flex flex-col items-center">
                            {Composer.currentProject.scenes.map((sceneManifest) => (
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
                    <div className="p-2 bg-gradient-to-b from-[blue] to-cyan-400 text-white text-retro-shadow">
                      <h2 className="text-lg">Assets</h2>
                    </div>
                    <div className="p-3 bg-slate-300 h-full">
                      {/* Empty */}
                    </div>
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
          </>
        )}
        else={() => (
          /* No project currently loaded */
          <div className="flex flex-col justify-center items-center h-full">
            <Condition if={Composer.isLoadingProject}
              then={() => (
                /* Project is loading... */
                <>
                  <Spinner message="Loading project..." />
                </>
              )}
              else={() => (
                /* Initial state */
                <>
                  {/* @TODO this should be done at an app level not inside the composer */}
                  <h1 className="text-h2">No project currently loaded</h1>
                  <button onClick={() => loadProject()} className="button">Load project</button>
                </>
              )}
            />
          </div>
        )}
      />
    </>
  )
});



export default ComposerPage;

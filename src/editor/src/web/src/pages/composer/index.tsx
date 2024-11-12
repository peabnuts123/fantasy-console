import type { FunctionComponent } from "react";
import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { PlayIcon, StopIcon, ArrowLeftEndOnRectangleIcon, CubeIcon, PlusIcon } from '@heroicons/react/24/solid'
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { useLibrary } from "@lib/index";
import type { SceneManifest } from "@lib/project/definition/scene";
import { DragAndDropDataProvider } from '@lib/util/drag-and-drop'
import SceneView from "@app/components/composer/SceneView";
import Player from "@app/components/player";
import { AssetList } from "@app/components/composer/AssetList";
import { TabBar, TabProvider } from "@app/components/tabs";


interface Props { }

const ComposerPage: FunctionComponent<Props> = observer(({ }) => {
  const { ComposerController, ProjectController } = useLibrary();

  // State
  const [tempCartridge, setTempCartridge] = useState<Uint8Array | undefined>(undefined);

  // Computed State
  const isPlaying = tempCartridge !== undefined;

  // @TODO we aren't doing this any more... this is debug
  const currentSceneController = ComposerController.currentScene;

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

    await writeFile(savePath, bytes);
  };

  const debug_playProject = async () => {
    const bytes = await ComposerController.debug_buildCartridge();
    setTempCartridge(bytes);
  };

  const debug_stopPlaying = async () => {
    setTempCartridge(undefined);
  };

  return (
    <DragAndDropDataProvider>
      {/* Header */}
      <header className="flex items-center w-full justify-between py-1 px-2">
        {/* Exit */}
        <Link href="/" className="button"><ArrowLeftEndOnRectangleIcon className="icon mr-1" /> Exit</Link>

        {/* Play / Stop */}
        {isPlaying ? (
          <button onClick={debug_stopPlaying} className="button"><StopIcon className="icon mr-1" /> Stop</button>
        ) : (
          <button onClick={debug_playProject} className="button"><PlayIcon className="icon mr-1" /> Play</button>
        )}

        {/* Export */}
        <button onClick={debug_exportScene} className="button"><CubeIcon className="icon mr-1" /> Export</button>
      </header>

      {!isPlaying ? (
        <TabProvider defaultTabId={ComposerController.currentScene?.scene.path ?? ""}>
          <TabBar tabs={[
            {
              type: 'page',
              tabId: currentSceneController?.scene.path ?? '',
              label: currentSceneController?.scene.path ?? "",
            },
            {
              type: 'page',
              tabId: 'scenes/another.pzscene',
              label: "scenes/another.pzscene",
            },
            {
              type: 'action',
              // label: '+',
              innerContent: (
                <>
                  <PlusIcon className="icon w-4" />
                </>
              ),
              onClick() {
                console.log(`Open another scene`);
              }
            }
          ]} />

          {/* Editing scene (not playing) */}
          <PanelGroup direction="vertical">
            <Panel defaultSize={75} minSize={25}>
              {currentSceneController ? (
                /* Scene loaded */
                <>
                  <SceneView controller={currentSceneController} />
                </>
              ) : (
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
            </Panel>
            <PanelResizeHandle className="drag-separator" />
            <Panel minSize={10}>
              <AssetList />
            </Panel>
          </PanelGroup>
        </TabProvider>
      ) : (
        /* Playing scene */
        <>
          <Player cartridge={tempCartridge!} />
        </>
      )}
    </DragAndDropDataProvider>
  )
});

export default ComposerPage;

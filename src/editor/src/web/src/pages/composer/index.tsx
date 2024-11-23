import type { FunctionComponent } from "react";
import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { PlayIcon, StopIcon, ArrowLeftEndOnRectangleIcon, CubeIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid'
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { useLibrary } from "@lib/index";
import { DragAndDropDataProvider } from '@lib/util/drag-and-drop'
import SceneView from "@app/components/composer/SceneView";
import Player from "@app/components/player";
import { AssetsAndScenes } from "@app/components/composer/AssetsAndScenes";
import { TabBar, TabButtonProps, TabPage, TabProvider, useTabState } from "@app/components/tabs";
import { StatusBar } from "@app/components/composer/StatusBar";


interface Props { }

const ComposerPageWrapper: FunctionComponent<Props> = observer(({ }) => {
  // Hooks
  const { ComposerController } = useLibrary();

  return (
    <DragAndDropDataProvider>
      <TabProvider defaultTabId={ComposerController.currentlyOpenTabs[0]?.id}>
        <ComposerPage />
      </TabProvider>
    </DragAndDropDataProvider >
  )
});

const ComposerPage: FunctionComponent<Props> = observer(({ }) => {
  // Hooks
  const { ComposerController, ProjectController } = useLibrary();
  const TabState = useTabState();

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
    const currentlyFocusedTab = ComposerController.currentlyOpenTabs.find((tab) => tab.id === TabState.currentTabPageId)
    const bytes = await ComposerController.debug_buildCartridge(currentlyFocusedTab?.sceneViewController?.sceneDefinition);
    setTempCartridge(bytes);
  };

  const debug_stopPlaying = async () => {
    setTempCartridge(undefined);
  };

  return (
    <>
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
        <Editor />
      ) : (
        /* Playing scene */
        <>
          <Player cartridge={tempCartridge!} />
        </>
      )}
    </>
  );
});

const Editor: FunctionComponent = observer(() => {
  // Hooks
  const { ComposerController, ProjectController } = useLibrary();
  const TabState = useTabState();

  // Computed state
  const noTabsOpen = ComposerController.currentlyOpenTabs.length === 0;

  // Functions
  const createNewTab = () => {
    const newTabData = ComposerController.openNewTab();

    setTimeout(() =>
      TabState.setCurrentTabPageId(newTabData.id)
    );
  }

  const closeTab = (tabId: string) => {
    // Take note of some things before closing the tab
    const isClosingCurrentlyActiveTab = TabState.currentTabPageId === tabId;
    let oldTabIndex = ComposerController.currentlyOpenTabs.findIndex((tab) => tab.id === tabId);

    ComposerController.closeTab(tabId);

    if (ComposerController.currentlyOpenTabs.length === 0) {
      // If there's no tabs left - clear out the active tab
      TabState.setCurrentTabPageId(undefined);
    } else if (isClosingCurrentlyActiveTab) {
      // Switch to the next tab if you're closing this tab (do nothing otherwise)

      // Clamp `oldTabIndex` to valid range
      if (oldTabIndex >= ComposerController.currentlyOpenTabs.length) {
        oldTabIndex = ComposerController.currentlyOpenTabs.length - 1;
      }
      const nextTab = ComposerController.currentlyOpenTabs[oldTabIndex];
      setTimeout(() => {
        TabState.setCurrentTabPageId(nextTab.id);
      });
    }
  }

  return (
    <>
      <TabBar tabs={[
        ...ComposerController.currentlyOpenTabs.map((tab) => ({
          type: 'page',
          tabId: tab.id,
          innerContent: (
            <>
              <span className="mr-1">{tab.label}</span>

              <div
                role="button"
                tabIndex={0}
                className="hover:bg-pink-400 p-1 inline-flex justify-center items-center"
                onClick={() => closeTab(tab.id)}
              >
                <TrashIcon className="icon w-4" />
              </div>
            </>
          ),
        }) satisfies TabButtonProps as TabButtonProps),
        {
          type: 'action',
          innerContent: (
            <>
              <PlusIcon className="icon w-4" />
            </>
          ),
          onClick: createNewTab,
        }
      ]} />

      <PanelGroup direction="vertical">
        <Panel defaultSize={75} minSize={25}>
          {noTabsOpen && (
            <div className="flex flex-col justify-center items-center h-full">
              <h1 className="text-h2">No open tabs!</h1>
              <p>Would you like to do something about it? 🙃</p>
            </div>
          )}

          {ComposerController.currentlyOpenTabs.map((tab) => (
            <TabPage tabId={tab.id} key={tab.id}>
              {tab.sceneViewController ? (
                /* Scene loaded */
                <>
                  <SceneView controller={tab.sceneViewController} />
                </>
              ) : (
                /* No scene loaded */
                <div className="flex flex-col justify-center items-center h-full">
                  <h1 className="text-h2">No scene loaded</h1>
                  <p>Select a scene to load</p>
                  <ul className="flex flex-col items-center">
                    {ProjectController.currentProject.scenes.map((sceneManifest) => (
                      <button
                        key={sceneManifest.path}
                        onClick={() => ComposerController.loadSceneForTab(tab.id, sceneManifest)}
                        className="button"
                      >{sceneManifest.path}</button>
                    ))}
                  </ul>
                </div>
              )}
            </TabPage>
          ))}
        </Panel>
        <PanelResizeHandle className="drag-separator" />
        <Panel minSize={10}>
          <AssetsAndScenes />
        </Panel>
      </PanelGroup>

      <StatusBar />
    </>
  )
});

export default ComposerPageWrapper;

import type { FunctionComponent } from "react";
import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { PlayIcon, StopIcon, ArrowLeftEndOnRectangleIcon, CubeIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { useLibrary } from "@lib/index";
import { DragAndDropDataProvider } from '@lib/util/drag-and-drop'
import { SceneData } from "@lib/project/data";
import SceneView from "@app/components/composer/SceneView";
import Player from "@app/components/player";
import { AssetsAndScenes } from "@app/components/composer/AssetsAndScenes";
import { TabBar, TabButtonProps, TabPage, TabProvider, useTabState } from "@app/components/tabs";
import { StatusBar } from "@app/components/composer/StatusBar";
import { useSceneDrop } from "@app/interactions";


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
  const { ComposerController } = useLibrary();
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
    const bytes = await ComposerController.debug_buildCartridge(currentlyFocusedTab?.sceneViewController?.scene.id);
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

  // Store tab state in ref to avoid capturing it in a closure
  const TabStateRef = useRef<typeof TabState>(undefined!);
  TabStateRef.current = TabState;

  // Computed state
  const noTabsOpen = ComposerController.currentlyOpenTabs.length === 0;
  const [{ isDragOverThisZone }, DropTarget] = useSceneDrop(
    /* onDrop: */({ sceneData, }) => {
      const TabState = TabStateRef.current;
      if (TabState.currentTabPageId === undefined) {
        // No tab open - we must first open a tab to load the scene into
        const newTabData = createNewTab();
        void ComposerController.loadSceneForTab(newTabData.id, sceneData);
      } else {
        // If scene is already open - switch to tab
        const existingTabForScene = ComposerController.currentlyOpenTabs.find((tab) => tab.sceneViewController?.scene.id === sceneData.id);
        if (existingTabForScene !== undefined) {
          TabState.setCurrentTabPageId(existingTabForScene.id)
          return;
        } else {
          // Replace the current tab
          void ComposerController.loadSceneForTab(TabState.currentTabPageId, sceneData);
        }
      }
    }
  );

  // Functions
  const createNewTab = () => {
    const newTabData = ComposerController.openNewTab();

    setTimeout(() =>
      TabState.setCurrentTabPageId(newTabData.id)
    );
    return newTabData;
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

  const openSceneInAppropriateTab = (scene: SceneData) => {
    // If scene is already open - switch to tab
    const existingTabForScene = ComposerController.currentlyOpenTabs.find((tab) => tab.sceneViewController?.scene.id === scene.id);
    if (existingTabForScene !== undefined) {
      TabState.setCurrentTabPageId(existingTabForScene.id)
      return;
    }

    const currentlyFocusedTabData = ComposerController.currentlyOpenTabs.find((tab) => tab.id === TabState.currentTabPageId)

    // If current tab is empty, replace current tab,
    // Otherwise, open a new tab
    if (TabState.currentTabPageId !== undefined && currentlyFocusedTabData?.sceneViewController === undefined) {
      // The selected tab is empty - load into this tab
      void ComposerController.loadSceneForTab(TabState.currentTabPageId, scene);
    } else {
      // No tab open / the current tab has a scene loaded - load into a new tab
      const newTabData = createNewTab();
      void ComposerController.loadSceneForTab(newTabData.id, scene);
    }
  };

  return (
    <>
      <TabBar tabs={[
        ...ComposerController.currentlyOpenTabs.map((tab) => ({
          type: 'page',
          tabId: tab.id,
          innerContent: (
            <>
              <span className="mr-2">{tab.sceneViewController?.scene.path || "No scene loaded"}</span>

              <div
                role="button"
                tabIndex={0}
                className="hover:bg-pink-400 p-1 inline-flex justify-center items-center"
                onClick={() => closeTab(tab.id)}
              >
                <XMarkIcon className="icon w-4" />
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
          <div
            ref={DropTarget}
            className="w-full h-full relative"
          >
            {/* Overlay for scene drag drop */}
            {isDragOverThisZone &&
              <div className="w-full h-full absolute inset-0 bg-blue-300 opacity-50 z-[1]"></div>
            }
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
                  </div>
                )}
              </TabPage>
            ))}
          </div>
        </Panel>
        <PanelResizeHandle className="drag-separator" />
        <Panel minSize={10}>
          <AssetsAndScenes openScene={openSceneInAppropriateTab} />
        </Panel>
      </PanelGroup>

      <StatusBar />
    </>
  )
});

export default ComposerPageWrapper;

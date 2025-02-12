import type { FunctionComponent } from "react";
import { useEffect, useRef } from "react";
import { ArrowsPointingOutIcon, ArrowPathIcon, ArrowsPointingInIcon } from '@heroicons/react/24/solid';
import { observer } from "mobx-react-lite";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";


import type { SceneViewController } from "@lib/composer/scene";
import { CurrentSelectionTool } from "@lib/composer/scene/SelectionManager";

import { Inspector } from "./Inspector";
import { Hierarchy } from './Hierarchy';


interface Props {
  controller: SceneViewController;
}

const SceneViewComponent: FunctionComponent<Props> = observer(({ controller }) => {
  // Refs
  const canvasParentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasParentRef.current) {
      canvasParentRef.current.appendChild(controller.canvas);
    }

    return controller.startBabylonView();
  }, [controller, controller.canvas]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 pt-0 bg-white flex flex-row shrink-0">
        <button className="button" onClick={() => controller.setCurrentTool(CurrentSelectionTool.Move)}><ArrowsPointingOutIcon className="icon mr-1" /> Move</button>
        <button className="button" onClick={() => controller.setCurrentTool(CurrentSelectionTool.Rotate)}><ArrowPathIcon className="icon mr-1" /> Rotate</button>
        <button className="button" onClick={() => controller.setCurrentTool(CurrentSelectionTool.Scale)}><ArrowsPointingInIcon className="icon mr-1" /> Scale</button>
      </div>
      <PanelGroup direction="horizontal" className="grow select-none">
        <Panel defaultSize={20} minSize={10}>
          {/* Hierarchy */}
          <Hierarchy controller={controller} />
        </Panel>
        <PanelResizeHandle className="drag-separator" />
        <Panel className="flex flex-col h-full">
          {/* Viewport */}
          <div className="grow relative">
            <div className="absolute inset-0" ref={canvasParentRef}>
              {/*
                @NOTE ye-olde absolute position hacks
                Babylon HATES to be in a flex-grow element,
                  it causes it to expand the size of the canvas element every frame.
              */}
              {/* @NOTE Canvas element is inserted here */}
            </div>
          </div>
        </Panel>
        <PanelResizeHandle className="drag-separator" />
        <Panel defaultSize={20} minSize={10} className="flex flex-col">
          {/* Inspector */}
          <Inspector sceneViewController={controller} />
        </Panel>
      </PanelGroup>
    </div>
  );
});

export default SceneViewComponent;

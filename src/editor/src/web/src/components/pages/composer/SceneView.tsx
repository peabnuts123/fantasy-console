import { FunctionComponent, useEffect, useRef, useState } from "react";
import { ChevronRightIcon, ChevronDownIcon, ArrowTurnDownRightIcon, ArrowsPointingOutIcon, ArrowPathIcon, ArrowsPointingInIcon } from '@heroicons/react/24/solid'
import { observer } from "mobx-react-lite";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { GameObjectConfig } from "@fantasy-console/runtime/src/cartridge";

import { SceneViewController } from "@lib/composer/scene";
import { NewObjectMutation } from "@lib/mutation/scene/mutations/NewObjectMutation";
import { CurrentSelectionTool } from "@lib/composer/scene/SelectionManager";

import Condition from "@app/components/util/condition";


interface Props {
  controller: SceneViewController;
}

const SceneViewComponent: FunctionComponent<Props> = observer(({ controller }) => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    return controller.startBabylonView(canvas);
  }, [controller]);

  return (
    <PanelGroup direction="horizontal" className="h-full select-none">
      <Panel defaultSize={20} minSize={10}>
        {/* Hierarchy */}
        <div className="p-2 bg-gradient-to-b from-[blue] to-teal-500 text-white text-retro-shadow">
          <h2 className="text-lg">{controller.scene.path}</h2>
        </div>
        <div className="p-3 bg-slate-300 h-full">
          <button className="button" onClick={() => controller.applyMutation(new NewObjectMutation())}>[Debug] New Object</button>
          {controller.scene.objects.map((gameObject, index) => (
            <SceneHierarchyObject key={index} gameObject={gameObject} />
          ))}
        </div>
      </Panel>
      <PanelResizeHandle className="drag-separator" />
      <Panel className="flex flex-col h-full">
        {/* Viewport */}
        <div className="p-2 bg-slate-300 flex flex-row shrink-0">
          <button className="button" onClick={() => controller.setCurrentTool(CurrentSelectionTool.Move)}><ArrowsPointingOutIcon /> Move</button>
          <button className="button" onClick={() => controller.setCurrentTool(CurrentSelectionTool.Rotate)}><ArrowPathIcon /> Rotate</button>
          <button className="button" onClick={() => controller.setCurrentTool(CurrentSelectionTool.Scale)}><ArrowsPointingInIcon /> Scale</button>
        </div>
        <div className="grow relative">
          <div className="absolute inset-0">
            {/*
              @NOTE ye-olde absolute position hacks
              Babylon HATES to be in a flex-grow element,
                it causes it to expand the size of the canvas element every frame.
            */}
            <canvas
              ref={canvasRef}
              className="w-full h-full"
            />
          </div>
        </div>
      </Panel>
      <PanelResizeHandle className="drag-separator" />
      <Panel defaultSize={20} minSize={10}>
        {/* Inspector */}
        <div className="p-2 bg-gradient-to-b from-[blue] to-pink-500 text-white text-retro-shadow">
          <h2 className="text-lg">Inspector</h2>
          {/* @TODO close or something (debug) */}
        </div>
        <div className="p-3 bg-slate-300 h-full">
          <Condition if={!!controller.selectedObject}
            then={() => (
              <>
                <h3>{controller.selectedObject!.name}</h3>
                {controller.selectedObject!.components.map((component, index) => (
                  <div key={index} className="p-2 bg-slate-400">
                    <h4>{component.componentName}</h4>
                  </div>
                ))}
              </>
            )}
            else={() => (
              <p>No object selected</p>
            )}
          />

        </div>
      </Panel>
    </PanelGroup>
  );
});

interface SceneHierarchyObjectProps {
  gameObject: GameObjectConfig;
  indentLevel?: number;
}
const SceneHierarchyObject: FunctionComponent<SceneHierarchyObjectProps> = ({ gameObject, indentLevel }) => {
  // Default `indentLevel` to 0 if not provided
  indentLevel ??= 0;

  // State
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Computed state
  const hasChildren = gameObject.children.length > 0;

  return (
    <>
      <div
        style={{ paddingLeft: `${indentLevel * 10}px` }}
        className="cursor-pointer hover:bg-blue-300"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <Condition if={hasChildren}
          then={() =>
            <Condition if={!isCollapsed}
              then={() => <ChevronDownIcon />}
              else={() => <ChevronRightIcon />}
            />
          }
          else={() => <ArrowTurnDownRightIcon className="opacity-20" />}
        />
        {gameObject.name}
      </div>
      <Condition if={hasChildren && !isCollapsed}
        then={() =>
          gameObject.children.map((gameObject, index) => (
            <SceneHierarchyObject key={index} gameObject={gameObject} indentLevel={indentLevel + 1} />
          ))
        }
      />
    </>
  )
}

export default SceneViewComponent;

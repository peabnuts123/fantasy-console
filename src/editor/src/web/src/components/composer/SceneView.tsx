import type { FunctionComponent } from "react";
import { useEffect, useRef, useState } from "react";
import { ChevronRightIcon, ChevronDownIcon, ArrowTurnDownRightIcon, ArrowsPointingOutIcon, ArrowPathIcon, ArrowsPointingInIcon } from '@heroicons/react/24/solid'
import { observer } from "mobx-react-lite";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import cn from 'classnames';

import type { SceneViewController } from "@lib/composer/scene";
import { CurrentSelectionTool } from "@lib/composer/scene/SelectionManager";
import type { GameObjectData } from "@lib/composer/data";
import { CreateBlankGameObjectMutation } from "@lib/mutation/scene/mutations";

import Condition from "@app/components/util/condition";
import { Inspector } from "./Inspector";


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

  // Functions
  const onClickNewObject = () => {
    controller.mutator.apply(new CreateBlankGameObjectMutation());
  }

  return (
    <PanelGroup direction="horizontal" className="h-full select-none">
      <Panel defaultSize={20} minSize={10}>
        {/* Hierarchy */}
        <div className="p-2 bg-gradient-to-b from-[blue] to-teal-500 text-white text-retro-shadow">
          <h2 className="text-lg">{controller.scene.path}</h2>
        </div>
        <div className="p-3 bg-slate-300 h-full">
          <button className="button" onClick={onClickNewObject}>New Object</button>
          {controller.scene.objects.map((gameObject, index) => (
            <SceneHierarchyObject key={index} gameObject={gameObject} controller={controller} />
          ))}
        </div>
      </Panel>
      <PanelResizeHandle className="drag-separator" />
      <Panel className="flex flex-col h-full">
        {/* Viewport */}
        <div className="p-2 bg-slate-300 flex flex-row shrink-0">
          <button className="button" onClick={() => controller.setCurrentTool(CurrentSelectionTool.Move)}><ArrowsPointingOutIcon className="icon mr-1" /> Move</button>
          <button className="button" onClick={() => controller.setCurrentTool(CurrentSelectionTool.Rotate)}><ArrowPathIcon className="icon mr-1" /> Rotate</button>
          <button className="button" onClick={() => controller.setCurrentTool(CurrentSelectionTool.Scale)}><ArrowsPointingInIcon className="icon mr-1" /> Scale</button>
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
      <Panel defaultSize={20} minSize={10} className="flex flex-col">
        {/* Inspector */}
        <Inspector sceneViewController={controller} />
      </Panel>
    </PanelGroup>
  );
});

interface SceneHierarchyObjectProps {
  controller: SceneViewController;
  gameObject: GameObjectData;
  indentLevel?: number;
}
const SceneHierarchyObject: FunctionComponent<SceneHierarchyObjectProps> = observer(({ gameObject, indentLevel, controller }) => {
  // Default `indentLevel` to 0 if not provided
  indentLevel ??= 0;

  // State
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Computed state
  const hasChildren = gameObject.children.length > 0;
  const isSelected = controller.selectedObject === gameObject;

  return (
    <>
      <div
        style={{ paddingLeft: `${indentLevel * 10}px` }}
        className={cn("cursor-pointer hover:bg-slate-400", { '!bg-blue-400': isSelected })}
        onClick={() => controller.selectionManager.select(gameObject)}
      >
        <Condition if={hasChildren}
          then={() =>
            <span onClick={() => setIsCollapsed(!isCollapsed)}>
              <Condition if={!isCollapsed}
                then={() => <ChevronDownIcon className="icon" />}
                else={() => <ChevronRightIcon className="icon" />}
              />
            </span>
          }
          else={() => <ArrowTurnDownRightIcon className="icon opacity-20" />}
        />
        {gameObject.name}
      </div>
      <Condition if={hasChildren && !isCollapsed}
        then={() =>
          gameObject.children.map((gameObject, index) => (
            <SceneHierarchyObject key={index} gameObject={gameObject} indentLevel={indentLevel + 1} controller={controller} />
          ))
        }
      />
    </>
  )
});

export default SceneViewComponent;

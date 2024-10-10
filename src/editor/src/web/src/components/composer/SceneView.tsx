import type { FunctionComponent } from "react";
import { useEffect, useRef, useState } from "react";
import { ChevronRightIcon, ChevronDownIcon, ArrowTurnDownRightIcon, ArrowsPointingOutIcon, ArrowPathIcon, ArrowsPointingInIcon } from '@heroicons/react/24/solid'
import { observer } from "mobx-react-lite";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import cn from 'classnames';

import type { SceneViewController } from "@lib/composer/scene";
import { CurrentSelectionTool } from "@lib/composer/scene/SelectionManager";
import type { GameObjectData } from "@lib/composer/data";
import { SetGameObjectPositionMutation, SetGameObjectRotationMutation, SetGameObjectScaleMutation, SetGameObjectNameMutation, NewObjectMutation } from "@lib/mutation/scene/mutations";

import Condition from "@app/components/util/condition";
import { VectorInput } from "./inspector/VectorInput";
import { TextInput } from "./inspector/TextInput";
import { getInspectorFor } from "./inspector/GameObjectComponents";


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
          <button className="button" onClick={() => controller.mutator.apply(new NewObjectMutation())}>[Debug] New Object</button>
          {controller.scene.objects.map((gameObject, index) => (
            <SceneHierarchyObject key={index} gameObject={gameObject} controller={controller} />
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
      <Panel defaultSize={20} minSize={10} className="flex flex-col">
        {/* Inspector */}
        <div className="p-2 bg-gradient-to-b from-[blue] to-pink-500 text-white text-retro-shadow shrink-0">
          <h2 className="text-lg">Inspector</h2>
        </div>
        <div className="bg-slate-300 h-full overflow-y-scroll grow">
          <Condition if={!!controller.selectedObject}
            then={() => (
              <>
                <div className="p-2">
                  {/* Name */}
                  <TextInput
                    label="Name"
                    value={controller.selectedObject!.name}
                    onChange={(newName) => {
                      if (newName && newName.trim()) {
                        controller.mutator.debounceContinuous(
                          SetGameObjectNameMutation,
                          controller.selectedObject!,
                          () => new SetGameObjectNameMutation(controller.selectedObject!),
                          () => ({ name: newName })
                        )
                      }
                    }}
                  />

                  {/* Position */}
                  <VectorInput
                    label="Position"
                    vector={controller.selectedObject!.transform.position}
                    onChange={(newValue) => controller.mutator.debounceContinuous(
                      SetGameObjectPositionMutation,
                      controller.selectedObject!,
                      () => new SetGameObjectPositionMutation(controller.selectedObject!),
                      () => ({ position: newValue, resetGizmo: true })
                    )}
                  />

                  {/* Rotation */}
                  <VectorInput
                    label="Rotation"
                    vector={controller.selectedObject!.transform.rotation}
                    incrementInterval={Math.PI / 8}
                    // @TODO Parse value and limit to rotational values
                    onChange={(newValue) => controller.mutator.debounceContinuous(
                      SetGameObjectRotationMutation,
                      controller.selectedObject!,
                      () => new SetGameObjectRotationMutation(controller.selectedObject!),
                      () => ({ rotation: newValue, resetGizmo: true })
                    )}
                  />

                  {/* Scale */}
                  <VectorInput
                    label="Scale"
                    vector={controller.selectedObject!.transform.scale}
                    incrementInterval={0.25}
                    onChange={(newValue) => controller.mutator.debounceContinuous(
                      SetGameObjectScaleMutation,
                      controller.selectedObject!,
                      () => new SetGameObjectScaleMutation(controller.selectedObject!),
                      () => ({ scale: newValue, resetGizmo: true })
                    )}
                  />
                </div>

                {/* Components */}
                {controller.selectedObject!.components.map((component, index) => {
                  // Look up inspector UI for component
                  const InspectorComponent = getInspectorFor(component);
                  return <InspectorComponent
                    key={index}
                    component={component}
                    controller={controller}
                    gameObject={controller.selectedObject!}
                  />;
                })}
              </>
            )}
            else={() => (
              <div className="p-2">
                <p className="italic">No object selected</p>
              </div>
            )}
          />

        </div>
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
                then={() => <ChevronDownIcon />}
                else={() => <ChevronRightIcon />}
              />
            </span>
          }
          else={() => <ArrowTurnDownRightIcon className="opacity-20" />}
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

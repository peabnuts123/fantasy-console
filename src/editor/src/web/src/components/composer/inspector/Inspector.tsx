import { useRef, type FunctionComponent } from "react";
import { observer } from "mobx-react-lite";

import { ComponentDefinitionType } from "@fantasy-console/runtime/src/cartridge";

import Condition from "@app/components/util/condition";
import {
  SetGameObjectPositionMutation,
  SetGameObjectRotationMutation,
  SetGameObjectScaleMutation,
  SetGameObjectNameMutation,
  AddGameObjectComponentMutation,
} from "@lib/mutation/scene/mutations";
import type { SceneViewController } from "@lib/composer/scene";
import { VectorInput } from "./VectorInput";
import { TextInput } from "./TextInput";
import { getInspectorFor } from "./GameObjectComponents";
import { CameraComponentData, DirectionalLightComponentData, IComposerComponentData, MeshComponentData, PointLightComponentData } from "@lib/composer/data";



interface Props {
  sceneViewController: SceneViewController;
}

export const Inspector: FunctionComponent<Props> = observer(({ sceneViewController }) => {
  // Refs
  const addNewComponentElement = useRef<HTMLSelectElement>(null);

  // Computed state
  const selectedObject = sceneViewController.selectedObject;
  const isAnyObjectSelected = selectedObject !== undefined;

  const debug_newWindow = async () => {
    const { WebviewWindow } = await import("@tauri-apps/api/window")
    const webview = new WebviewWindow('theUniqueLabel', {
      url: '/modal/placeholder',
      // center: true,
      hiddenTitle: true,
      skipTaskbar: true,
      title: "Hoopla"
    })
    // since the webview window is created asynchronously,
    // Tauri emits the `tauri://created` and `tauri://error` to notify you of the creation response
    webview.once('tauri://created', function () {
      console.log(`[SceneView] (debug_newWindow) Created new window`);
      const doItYeah = () => {
        console.log(`Calling back from modal`);
      }
      setTimeout(() => {
        console.log(`pong!`);

        webview.emit('init', {
          a: 2,
          name: "hello (rambotan included)",
          something: doItYeah,
          rambotan: () => { console.log("Rmabotan") },

          // etc.
        })

        webview.once('result', (e) => {
          console.log(`[SceneView] (debug_newWindow) Got result from modal:`, e);
        });
      }, 600);
    })
    webview.once('tauri://error', function (e) {
      console.error(`[SceneView] (debug_newWindow) Failed to create new window`, e);
    })
  };

  const onAddNewComponent = (type: ComponentDefinitionType) => {
    const selectControl = addNewComponentElement.current!;

    // Ensure select control doesn't change to the selected value
    selectControl.value = "";

    let newComponent: IComposerComponentData;
    switch (type) {
      case ComponentDefinitionType.Camera:
        newComponent = CameraComponentData.createDefault();
        break;
      case ComponentDefinitionType.DirectionalLight:
        newComponent = DirectionalLightComponentData.createDefault();
        break;
      case ComponentDefinitionType.Mesh:
        newComponent = MeshComponentData.createDefault();
        break;
      case ComponentDefinitionType.PointLight:
        newComponent = PointLightComponentData.createDefault();
        break;
      case ComponentDefinitionType.Script:
      // break;
      default:
        throw new Error(`Cannot add new component. Unimplemented component type: '${type}'`);
    }

    sceneViewController.mutator.apply(new AddGameObjectComponentMutation(
      selectedObject!,
      newComponent
    ));
  }

  return (
    <>
      <div className="p-2 bg-gradient-to-b from-[blue] to-pink-500 text-white text-retro-shadow shrink-0">
        <h2 className="text-lg">Inspector</h2>
        <button className="button" onClick={debug_newWindow}>[DEBUG] New window</button>
      </div>
      <div className="bg-slate-300 h-full overflow-y-scroll grow">
        <Condition if={isAnyObjectSelected}
          then={() => (
            <>
              <div className="p-2">
                {/* Name */}
                <TextInput
                  label="Name"
                  value={selectedObject!.name}
                  onChange={(newName) => {
                    if (newName && newName.trim()) {
                      sceneViewController.mutator.debounceContinuous(
                        SetGameObjectNameMutation,
                        selectedObject!,
                        () => new SetGameObjectNameMutation(selectedObject!),
                        () => ({ name: newName })
                      )
                    }
                  }}
                />

                {/* Position */}
                <VectorInput
                  label="Position"
                  vector={selectedObject!.transform.position}
                  onChange={(newValue) => sceneViewController.mutator.debounceContinuous(
                    SetGameObjectPositionMutation,
                    selectedObject!,
                    () => new SetGameObjectPositionMutation(selectedObject!),
                    () => ({ position: newValue, resetGizmo: true })
                  )}
                />

                {/* Rotation */}
                <VectorInput
                  label="Rotation"
                  vector={selectedObject!.transform.rotation}
                  incrementInterval={Math.PI / 8}
                  // @TODO Parse value and limit to rotational values
                  onChange={(newValue) => sceneViewController.mutator.debounceContinuous(
                    SetGameObjectRotationMutation,
                    selectedObject!,
                    () => new SetGameObjectRotationMutation(selectedObject!),
                    () => ({ rotation: newValue, resetGizmo: true })
                  )}
                />

                {/* Scale */}
                <VectorInput
                  label="Scale"
                  vector={selectedObject!.transform.scale}
                  incrementInterval={0.25}
                  onChange={(newValue) => sceneViewController.mutator.debounceContinuous(
                    SetGameObjectScaleMutation,
                    selectedObject!,
                    () => new SetGameObjectScaleMutation(selectedObject!),
                    () => ({ scale: newValue, resetGizmo: true })
                  )}
                />
              </div>

              {/* Components */}
              {selectedObject!.components.map((component, index) => {
                // Look up inspector UI for component
                const InspectorComponent = getInspectorFor(component);
                return <InspectorComponent
                  key={index}
                  component={component}
                  controller={sceneViewController}
                  gameObject={selectedObject!}
                />;
              })}

              {/* Add new component */}
              <select
                ref={addNewComponentElement}
                name="add-new-component"
                className="w-full p-3"
                onChange={(e) => onAddNewComponent(e.target.value as ComponentDefinitionType)}
                value=""
              >
                <option value=""> -- Add new component -- </option>
                <option value={ComponentDefinitionType.Mesh}>Mesh</option>
                <option value={ComponentDefinitionType.Script}>Script</option>
                <option value={ComponentDefinitionType.Camera}>Camera</option>
                <option value={ComponentDefinitionType.DirectionalLight}>Directional Light</option>
                <option value={ComponentDefinitionType.PointLight}>Point Light</option>
              </select>
            </>
          )}
          else={() => (
            <div className="p-2">
              <p className="italic">No object selected</p>
            </div>
          )}
        />
      </div>
    </>
  );
});
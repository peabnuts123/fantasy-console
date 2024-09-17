import { makeAutoObservable, runInAction } from "mobx";
import { GizmoManager } from "@babylonjs/core/Gizmos/gizmoManager";
import { PositionGizmo } from "@babylonjs/core/Gizmos/positionGizmo";
import { BoundingBoxGizmo } from "@babylonjs/core/Gizmos/boundingBoxGizmo";
import { UtilityLayerRenderer } from "@babylonjs/core/Rendering/utilityLayerRenderer";
import { Scene as BabylonScene } from '@babylonjs/core/scene';
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { RotationGizmo } from "@babylonjs/core/Gizmos/rotationGizmo";
import { ScaleGizmo } from "@babylonjs/core/Gizmos/scaleGizmo";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 as Vector3Babylon } from "@babylonjs/core";

import { toCoreVector3 } from "@fantasy-console/runtime/src/util";

import { SetGameObjectPositionMutation, SetGameObjectRotationMutation, SetGameObjectScaleMutation } from "@lib/mutation/scene/mutations";
import { SceneViewMutator } from "@lib/mutation/scene/SceneViewMutator";
import { GameObjectConfigComposer } from "../config";


export enum CurrentSelectionTool {
  Move = 'move',
  Rotate = 'rotate',
  Scale = 'scale',
}

export class SelectionManager {
  private readonly gizmoManager: GizmoManager;
  private readonly moveGizmo: PositionGizmo;
  private readonly rotateGizmo: RotationGizmo;
  private readonly scaleGizmo: ScaleGizmo;
  private readonly boundingBoxGizmo: BoundingBoxGizmo;

  private _currentTool: CurrentSelectionTool = CurrentSelectionTool.Rotate;
  private _selectedObject: GameObjectConfigComposer | undefined = undefined;
  private fakeTransformTarget: TransformNode | undefined = undefined;

  private currentMoveMutation: SetGameObjectPositionMutation | undefined = undefined;
  private currentRotateMutation: SetGameObjectRotationMutation | undefined = undefined;
  private currentScaleMutation: SetGameObjectScaleMutation | undefined = undefined;

  public constructor(scene: BabylonScene, mutator: SceneViewMutator) {

    const utilityLayer = new UtilityLayerRenderer(scene);
    this.gizmoManager = new GizmoManager(scene, 2, utilityLayer);
    this.gizmoManager.usePointerToAttachGizmos = false;

    // Move
    this.moveGizmo = new PositionGizmo(utilityLayer, 2, this.gizmoManager);
    this.moveGizmo.planarGizmoEnabled = true;
    this.moveGizmo.onDragStartObservable.add(() => {
      runInAction(() => {
        this.currentMoveMutation = new SetGameObjectPositionMutation(this.selectedObject!);
        mutator.beginContinuous(this.currentMoveMutation);
      });
    });
    this.moveGizmo.onDragObservable.add((_eventData) => {
      if (this.selectedObject !== undefined) {
        runInAction(() => {
          mutator.updateContinuous(this.currentMoveMutation!, {
            position: toCoreVector3(this.fakeTransformTarget!.position),
          });
        });
      }
    });
    this.moveGizmo.onDragEndObservable.add(() => {
      runInAction(() => {
        mutator.apply(this.currentMoveMutation!);
        this.currentMoveMutation = undefined;
      });
    });

    // Rotate
    this.rotateGizmo = new RotationGizmo(utilityLayer, 32, true, 6, this.gizmoManager);
    this.rotateGizmo.onDragStartObservable.add(() => {
      runInAction(() => {
        this.currentRotateMutation = new SetGameObjectRotationMutation(this.selectedObject!);
        mutator.beginContinuous(this.currentRotateMutation);
      });
    });
    this.rotateGizmo.onDragObservable.add((_eventData) => {
      if (this.selectedObject !== undefined) {
        // Sometimes the rotation comes down as a quaternion, and sometimes not.
        // At this stage, I don't really know why ¯\_(ツ)_/¯
        let rotation: Vector3Babylon;
        if (this.fakeTransformTarget!.rotationQuaternion !== null) {
          // console.log(`[SelectionManager] (rotateGizmo.onDragObservable) Using quaternion rotation. Euler: `,);
          rotation = this.fakeTransformTarget!.rotationQuaternion.toEulerAngles();
        } else {
          // console.log(`[SelectionManager] (rotateGizmo.onDragObservable) Using euler rotation.`);
          rotation = this.fakeTransformTarget!.rotation;
        }

        runInAction(() => {
          mutator.updateContinuous(this.currentRotateMutation!, {
            rotation: toCoreVector3(rotation),
          });
        });
      }
    });
    this.rotateGizmo.onDragEndObservable.add((_eventData) => {
      runInAction(() => {
        mutator.apply(this.currentRotateMutation!);
        this.currentRotateMutation = undefined;
      });
    })

    // Scale
    this.scaleGizmo = new ScaleGizmo(utilityLayer, 2, this.gizmoManager);
    this.scaleGizmo.onDragStartObservable.add(() => {
      runInAction(() => {
        this.currentScaleMutation = new SetGameObjectScaleMutation(this.selectedObject!);
        mutator.beginContinuous(this.currentScaleMutation);
      });
    });
    this.scaleGizmo.onDragObservable.add((_eventData) => {
      if (this.selectedObject !== undefined) {
        // Scaling is handled as a percentage to accommodate rotation
        runInAction(() => {
          mutator.updateContinuous(this.currentScaleMutation!, {
            scaleDelta: toCoreVector3(this.fakeTransformTarget!.scaling),
          });
        });
        // @NOTE Reset scaling to uniform scale, because rotation doesn't work with non-uniform scaling
        this.fakeTransformTarget!.scaling = Vector3Babylon.One();
      }
    });
    this.scaleGizmo.onDragEndObservable.add(() => {
      runInAction(() => {
        mutator.apply(this.currentScaleMutation!);
        this.currentScaleMutation = undefined;
      });
    });

    // Bounding box
    this.boundingBoxGizmo = new BoundingBoxGizmo(Color3.Yellow(), utilityLayer);
    this.boundingBoxGizmo.setEnabledScaling(false);
    this.boundingBoxGizmo.setEnabledRotationAxis("");

    this.updateGizmos();

    makeAutoObservable(this);
  }

  public select(gameObject: GameObjectConfigComposer): void {
    console.log(`[SelectionManager] (select) gameObject: `, gameObject);
    this.selectedObject = gameObject;
  }

  public deselectAll(): void {
    console.log(`[SelectionManager] (deselectAll) Deselected.`);
    this.selectedObject = undefined;
  }

  private updateGizmos() {
    // Clear all gizmos
    this.moveGizmo.attachedNode = null;
    this.rotateGizmo.attachedNode = null;
    this.scaleGizmo.attachedNode = null;
    this.boundingBoxGizmo.attachedMesh = null;


    if (this.selectedObject !== undefined) {
      const realTransformTarget = this.selectedObject.sceneInstance!.transform.node;
      const fakeTransformTarget = this.fakeTransformTarget = realTransformTarget.clone("SelectionManager_fakeTransformTarget", null, true) as TransformNode;

      // Reset scaling to uniform scale, because rotation doesn't work with non-uniform scaling
      // Scaling is done as a percentage to accommodate this
      fakeTransformTarget.scaling = Vector3Babylon.One();

      // Enable bounding box
      // @NOTE Type laundering (huff my duff, Babylon))
      this.boundingBoxGizmo.attachedMesh = realTransformTarget as AbstractMesh;

      // Enable only the current tool
      switch (this.currentTool) {
        case CurrentSelectionTool.Move:
          this.moveGizmo.attachedNode = fakeTransformTarget;
          break;
        case CurrentSelectionTool.Rotate:
          this.rotateGizmo.attachedNode = fakeTransformTarget;
          break;
        case CurrentSelectionTool.Scale:
          this.scaleGizmo.attachedNode = fakeTransformTarget
          break;
        default:
          console.error(`[SelectionManager] (updateGizmos) Unimplemented tool type: ${this.currentTool}`);
      }
    }
  }

  // Selected object
  public get selectedObject(): GameObjectConfigComposer | undefined {
    return this._selectedObject;
  }
  private set selectedObject(value: GameObjectConfigComposer | undefined) {
    this._selectedObject = value;
    this.updateGizmos();
  }

  // Current tool
  public get currentTool(): CurrentSelectionTool {
    return this._currentTool;
  }
  public set currentTool(value: CurrentSelectionTool) {
    this._currentTool = value;
    this.updateGizmos();
  }
}
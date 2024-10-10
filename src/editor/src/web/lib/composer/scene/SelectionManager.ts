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
import { Vector3 as Vector3Babylon } from "@babylonjs/core/Maths/math.vector";

import { toVector3Core } from "@fantasy-console/runtime/src/util";

import { SetGameObjectPositionMutation, SetGameObjectRotationMutation, SetGameObjectScaleMutation } from "@lib/mutation/scene/mutations";
import { SceneViewMutator } from "@lib/mutation/scene/SceneViewMutator";
import { GameObjectData } from "@lib/composer/data";


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
  private _selectedObject: GameObjectData | undefined = undefined;
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
      this.currentMoveMutation = new SetGameObjectPositionMutation(this.selectedObject!);
      mutator.beginContinuous(this.currentMoveMutation);
    });
    this.moveGizmo.onDragObservable.add((_eventData) => {
      if (this.selectedObject !== undefined) {
        mutator.updateContinuous(this.currentMoveMutation!, {
          position: toVector3Core(this.fakeTransformTarget!.position),
        });
      }
    });
    this.moveGizmo.onDragEndObservable.add(() => {
      mutator.apply(this.currentMoveMutation!);
      this.currentMoveMutation = undefined;
    });

    // Rotate
    this.rotateGizmo = new RotationGizmo(utilityLayer, 32, true, 6, this.gizmoManager);
    this.rotateGizmo.onDragStartObservable.add(() => {
      this.currentRotateMutation = new SetGameObjectRotationMutation(this.selectedObject!);
      mutator.beginContinuous(this.currentRotateMutation);
    });
    this.rotateGizmo.onDragObservable.add((_eventData) => {
      if (this.selectedObject !== undefined) {
        // Sometimes the rotation comes down as a quaternion, and sometimes not.
        // At this stage, I don't really know why ¯\_(ツ)_/¯
        let rotation: Vector3Babylon;
        if (this.fakeTransformTarget!.rotationQuaternion !== null) {
          // console.log(`[SelectionManager] (rotateGizmo.onDragObservable) Using quaternion rotation.`);
          rotation = this.fakeTransformTarget!.rotationQuaternion.toEulerAngles();
        } else {
          // console.log(`[SelectionManager] (rotateGizmo.onDragObservable) Using euler rotation.`);
          rotation = this.fakeTransformTarget!.rotation;
        }

        mutator.updateContinuous(this.currentRotateMutation!, {
          rotation: toVector3Core(rotation),
        });
      }
    });
    this.rotateGizmo.onDragEndObservable.add((_eventData) => {
      mutator.apply(this.currentRotateMutation!);
      this.currentRotateMutation = undefined;
    })

    // Scale
    this.scaleGizmo = new ScaleGizmo(utilityLayer, 2, this.gizmoManager);
    this.scaleGizmo.onDragStartObservable.add(() => {
      this.currentScaleMutation = new SetGameObjectScaleMutation(this.selectedObject!);
      mutator.beginContinuous(this.currentScaleMutation);
    });
    this.scaleGizmo.onDragObservable.add((_eventData) => {
      if (this.selectedObject !== undefined) {
        // Scaling is handled as a percentage to accommodate rotation
        mutator.updateContinuous(this.currentScaleMutation!, {
          scaleDelta: toVector3Core(this.fakeTransformTarget!.scaling),
        });
        // @NOTE Reset scaling to uniform scale, because rotation doesn't work with non-uniform scaling
        this.fakeTransformTarget!.scaling = Vector3Babylon.One();
      }
    });
    this.scaleGizmo.onDragEndObservable.add(() => {
      mutator.apply(this.currentScaleMutation!);
      this.currentScaleMutation = undefined;
    });

    // Bounding box
    this.boundingBoxGizmo = new BoundingBoxGizmo(Color3.Yellow(), utilityLayer);
    this.boundingBoxGizmo.setEnabledScaling(false);
    this.boundingBoxGizmo.setEnabledRotationAxis("");

    this.updateGizmos();

    makeAutoObservable(this);
  }

  public select(gameObject: GameObjectData): void {
    console.log(`[SelectionManager] (select) gameObject: `, gameObject);
    this.selectedObject = gameObject;
  }

  public deselectAll(): void {
    console.log(`[SelectionManager] (deselectAll) Deselected.`);
    this.selectedObject = undefined;
  }

  public updateGizmos() {
    // Clear all gizmos
    this.moveGizmo.attachedNode = null;
    this.rotateGizmo.attachedNode = null;
    this.scaleGizmo.attachedNode = null;
    this.boundingBoxGizmo.attachedMesh = null;

    if (this.selectedObject !== undefined) {
      const realTransformTarget = this.selectedObject.sceneInstance!.transform.node;

      // Construct a new dummy transform target if we need one and it doesn't exist
      if (this.fakeTransformTarget === undefined) {
        this.fakeTransformTarget = new TransformNode("SelectionManager_fakeTransformTarget");
      }

      // Position dummy transform target on the selection target
      this.fakeTransformTarget.position = realTransformTarget.absolutePosition.clone();
      this.fakeTransformTarget.rotationQuaternion = realTransformTarget.absoluteRotationQuaternion.clone();
      // Reset scaling to uniform scale, because rotation doesn't work with non-uniform scaling
      // Scaling is done as a percentage to accommodate this
      this.fakeTransformTarget.scaling = Vector3Babylon.One();

      // Enable bounding box
      // @NOTE Type laundering (huff my duff, Babylon))
      this.boundingBoxGizmo.attachedMesh = realTransformTarget as AbstractMesh;

      // Enable only the current tool
      switch (this.currentTool) {
        case CurrentSelectionTool.Move:
          this.moveGizmo.attachedNode = this.fakeTransformTarget;
          break;
        case CurrentSelectionTool.Rotate:
          this.rotateGizmo.attachedNode = this.fakeTransformTarget;
          break;
        case CurrentSelectionTool.Scale:
          this.scaleGizmo.attachedNode = this.fakeTransformTarget
          break;
        default:
          console.error(`[SelectionManager] (updateGizmos) Unimplemented tool type: ${this.currentTool}`);
      }
    } else {
      // Destroy dummy transform target if we've deselected
      this.fakeTransformTarget?.dispose();
      this.fakeTransformTarget = undefined;
    }
  }

  // Selected object
  public get selectedObject(): GameObjectData | undefined {
    return this._selectedObject;
  }
  private set selectedObject(value: GameObjectData | undefined) {
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

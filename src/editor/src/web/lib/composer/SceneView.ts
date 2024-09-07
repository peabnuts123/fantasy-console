import { makeAutoObservable } from 'mobx';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene as BabylonScene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import * as Jsonc from 'jsonc-parser';
import "@babylonjs/loaders/OBJ/objFileLoader";
import { AssetContainer } from '@babylonjs/core/assetContainer';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import '@babylonjs/core/Culling/ray'; // @NOTE needed for mesh picking - contains side effects

import { TransformBabylon } from '@fantasy-console/runtime/src/world/TransformBabylon';
import { AssetConfig } from '@fantasy-console/runtime/src/cartridge/config';
import { SceneDefinition } from '@fantasy-console/runtime/src/cartridge/archive';
import { debug_modTextures } from '@fantasy-console/runtime';
import { IFileSystem } from '@fantasy-console/runtime/src/filesystem';
import { DirectionalLightComponentBabylon, PointLightComponentBabylon } from '@fantasy-console/runtime/src/world/components';
import { GameObjectBabylon } from '@fantasy-console/runtime/src/world/GameObjectBabylon';

import { SceneManifest } from '@lib/project/definition/scene';
import { ISceneMutation } from '@lib/composer/mutation';
import { NewObjectMutation } from '@lib/composer/mutation/scene';
import { JsoncContainer } from '@lib/util/JsoncContainer';
import { ProjectController } from '@lib/project/ProjectController';
import { CameraComponentConfigComposer, DirectionalLightComponentConfigComposer, MeshComponentConfigComposer, PointLightComponentConfigComposer, ScriptComponentConfigComposer } from './config/components';
import { SceneConfigComposer } from './config/SceneConfigComposer';
import { MeshComponentComposer } from './world/components';
import { GameObjectConfigComposer } from './config/GameObjectConfigComposer';
import { ComposerSelectionCache } from './util/ComposerSelectionCache';
import { UtilityLayerRenderer } from '@babylonjs/core/Rendering/utilityLayerRenderer';
import { PositionGizmo } from '@babylonjs/core/Gizmos/positionGizmo';
import { GizmoManager } from '@babylonjs/core/Gizmos/gizmoManager';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { BoundingBoxGizmo } from '@babylonjs/core/Gizmos/boundingBoxGizmo';

export class SceneView {
  private readonly _scene: SceneConfigComposer;
  private readonly _sceneJson: JsoncContainer<SceneDefinition>;
  private readonly projectController: ProjectController;

  // @TODO different classes for the "states" of SceneView or something? So that not everything is nullable
  private engine?: Engine = undefined;
  private babylonScene?: BabylonScene = undefined;
  private assetCache: Map<AssetConfig, AssetContainer>;
  private gizmoController?: GizmoController = undefined;

  private babylonToWorldSelectionCache: ComposerSelectionCache;
  private _selectedObject: GameObjectConfigComposer | undefined = undefined;

  public constructor(scene: SceneConfigComposer, sceneJson: JsoncContainer<SceneDefinition>, projectController: ProjectController) {
    this._scene = scene;
    this._sceneJson = sceneJson;
    this.projectController = projectController;
    this.assetCache = new Map();
    this.babylonToWorldSelectionCache = new ComposerSelectionCache();
    this.reset();

    // @NOTE Class properties MUST have a value explicitly assigned
    // by this point otherwise mobx won't pick them up.
    makeAutoObservable(this);
  }

  private reset() {
    this.engine = undefined;
    this.babylonScene = undefined;
    this.assetCache = new Map();
  }

  public debug_newObject(): void {
    this.debug_applyMutation(new NewObjectMutation());
  }

  private debug_applyMutation(mutation: ISceneMutation) {
    // @TODO @DEBUG store state in a stack and stuff
    mutation.apply({
      SceneView: this,
      ProjectController: this.projectController,
    });
  }

  private onSelectionChange() {
    if (this.selectedObject !== undefined) {
      console.log(`[Pick] gameObject: `, this.selectedObject);
      this.gizmoController?.setTarget(this.selectedObject.sceneInstance!);
    } else {
      console.log(`[Pick] Deselected.`);
      this.gizmoController?.clearTarget();
    }
  }

  public startBabylonView(canvas: HTMLCanvasElement) {
    /* Scene */
    const engine = this.engine = new Engine(canvas, true, {}, true);
    const scene = this.babylonScene = new BabylonScene(this.engine);

    /* Lifecycle */
    const resizeObserver = new ResizeObserver((entries) => {
      const newSize = entries[0].contentRect;
      this.engine!.setSize(newSize.width * devicePixelRatio, newSize.height * devicePixelRatio, true);
    });
    resizeObserver.observe(canvas);

    // Build scene (async)
    void (async () => {
      // @DEBUG Random camera constants
      const camera = new FreeCamera("main", new Vector3(0, 5, -10), this.babylonScene);
      camera.setTarget(Vector3.Zero());
      camera.attachControl(canvas, true);
      camera.speed = 0.3;
      camera.minZ = 0.1;
      /* @NOTE WASD+Shift+Space */
      camera.keysUp.push(87);
      camera.keysLeft.push(65);
      camera.keysRight.push(68);
      camera.keysDown.push(83);
      camera.keysUpward.push(32);
      camera.keysDownward.push(16);

      await this.createScene()

      await scene.whenReadyAsync()

      scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === PointerEventTypes.POINTERTAP) {
          if (!pointerInfo.pickInfo?.hit) {
            this.selectedObject = undefined;
            this.onSelectionChange();
          } else if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh !== null) {
            // console.log(`[Pick] pickedMesh`, pointerInfo.pickInfo.pickedMesh);
            let pickedGameObject = this.babylonToWorldSelectionCache.get(pointerInfo.pickInfo.pickedMesh);

            if (pickedGameObject === undefined) {
              console.error(`Picked mesh but found no corresponding GameObject in cache. Has it been populated or updated? Picked mesh:`, pointerInfo.pickInfo.pickedMesh);
            } else {
              this.selectedObject = pickedGameObject;
              this.onSelectionChange();
            }
          }
        }
      });

      this.gizmoController = new GizmoController(scene);

      debug_modTextures(scene);

      engine.runRenderLoop(() => {
        scene.render();
      });
    })();

    /* Teardown - when scene view is unloaded */
    const onDestroyView = () => {
      console.log(`[SceneView] (onDestroyView) Goodbye!`);
      // @TODO destroy GameObjects once we sort out what the abstraction difference between this and Runtime is
      scene.dispose();
      scene.onPointerObservable.clear();
      engine.dispose();
      this.reset();
      resizeObserver.unobserve(canvas);
    }
    return onDestroyView;
  }

  private async createScene() {
    /* Scene clear color */
    this.babylonScene!.clearColor = this.scene.config.clearColor;

    /* Set up global ambient lighting */
    const ambientLight = new HemisphericLight("__ambient", new Vector3(0, 0, 0), this.babylonScene);
    ambientLight.intensity = this.scene.config.lighting.ambient.intensity;
    ambientLight.diffuse = this.scene.config.lighting.ambient.color;
    ambientLight.groundColor = this.scene.config.lighting.ambient.color;
    ambientLight.specular = Color3.Black();

    for (let sceneObject of this.scene.objects) {
      await this.createSceneObject(sceneObject);
    }
  }

  // @TODO we probably should try to share this with the runtime in some kind of overridable fashion (?)
  public async createSceneObject(gameObjectConfig: GameObjectConfigComposer, parentTransform: TransformBabylon | undefined = undefined): Promise<GameObjectBabylon> {
    console.log(`[SceneView] (createSceneObject) Loading scene object: `, gameObjectConfig.name);
    // Construct game object transform for constructing scene's hierarchy
    const gameObjectTransform = new TransformBabylon(
      gameObjectConfig.name,
      this.babylonScene!,
      parentTransform,
      // @TODO probably can just take `sceneObject.transform`, huh?
      gameObjectConfig.transform.position
    );

    // Create all child objects first
    // @TODO children
    await Promise.all(gameObjectConfig.children.map((childSceneObject) => this.createSceneObject(childSceneObject, gameObjectTransform)));

    // Create blank object
    const gameObject = new GameObjectBabylon(
      gameObjectConfig.id,
      {
        name: gameObjectConfig.name,
        transform: gameObjectTransform,
      }
    );

    gameObjectTransform.setGameObject(gameObject);

    // Store reverse reference to new instance
    gameObjectConfig.sceneInstance = gameObject;

    // Load game object components
    for (let componentConfig of gameObjectConfig.components) {
      if (componentConfig instanceof MeshComponentConfigComposer) {
        /* Mesh component */
        let meshAsset = await this.loadAssetCached(componentConfig.meshAsset);
        const meshComponent = new MeshComponentComposer({ gameObject }, meshAsset);
        // Mesh component is selectable so populate selection cache
        // @TODO remove from selection cache whenever this object is destroyed (e.g. autoload)
        this.babylonToWorldSelectionCache.add(gameObjectConfig, meshComponent.allSelectableMeshes);
        // Store reverse reference to new instance for managing instance later (e.g. autoload)
        componentConfig.componentInstance = meshComponent;
        gameObject.addComponent(meshComponent);
      } else if (componentConfig instanceof ScriptComponentConfigComposer) {
        /* @NOTE Script has no effect in the Composer */
      } else if (componentConfig instanceof CameraComponentConfigComposer) {
        /* @NOTE Camera has no effect in the Composer */
      } else if (componentConfig instanceof DirectionalLightComponentConfigComposer) {
        /* Directional Light component */
        const light = new DirectionalLight(`light_directional`, Vector3.Down(), this.babylonScene);
        light.specular = Color3.Black();
        light.intensity = componentConfig.intensity;
        light.diffuse = componentConfig.color;
        gameObject.addComponent(new DirectionalLightComponentBabylon({ gameObject }, light));
      } else if (componentConfig instanceof PointLightComponentConfigComposer) {
        /* Point Light component */
        const light = new PointLight(`light_point`, Vector3.Zero(), this.babylonScene);
        light.specular = Color3.Black();
        light.intensity = componentConfig.intensity;
        light.diffuse = componentConfig.color;
        gameObject.addComponent(new PointLightComponentBabylon({ gameObject }, light));
      } else {
        console.error(`[SceneView] (loadSceneObject) Unrecognised component config: `, componentConfig);
      }
    }

    return gameObject;
  }

  /**
   * Load an {@link AssetConfig} through a cache.
   * @param asset Asset to load.
   * @returns The new asset, or a reference to the existing asset if it existed in the cache.
   */
  private async loadAssetCached(asset: AssetConfig): Promise<AssetContainer> {
    let cached = this.assetCache.get(asset);
    if (cached) {
      return cached;
    } else {
      let assetContainer = await SceneLoader.LoadAssetContainerAsync(
        asset.babylonFetchUrl,
        undefined,
        this.babylonScene,
        undefined,
        asset.fileExtension
      );
      this.assetCache.set(asset, assetContainer);
      return assetContainer;
    }
  }

  public static async loadSceneDefinition(sceneManifest: SceneManifest, fileSystem: IFileSystem): Promise<[SceneDefinition, string]> {
    const sceneFile = await fileSystem.readFile(sceneManifest.path);
    const sceneJson = sceneFile.textContent;
    const sceneDefinition = Jsonc.parse(sceneJson) as SceneDefinition;
    // @NOTE path property comes from manifest in the composer
    sceneDefinition.path = sceneManifest.path;
    return [sceneDefinition, sceneJson];
  }

  public static async loadFromManifest(sceneManifest: SceneManifest, projectController: ProjectController): Promise<SceneView> {
    const [sceneDefinition, sceneJson] = await SceneView.loadSceneDefinition(sceneManifest, projectController.fileSystem);
    return new SceneView(new SceneConfigComposer(sceneDefinition, projectController.assetDb), new JsoncContainer<SceneDefinition>(sceneJson), projectController);
  }

  public get scene(): SceneConfigComposer {
    return this._scene;
  }

  public get sceneJson(): JsoncContainer<SceneDefinition> {
    return this._sceneJson;
  }

  public get selectedObject(): GameObjectConfigComposer | undefined {
    return this._selectedObject;
  }
  private set selectedObject(value: GameObjectConfigComposer | undefined) {
    this._selectedObject = value;
  }
}


class GizmoController {
  private readonly gizmoManager: GizmoManager;
  private readonly moveGizmo: PositionGizmo;
  private readonly boundingBoxGizmo: BoundingBoxGizmo;

  public constructor(scene: BabylonScene) {
    const utilityLayer = new UtilityLayerRenderer(scene);
    this.gizmoManager = new GizmoManager(scene, 2, utilityLayer);
    this.gizmoManager.usePointerToAttachGizmos = false;

    this.moveGizmo = new PositionGizmo(utilityLayer, 2, this.gizmoManager);
    this.moveGizmo.planarGizmoEnabled = true;
    this.moveGizmo.scaleRatio = 1;

    // @TODO merge changes into my system, debounce, etc.
    // this.moveGizmo.onDragObservable // etc.

    this.boundingBoxGizmo = new BoundingBoxGizmo(Color3.Yellow(), utilityLayer);
    this.boundingBoxGizmo.setEnabledScaling(false);
    this.boundingBoxGizmo.setEnabledRotationAxis("");

    this.clearTarget();
  }

  public setTarget(gameObject: GameObjectBabylon) {
    const target = gameObject.transform.node;
    this.moveGizmo.attachedNode = target;
    // @NOTE Type laundering (huff my duff, Babylon))
    this.boundingBoxGizmo.attachedMesh = target as AbstractMesh;
  }

  public clearTarget() {
    this.moveGizmo.attachedNode = null;
    this.boundingBoxGizmo.attachedNode = null;
  }
}
import { makeAutoObservable } from 'mobx';
import * as Jsonc from 'jsonc-parser';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene as BabylonScene } from '@babylonjs/core/scene';
import { FreeCamera as FreeCameraBabylon } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 as Vector3Babylon } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight as HemisphericLightBabylon } from '@babylonjs/core/Lights/hemisphericLight';
import { Color3 as Color3Babylon } from '@babylonjs/core/Maths/math.color';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import "@babylonjs/loaders/OBJ/objFileLoader";
import "@babylonjs/loaders/glTF";
import { AssetContainer } from '@babylonjs/core/assetContainer';
import { PointLight as PointLightBabylon } from '@babylonjs/core/Lights/pointLight';
import { DirectionalLight as DirectionalLightBabylon } from '@babylonjs/core/Lights/directionalLight';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import '@babylonjs/core/Culling/ray'; // @NOTE needed for mesh picking - contains side effects

import {
  Transform as TransformRuntime,
  GameObject as GameObjectRuntime,
  DirectionalLightComponent as DirectionalLightComponentRuntime,
  PointLightComponent as PointLightComponentRuntime,
} from '@fantasy-console/runtime/src/world';
import { AssetData } from '@fantasy-console/runtime/src/cartridge';
import { SceneDefinition } from '@fantasy-console/runtime/src/cartridge/archive';
import { IFileSystem } from '@fantasy-console/runtime/src/filesystem';
import { GameObjectComponent } from '@fantasy-console/core/src/world';
import { toColor3Babylon } from '@fantasy-console/runtime/src/util';

import { SceneManifest } from '@lib/project/definition/scene';
import { JsoncContainer } from '@lib/util/JsoncContainer';
import { ProjectController } from '@lib/project/ProjectController';
import { SceneViewMutator } from '@lib/mutation/scene/SceneViewMutator';
import { CameraComponentData, DirectionalLightComponentData, IComposerComponentData, MeshComponentData, PointLightComponentData, ScriptComponentData } from '../data/components';
import { SceneData } from '../data/SceneData';
import { GameObjectData } from '../data/GameObjectData';
import { ComposerSelectionCache } from '../util/ComposerSelectionCache';
import { ISelectableObject, isSelectableObject, MeshComponent } from './components';
import { CurrentSelectionTool, SelectionManager } from './SelectionManager';

export class SceneViewController {
  private readonly _scene: SceneData;
  private readonly _sceneJson: JsoncContainer<SceneDefinition>;
  private readonly projectController: ProjectController;
  private readonly _mutator: SceneViewMutator;

  // @TODO different classes for the "states" of SceneViewController or something? So that not everything is nullable
  private engine?: Engine = undefined;
  private babylonScene?: BabylonScene = undefined;
  private assetCache: Map<AssetData, AssetContainer>;
  private _selectionManager?: SelectionManager = undefined;

  private babylonToWorldSelectionCache: ComposerSelectionCache;

  public constructor(scene: SceneData, sceneJson: JsoncContainer<SceneDefinition>, projectController: ProjectController) {
    this._scene = scene;
    this._sceneJson = sceneJson;
    this.projectController = projectController;
    this.assetCache = new Map();
    this.babylonToWorldSelectionCache = new ComposerSelectionCache();
    this._mutator = new SceneViewMutator(this, projectController);
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

  public startBabylonView(canvas: HTMLCanvasElement) {
    /* Scene */
    const engine = this.engine = new Engine(canvas, true, {}, true);
    const scene = this.babylonScene = new BabylonScene(this.engine);
    const selectionManager = this._selectionManager = new SelectionManager(scene, this.mutator);


    /* Lifecycle */
    const resizeObserver = new ResizeObserver((entries) => {
      const newSize = entries[0].contentRect;
      this.engine!.setSize(newSize.width * devicePixelRatio, newSize.height * devicePixelRatio, true);
    });
    resizeObserver.observe(canvas);

    // Build scene (async)
    void (async () => {
      // @DEBUG Random camera constants
      const camera = new FreeCameraBabylon("main", new Vector3Babylon(6, 2, -1), this.babylonScene);
      camera.setTarget(Vector3Babylon.Zero());
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
            selectionManager.deselectAll();
          } else if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh !== null) {
            // Resolve GameObjectData from reverse lookup cache
            let pickedGameObject = this.babylonToWorldSelectionCache.get(pointerInfo.pickInfo.pickedMesh);

            if (pickedGameObject === undefined) {
              console.error(`Picked mesh but found no corresponding GameObject in cache. Has it been populated or updated? Picked mesh:`, pointerInfo.pickInfo.pickedMesh);
            } else {
              selectionManager.select(pickedGameObject);
            }
          }
        }
      });

      engine.runRenderLoop(() => {
        scene.render();
      });
    })();

    /* Teardown - when scene view is unloaded */
    const onDestroyView = () => {
      console.log(`[SceneViewController] (onDestroyView) Goodbye!`);
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
    this.babylonScene!.clearColor =  toColor3Babylon(this.scene.config.clearColor).toColor4();

    /* Set up global ambient lighting */
    const ambientLight = new HemisphericLightBabylon("__ambient", new Vector3Babylon(0, 0, 0), this.babylonScene);
    ambientLight.intensity = this.scene.config.lighting.ambient.intensity;
    ambientLight.diffuse = toColor3Babylon(this.scene.config.lighting.ambient.color);
    ambientLight.groundColor = toColor3Babylon(this.scene.config.lighting.ambient.color);
    ambientLight.specular = Color3Babylon.Black();

    for (let sceneObject of this.scene.objects) {
      await this.createGameObject(sceneObject);
    }
  }

  public setCurrentTool(tool: CurrentSelectionTool) {
    this.selectionManager!.currentTool = tool;
  }

  public addToSelectionCache(gameObjectData: GameObjectData, component: ISelectableObject) {
    this.babylonToWorldSelectionCache.add(gameObjectData, component.allSelectableMeshes);
  }

  public removeFromSelectionCache(component: ISelectableObject) {
    this.babylonToWorldSelectionCache.remove(component.allSelectableMeshes);
  }

  // @TODO we probably should try to share this with the runtime in some kind of overridable fashion (?)
  public async createGameObject(gameObjectData: GameObjectData, parentTransform: TransformRuntime | undefined = undefined): Promise<GameObjectRuntime> {
    console.log(`[SceneViewController] (createSceneObject) Loading scene object: `, gameObjectData.name);
    // Construct game object transform for constructing scene's hierarchy
    const transform = new TransformRuntime(
      gameObjectData.name,
      this.babylonScene!,
      parentTransform,
      gameObjectData.transform
    );

    // Create all child objects first
    await Promise.all(gameObjectData.children.map((childObjectData) => this.createGameObject(childObjectData, transform)));

    // Create blank object
    const gameObject = new GameObjectRuntime(
      gameObjectData.id,
      gameObjectData.name,
      transform,
    );

    transform.gameObject = gameObject;

    // Store reverse reference to new instance
    gameObjectData.sceneInstance = gameObject;

    // Load game object components
    for (let componentData of gameObjectData.components) {
      const component = await this.createGameObjectComponent(gameObject, componentData);
      // @NOTE This logic is duplicated in `AddGameObjectComponentMutation`
      if (component !== undefined) {
        if (isSelectableObject(component)) {
          this.addToSelectionCache(gameObjectData, component);
        }
        gameObject.addComponent(component);
      }
    }

    return gameObject;
  }

  public async createGameObjectComponent(gameObject: GameObjectRuntime, componentData: IComposerComponentData): Promise<GameObjectComponent | undefined> {
    if (componentData instanceof MeshComponentData) {
      /* Mesh component */
      let meshAsset: AssetContainer;
      if (componentData.meshAsset !== undefined) {
        meshAsset = await this.loadAssetCached(componentData.meshAsset);
      } else {
        meshAsset = new AssetContainer(this.babylonScene!);
      }
      const meshComponent = new MeshComponent(componentData.id, gameObject, meshAsset);
      // Store reverse reference to new instance for managing instance later (e.g. autoload)
      componentData.componentInstance = meshComponent;
      return meshComponent;
    } else if (componentData instanceof ScriptComponentData) {
      /* @NOTE Script has no effect in the Composer */
    } else if (componentData instanceof CameraComponentData) {
      /* @NOTE Camera has no effect in the Composer */
    } else if (componentData instanceof DirectionalLightComponentData) {
      /* Directional Light component */
      const light = new DirectionalLightBabylon(`light_directional`, Vector3Babylon.Down(), this.babylonScene);
      light.specular = Color3Babylon.Black();
      light.intensity = componentData.intensity;
      light.diffuse = toColor3Babylon(componentData.color);
      return new DirectionalLightComponentRuntime(componentData.id, gameObject, light);
    } else if (componentData instanceof PointLightComponentData) {
      /* Point Light component */
      const light = new PointLightBabylon(`light_point`, Vector3Babylon.Zero(), this.babylonScene);
      light.specular = Color3Babylon.Black();
      light.intensity = componentData.intensity;
      light.diffuse = toColor3Babylon(componentData.color);
      return new PointLightComponentRuntime(componentData.id, gameObject, light);
    } else {
      console.error(`[SceneViewController] (loadSceneObject) Unrecognised component data: `, componentData);
    }
  }

  /**
   * Load an {@link AssetData} through a cache.
   * @param asset Asset to load.
   * @returns The new asset, or a reference to the existing asset if it existed in the cache.
   */
  public async loadAssetCached(asset: AssetData): Promise<AssetContainer> {
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

  public static async loadFromManifest(sceneManifest: SceneManifest, projectController: ProjectController): Promise<SceneViewController> {
    const [sceneDefinition, sceneJson] = await SceneViewController.loadSceneDefinition(sceneManifest, projectController.fileSystem);
    return new SceneViewController(new SceneData(sceneDefinition, projectController.assetDb), new JsoncContainer<SceneDefinition>(sceneJson), projectController);
  }

  public get scene(): SceneData {
    return this._scene;
  }

  public get sceneJson(): JsoncContainer<SceneDefinition> {
    return this._sceneJson;
  }

  public get sceneDefinition(): SceneDefinition {
    return this._sceneJson.value;
  }

  public get mutator(): SceneViewMutator {
    return this._mutator;
  }

  public get selectedObject(): GameObjectData | undefined {
    return this.selectionManager?.selectedObject;
  }

  public get selectionManager(): SelectionManager {
    return this._selectionManager!;
  }
}

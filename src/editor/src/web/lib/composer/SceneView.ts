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
import { GameObject } from '@fantasy-console/core/src/world';
import { GameObjectBabylon } from '@fantasy-console/runtime/src/world/GameObjectBabylon';
import { DirectionalLightComponentBabylon, PointLightComponentBabylon } from '@fantasy-console/runtime/src/world/components';
import { AssetConfig, DirectionalLightComponentConfig, GameObjectConfig, PointLightComponentConfig, SceneDefinition, ScriptComponentConfig } from '@fantasy-console/runtime/src/cartridge';
import { debug_modTextures } from '@fantasy-console/runtime';
import { IFileSystem } from '@fantasy-console/runtime/src/filesystem';

import { SceneManifest } from '@lib/project/definition/scene';
import { ISceneMutation } from '@lib/composer/mutation';
import { NewObjectMutation } from '@lib/composer/mutation/scene';
import { JsoncContainer } from '@lib/util/JsoncContainer';
import { ProjectController } from '@lib/project/ProjectController';
import { MeshComponentComposer } from './world/components/MeshComponentComposer';
import { ComposerSelectionCache } from './world/components/ISelectableAsset';
import { MeshComponentConfigComposer } from './config/components';
import { SceneConfigComposer } from './config/SceneConfigComposer';

export class SceneView {
  private readonly _scene: SceneConfigComposer;
  private readonly _sceneJson: JsoncContainer<SceneDefinition>;
  private readonly projectController: ProjectController;

  private engine?: Engine = undefined;
  private babylonScene?: BabylonScene = undefined;
  private assetCache: Map<AssetConfig, AssetContainer>;

  private babylonToWorldSelectionCache: ComposerSelectionCache;
  private selectedObject: GameObject | undefined = undefined;

  public constructor(scene: SceneConfigComposer, sceneJson: JsoncContainer<SceneDefinition>, projectController: ProjectController) {
    this._scene = scene;
    this._sceneJson = sceneJson;
    this.projectController = projectController;
    this.assetCache = new Map();
    this.babylonToWorldSelectionCache = new Map();
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
            console.log(`[Pick] Deselected.`);
            this.selectedObject = undefined;
          } else if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh !== null) {
            // console.log(`[Pick] pickedMesh`, pointerInfo.pickInfo.pickedMesh);
            let pickedGameObject = this.babylonToWorldSelectionCache.get(pointerInfo.pickInfo.pickedMesh);

            if (pickedGameObject === undefined) {
              console.error(`Picked mesh but found no corresponding GameObject in cache. Has it been populated or updated? Picked mesh:`, pointerInfo.pickInfo.pickedMesh);
            } else {
              console.log(`[Pick] gameObject: `, pickedGameObject);
              this.selectedObject = pickedGameObject;
            }
          }
        }
      });

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

  public async createSceneObject(sceneObject: GameObjectConfig, parentTransform: TransformBabylon | undefined = undefined): Promise<GameObject> {
    console.log(`[SceneView] (createSceneObject) Loading scene object: `, sceneObject.name);
    // Construct game object transform for constructing scene's hierarchy
    const gameObjectTransform = new TransformBabylon(
      sceneObject.name,
      this.babylonScene!,
      parentTransform,
      // @TODO probably can just take `sceneObject.transform`, huh?
      sceneObject.transform.position
    );

    // Create all child objects first
    // @TODO children
    await Promise.all(sceneObject.children.map((childSceneObject) => this.createSceneObject(childSceneObject, gameObjectTransform)));

    // Create blank object
    const gameObject: GameObject = new GameObjectBabylon(
      sceneObject.id,
      {
        name: sceneObject.name,
        transform: gameObjectTransform,
      }
    );

    gameObjectTransform.setGameObject(gameObject);

    // Load game object components
    for (let componentConfig of sceneObject.components) {
      if (componentConfig instanceof MeshComponentConfigComposer) {
        /* Mesh component */
        let meshAsset = await this.loadAssetCached(componentConfig.meshAsset);
        const meshComponent = new MeshComponentComposer({ gameObject }, meshAsset);
        meshComponent.addToSelectionCache(this.babylonToWorldSelectionCache);
        componentConfig.componentInstance = meshComponent;
        gameObject.addComponent(meshComponent);
      } else if (componentConfig instanceof ScriptComponentConfig) {
        /* @NOTE Script has no effect in the Composer */
      } else if (componentConfig instanceof DirectionalLightComponentConfig) {
        /* Directional Light component */
        const light = new DirectionalLight(`light_directional`, Vector3.Down(), this.babylonScene);
        light.specular = Color3.Black();
        light.intensity = componentConfig.intensity;
        light.diffuse = componentConfig.color;
        gameObject.addComponent(new DirectionalLightComponentBabylon({ gameObject }, light));
      } else if (componentConfig instanceof PointLightComponentConfig) {
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
}

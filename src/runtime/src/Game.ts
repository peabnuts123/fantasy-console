import type { AssetContainer } from "@babylonjs/core/assetContainer";
import type { Scene as BabylonScene } from "@babylonjs/core/scene";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 as Vector3Babylon } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";

import { GameObjectComponent, GameObjectComponentData } from "@fantasy-console/core/src/world/GameObjectComponent";
import { GameObject } from "@fantasy-console/core/src/world/GameObject";
import { World } from '@fantasy-console/core/src/modules/World';

import { ScriptLoader } from './ScriptLoader';
import { WorldState } from './world/WorldState';
import { TransformBabylon } from "./world/TransformBabylon";
import {
  Cartridge,
  MeshComponentConfig,
  SceneConfig as CartridgeScene,
  GameObjectConfig,
  ScriptComponentConfig,
  CameraComponentConfig,
  PointLightComponentConfig,
  DirectionalLightComponentConfig,
  AssetType,
  AssetConfig,
} from './cartridge/config';
import {
  MeshComponentBabylon,
  CameraComponentBabylon,
  DirectionalLightComponentBabylon,
  PointLightComponentBabylon,
} from './world/components';
import { GameObjectBabylon } from "./world/GameObjectBabylon";
import Modules from './modules';

/**
 * Top-level system containing the entire game and all content
 * including the world, the cartridge, and all systems.
 */
export class Game {
  private cartridge: Cartridge | undefined;
  private babylonScene: BabylonScene;
  private worldState: WorldState;
  private assetCache: Map<AssetConfig, AssetContainer>;
  private scriptLoader: ScriptLoader;
  private ambientLight: HemisphericLight | undefined;

  constructor(babylonScene: BabylonScene) {
    this.babylonScene = babylonScene;
    this.worldState = {};
    this.assetCache = new Map();
    this.scriptLoader = new ScriptLoader();

    Modules.onInit();
  }

  public onUpdate(deltaTime: number): void {
    Modules.onUpdate(deltaTime);
  }

  public dispose(): void {
    Modules.dispose();
  }

  /**
   * Plug a cartridge into the console and press the power button.
   * @param cartridge The cartridge to load
   */
  public async loadCartridge(cartridge: Cartridge): Promise<void> {
    // @TODO unload previous cartridge
    this.cartridge = cartridge;

    // Load all scripts from the cartridge
    // We do this proactively because scripts can depend on other scripts
    // which need to be injected when they are requested
    await Promise.all(cartridge.assetDb.assets
      .filter((asset) => asset.type === AssetType.Script)
      .map((asset) =>
        cartridge.assetDb.loadAsset(asset)
          .then((file) => {
            this.scriptLoader.loadModule(asset, file);
          })
      ))


    // Load the first scene on the cartridge
    // @TODO add concept of "initial" scene to cartridge manifest
    await this.loadCartridgeScene(cartridge.sceneDb.allScenes[0]);
  }

  /**
   * Load a cartridge scene, unloading the current one.
   * @param scene The scene to load
   */
  public async loadCartridgeScene(scene: CartridgeScene): Promise<void> {
    // @TODO unload previous scene
    this.ambientLight?.dispose();

    // @TODO I guess we need a runtime object for a Scene (rather than storing it on Game)
    /* Scene clear color */
    this.babylonScene.clearColor = scene.config.clearColor;

    /* Set up global ambient lighting */
    this.ambientLight = new HemisphericLight("__ambient", new Vector3Babylon(0, 0, 0), this.babylonScene);
    this.ambientLight.intensity = scene.config.lighting.ambient.intensity;
    this.ambientLight.diffuse = scene.config.lighting.ambient.color;
    this.ambientLight.groundColor = scene.config.lighting.ambient.color;
    this.ambientLight.specular = Color3.Black();

    /* Load game objects */
    for (let sceneObject of scene.objects) {
      const gameObject = await this.createGameObjectFromConfig(sceneObject);
      World.addObject(gameObject);
    }

    // Call init() on all game objects
    // @NOTE Special case. init() is only called after ALL
    // GameObjects have been loaded, as opposed to immediately after adding
    // each object to the scene
    for (let gameObject of World.gameObjects) {
      gameObject.init();
    }
  }

  /**
   * Create a new instance of a GameObject from a {@link GameObjectConfig} i.e. a cartridge-defined object.
   * @param gameObjectConfig The config to instantiate.
   */
  private async createGameObjectFromConfig(gameObjectConfig: GameObjectConfig, parentTransform: TransformBabylon | undefined = undefined): Promise<GameObject> {
    // Construct game object transform for constructing scene's hierarchy
    const gameObjectTransform = new TransformBabylon(
      gameObjectConfig.name,
      this.babylonScene,
      parentTransform,
      gameObjectConfig.transform.position
    );

    // Create all child objects first
    await Promise.all(gameObjectConfig.children.map((childObjectConfig) => this.createGameObjectFromConfig(childObjectConfig, gameObjectTransform)));

    // Create blank object
    const gameObject: GameObject = new GameObjectBabylon(
      World.getNextGameObjectId(),
      {
        name: gameObjectConfig.name,
        transform: gameObjectTransform,
      }
    );

    gameObjectTransform.setGameObject(gameObject);

    // Load game object components
    // @TODO this light thingy is nonsense, remove it
    let debug_lightCount = 0;
    for (let componentConfig of gameObjectConfig.components) {
      // Load well-known inbuilt component types
      if (componentConfig instanceof MeshComponentConfig) {
        /* Mesh component */
        const meshAsset = await this.loadAssetCached(componentConfig.meshAsset);
        gameObject.addComponent(new MeshComponentBabylon({ gameObject }, meshAsset));
      } else if (componentConfig instanceof ScriptComponentConfig) {
        /* Custom component script */
        let scriptModule = this.scriptLoader.getModule(componentConfig.scriptAsset);
        if (!scriptModule.hasOwnProperty('default')) {
          throw new Error(`Module is missing default export: ${componentConfig.scriptAsset.path}`);
        }
        let ScriptComponent = scriptModule.default;
        if (!GameObjectComponent.isPrototypeOf(ScriptComponent)) {
          throw new Error(`Cannot add component to GameObject. Default export from script '${componentConfig.scriptAsset.path}' is not of type 'GameObjectComponent': ${ScriptComponent}`);
        }
        gameObject.addComponent(new ScriptComponent({ gameObject } satisfies GameObjectComponentData));
      } else if (componentConfig instanceof CameraComponentConfig) {
        /* Camera component */
        const camera = new FreeCamera("Main Camera", Vector3Babylon.Zero(), this.babylonScene, true);
        camera.inputs.clear();
        gameObject.addComponent(new CameraComponentBabylon({ gameObject }, camera));
      } else if (componentConfig instanceof DirectionalLightComponentConfig) {
        /* Directional Light component */
        const light = new DirectionalLight(`light_directional_${debug_lightCount++}`, Vector3Babylon.Down(), this.babylonScene);
        light.specular = Color3.Black();
        light.intensity = componentConfig.intensity;
        light.diffuse = componentConfig.color;
        gameObject.addComponent(new DirectionalLightComponentBabylon({ gameObject }, light));
      } else if (componentConfig instanceof PointLightComponentConfig) {
        /* Point Light component */
        const light = new PointLight(`light_point_${debug_lightCount++}`, Vector3Babylon.Zero(), this.babylonScene);
        light.specular = Color3.Black();
        light.intensity = componentConfig.intensity;
        light.diffuse = componentConfig.color;
        gameObject.addComponent(new PointLightComponentBabylon({ gameObject }, light));
      } else {
        console.error(`[Game] (createGameObjectFromConfig) Unrecognised component config: `, componentConfig);
      }
    };

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
      let assetContainer = await SceneLoader.LoadAssetContainerAsync(asset.babylonFetchUrl, undefined, this.babylonScene, undefined, asset.fileExtension);
      this.assetCache.set(asset, assetContainer);
      return assetContainer;
    }
  }
}

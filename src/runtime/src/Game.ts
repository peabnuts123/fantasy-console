import type { AssetContainer } from "@babylonjs/core/assetContainer";
import type { Scene as BabylonScene } from "@babylonjs/core/scene";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 as Vector3Babylon } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";

import { GameObjectComponent, GameObjectComponentData } from "@fantasy-console/core/world/GameObjectComponent";
import { GameObject } from "@fantasy-console/core/world/GameObject";

import { ScriptLoader } from './ScriptLoader';
import { World } from './world/World';
import { WorldState } from './world/WorldState';
import { TransformBabylon } from "./world/Transform";
import {
  Cartridge,
  MeshComponentConfig,
  SceneConfig as CartridgeScene,
  VirtualFile,
  GameObjectConfig,
  ScriptComponentConfig,
  VirtualFileType,
  CameraComponentConfig,
  PointLightComponentConfig,
  DirectionalLightComponentConfig,
} from './cartridge/config';
import {
  MeshComponentBabylon,
  CameraComponentBabylon,
  DirectionalLightComponentBabylon,
  PointLightComponentBabylon,
} from './world/components';



/**
 * Top-level system containing the entire game and all content
 * including the world, the cartridge, and all systems.
 */
export class Game {
  private cartridge: Cartridge | undefined;
  private babylonScene: BabylonScene;
  private world: World;
  private worldState: WorldState;
  private assetCache: Map<VirtualFile, AssetContainer>;
  private scriptLoader: ScriptLoader;
  private ambientLight: HemisphericLight | undefined;

  constructor(babylonScene: BabylonScene) {
    this.babylonScene = babylonScene;
    this.world = new World(babylonScene);
    this.worldState = {};
    this.assetCache = new Map();
    this.scriptLoader = new ScriptLoader();
  }

  /**
   * Called once per frame.
   * @param deltaTime Time (in seconds) since the last frame.
   */
  public update(deltaTime: number): void {
    this.world.update(deltaTime);
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
    for (let file of cartridge.files) {
      if (file.type === VirtualFileType.Script) {
        this.scriptLoader.loadModule(file);
      }
    }

    // Load the first scene on the cartridge
    // @TODO add concept of "initial" scene to cartridge manifest
    await this.loadCartridgeScene(cartridge.scenes[0]);
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
    this.babylonScene.clearColor = scene.clearColor;

    /* Set up global ambient lighting */
    this.ambientLight = new HemisphericLight("__ambient", new Vector3Babylon(0, 0, 0), this.babylonScene);
    this.ambientLight.intensity = scene.ambientLight.intensity;
    this.ambientLight.diffuse = scene.ambientLight.color;
    this.ambientLight.groundColor = scene.ambientLight.color;
    this.ambientLight.specular = Color3.Black();

    /* Load game objects */
    for (let sceneObject of scene.objects) {
      await this.createGameObjectFromConfig(sceneObject);
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
      gameObjectConfig.position
    );

    // Create all child objects first
    let childrenObjects = await Promise.all(gameObjectConfig.children.map((childObjectConfig) => this.createGameObjectFromConfig(childObjectConfig, gameObjectTransform)));

    // Create blank object
    const gameObject = this.world.createGameObject({
      name: gameObjectConfig.name,
      transform: gameObjectTransform,
      children: childrenObjects,
    });

    // Load game object components
    // @TODO this light thingy is nonsense, remove it
    let debug_lightCount = 0;
    for (let componentConfig of gameObjectConfig.components) {
      // Load well-known inbuilt component types
      if (componentConfig instanceof MeshComponentConfig) {
        /* Mesh component */
        const meshAsset = await this.loadAssetCached(componentConfig.meshFile);
        gameObject.addComponent(new MeshComponentBabylon({ gameObject }, meshAsset));
      } else if (componentConfig instanceof ScriptComponentConfig) {
        /* Custom component script */
        let scriptModule = this.scriptLoader.getModule(componentConfig.scriptFile);
        if (!scriptModule.hasOwnProperty('default')) {
          throw new Error(`Module is missing default export: ${componentConfig.scriptFile.path}`);
        }
        let ScriptComponent = scriptModule.default;
        if (!GameObjectComponent.isPrototypeOf(ScriptComponent)) {
          throw new Error(`Cannot add component to GameObject. Default export from script '${componentConfig.scriptFile.path}' is not of type 'GameObjectComponent': ${ScriptComponent}`);
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
   * Load an asset from a {@link VirtualFile} through a cache.
   * @param file Asset file to load.
   * @returns The new asset, or a reference to the existing asset if it existed in the cache.
   */
  private async loadAssetCached(file: VirtualFile): Promise<AssetContainer> {
    let cached = this.assetCache.get(file);
    if (cached) {
      return cached;
    } else {
      let asset = await SceneLoader.LoadAssetContainerAsync(file.path, undefined, this.babylonScene, undefined, file.extension);
      this.assetCache.set(file, asset);
      return asset;
    }
  }
}

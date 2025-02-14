import { AssetContainer } from "@babylonjs/core/assetContainer";
import type { Scene as BabylonScene } from "@babylonjs/core/scene";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 as Vector3Babylon } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";

import { ScriptComponent } from "@polyzone/core/src/world";
import { World } from '@polyzone/core/src/modules/World';

import { ScriptLoader } from './ScriptLoader';
import {
  Cartridge,
  MeshComponentData,
  SceneData as CartridgeScene,
  GameObjectData,
  ScriptComponentData,
  CameraComponentData,
  PointLightComponentData,
  DirectionalLightComponentData,
  AssetType,
  AssetData,
} from './cartridge';
import {
  MeshComponent,
  CameraComponent,
  DirectionalLightComponent,
  PointLightComponent,
  GameObject,
  Transform,
  WorldState,
} from './world';
import Modules from './modules';
import { toColor3Babylon } from "./util";

/**
 * Top-level system containing the entire game and all content
 * including the world, the cartridge, and all systems.
 */
export class Game {
  private cartridge: Cartridge | undefined;
  private babylonScene: BabylonScene;
  private worldState: WorldState;
  private assetCache: Map<AssetData, AssetContainer>;
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
    this.babylonScene.clearColor = toColor3Babylon(scene.config.clearColor).toColor4();

    /* Set up global ambient lighting */
    this.ambientLight = new HemisphericLight("__ambient", new Vector3Babylon(0, 0, 0), this.babylonScene);
    this.ambientLight.intensity = scene.config.lighting.ambient.intensity;
    this.ambientLight.diffuse = toColor3Babylon(scene.config.lighting.ambient.color);
    this.ambientLight.groundColor = toColor3Babylon(scene.config.lighting.ambient.color);
    this.ambientLight.specular = Color3.Black();

    /* Load game objects */
    for (let sceneObject of scene.objects) {
      const gameObject = await this.createGameObjectFromData(sceneObject);
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
   * Create a new instance of a GameObject from a {@link GameObjectData} i.e. a cartridge-defined object.
   * @param gameObjectData The data to instantiate.
   */
  private async createGameObjectFromData(gameObjectData: GameObjectData, parentTransform: Transform | undefined = undefined): Promise<GameObject> {
    // Construct game object transform for constructing scene's hierarchy
    const gameObjectTransform = new Transform(
      gameObjectData.name,
      this.babylonScene,
      parentTransform,
      gameObjectData.transform
    );

    // Create all child objects first
    await Promise.all(gameObjectData.children.map((childObjectData) => this.createGameObjectFromData(childObjectData, gameObjectTransform)));

    // Create blank object
    const gameObject = new GameObject(
      gameObjectData.id,
      gameObjectData.name,
      gameObjectTransform,
    );
    gameObjectTransform.gameObject = gameObject;

    // Load game object components
    // @TODO this light thingy is nonsense, remove it
    let debug_lightCount = 0;
    for (let componentData of gameObjectData.components) {
      // Load well-known inbuilt component types
      if (componentData instanceof MeshComponentData) {
        /* Mesh component */
        let meshAsset: AssetContainer;
        if (componentData.meshAsset !== undefined) {
          meshAsset = await this.loadAssetCached(componentData.meshAsset);
        } else {
          meshAsset = new AssetContainer(this.babylonScene!);
        }
        gameObject.addComponent(new MeshComponent(componentData.id, gameObject, meshAsset));
      } else if (componentData instanceof ScriptComponentData) {
        /* Custom component script */
        // Instantiate instance of script component (i.e. user-defined class)
        // Obviously only do this if the script component has a script asset assigned to it
        // otherwise, do nothing.
        if (componentData.scriptAsset) {
          let scriptModule = this.scriptLoader.getModule(componentData.scriptAsset);
          if (
            scriptModule === undefined ||
            scriptModule === null ||
            !(scriptModule instanceof Object) ||
            !('default' in scriptModule)
          ) {
            throw new Error(`Module is missing default export: ${componentData.scriptAsset.path}`);
          }

          // Ensure script is of correct type
          let CustomScriptComponent = scriptModule.default as typeof ScriptComponent;
          if (
            !(
              (CustomScriptComponent instanceof Object) &&
              ScriptComponent.isPrototypeOf(CustomScriptComponent)
            )
          ) {
            throw new Error(`Cannot add component to GameObject. Default export from script '${componentData.scriptAsset.path}' is not of type 'ScriptComponent': ${CustomScriptComponent}`);
          }

          // Construct new instance of script component
          gameObject.addComponent(new CustomScriptComponent(componentData.id, gameObject));
        }
      } else if (componentData instanceof CameraComponentData) {
        /* Camera component */
        const camera = new FreeCamera("Main Camera", Vector3Babylon.Zero(), this.babylonScene, true);
        camera.inputs.clear();
        gameObject.addComponent(new CameraComponent(componentData.id, gameObject, camera));
      } else if (componentData instanceof DirectionalLightComponentData) {
        /* Directional Light component */
        const light = new DirectionalLight(`light_directional_${debug_lightCount++}`, Vector3Babylon.Down(), this.babylonScene);
        light.specular = Color3.Black();
        light.intensity = componentData.intensity;
        light.diffuse = toColor3Babylon(componentData.color);
        gameObject.addComponent(new DirectionalLightComponent(componentData.id, gameObject, light));
      } else if (componentData instanceof PointLightComponentData) {
        /* Point Light component */
        const light = new PointLight(`light_point_${debug_lightCount++}`, Vector3Babylon.Zero(), this.babylonScene);
        light.specular = Color3.Black();
        light.intensity = componentData.intensity;
        light.diffuse = toColor3Babylon(componentData.color);
        gameObject.addComponent(new PointLightComponent(componentData.id, gameObject, light));
      } else {
        console.error(`[Game] (createGameObjectFromData) Unrecognised component data: `, componentData);
      }
    };

    return gameObject;
  }

  /**
   * Load an {@link AssetData} through a cache.
   * @param asset Asset to load.
   * @returns The new asset, or a reference to the existing asset if it existed in the cache.
   */
  private async loadAssetCached(asset: AssetData): Promise<AssetContainer> {
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

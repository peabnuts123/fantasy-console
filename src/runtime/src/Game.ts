import type { AssetContainer } from "@babylonjs/core/assetContainer";
import type { Scene as BabylonScene } from "@babylonjs/core/scene";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

import { World } from './world/World';
import { WorldState } from './world/WorldState';
import { Cartridge, MeshComponentConfig, SceneConfig as CartridgeScene, VirtualFile, GameObjectConfig, ScriptComponentConfig, VirtualFileType } from './cartridge';
import { GameObject } from './world/GameObject';
import { MeshComponent } from './world/components/MeshComponent';
import { ScriptLoader } from './ScriptLoader';
import { GameObjectComponent, GameObjectComponentData } from './core';



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
    this.loadCartridgeScene(cartridge.scenes[0]);
  }

  /**
   * Load a cartridge scene, unloading the current one.
   * @param scene The scene to load
   */
  public async loadCartridgeScene(scene: CartridgeScene): Promise<void> {
    // @TODO unload previous scene
    for (let sceneObject of scene.objects) {
      await this.createGameObjectFromConfig(sceneObject);
    }
  }

  /**
   * Create a new instance of a GameObject from a {@link GameObjectConfig} i.e. a cartridge-defined object.
   * @param gameObjectConfig The config to instantiate.
   */
  private async createGameObjectFromConfig(gameObjectConfig: GameObjectConfig): Promise<GameObject> {
    const gameObject = this.world.createGameObject({
      position: gameObjectConfig.position,
    });
    for (let componentConfig of gameObjectConfig.components) {
      // Load well-known inbuilt component types
      // @TODO other builtin components or whatever
      if (componentConfig instanceof MeshComponentConfig) {
        /* Mesh Component */
        const meshAsset = await this.loadAssetCached(componentConfig.meshFile);
        gameObject.addComponent(new MeshComponent({ gameObject }, meshAsset));
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

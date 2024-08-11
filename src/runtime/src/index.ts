import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/loaders/OBJ/objFileLoader";

import { Input } from '@fantasy-console/core/src/modules/Input';

import { readCartridgeArchive, loadCartridge, fetchCartridge, Cartridge, CartridgeArchive } from './cartridge';
import Resolver from './Resolver';
import { Game } from "./Game";
import { BabylonInputManager } from './modules/BabylonInputManager';
import Modules from './modules';
import { RuntimeAssetResolverProtocol } from "./constants";

export type OnUpdateCallback = () => void;

/**
 * Runtime for Fantasy Console.
 * Use this to run game cartridges.
 */
export class Runtime {
  private canvas: HTMLCanvasElement;
  private onUpdateCallbacks: OnUpdateCallback[];
  private cartridge?: Cartridge;

  public constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.onUpdateCallbacks = [];
  }

  public onUpdate(callback: OnUpdateCallback): void {
    this.onUpdateCallbacks.push(callback);
  }

  /**
   * Load a cartridge into the runtime. Boot the cartridge with {@link run()}.
   * @param cartridgeBytes Raw bytes of the cartridge file
   */
  public async loadCartridge(cartridgeBytes: ArrayBuffer): Promise<void>;
  /**
   * Load a cartridge into the runtime. Boot the cartridge with {@link run()}.
   * @param url URL of the cartridge to fetch
   */
  public async loadCartridge(url: string): Promise<void>;
  public async loadCartridge(source: ArrayBuffer | string): Promise<void> {
    let timerStart = performance.now();

    let cartridgeArchive: CartridgeArchive;
    if (source instanceof ArrayBuffer) {
      // Load cartridge from ArrayBuffer
      cartridgeArchive = await readCartridgeArchive(source);
    } else {
      // Load cartridge from URL
      cartridgeArchive = await fetchCartridge(source);
    }

    // Bind resolver to cartridge asset DB
    Resolver.registerFileSystem(RuntimeAssetResolverProtocol, cartridgeArchive.fileSystem);
    this.cartridge = await loadCartridge(cartridgeArchive);
    console.log(`Loaded cartridge in ${(performance.now() - timerStart).toFixed(1)}ms`);
  }

  public async run() {
    if (this.cartridge === undefined) {
      throw new Error('No cartridge loaded');
    }

    let initialCanvasWidth = this.canvas.width;
    let initialCanvasHeight = this.canvas.height;

    const engine = new Engine(this.canvas, false);
    // Override application resolution to fixed resolution
    engine.setSize(initialCanvasWidth, initialCanvasHeight);

    // Initialize singleton modules
    Input.init(new BabylonInputManager(engine));

    // Babylon scene (NOT game scene)
    var scene = new Scene(engine);

    // Game system singleton
    const game = new Game(scene);

    // Boot game
    // *blows on cartridge*
    let timerStart = performance.now();
    await game.loadCartridge(this.cartridge);
    console.log(`Loaded game in ${(performance.now() - timerStart).toFixed(1)}ms`);

    // Wait for scene
    await scene.whenReadyAsync();

    // @DEBUG hack the textures to look a bit cooler
    debug_modTextures(scene);

    engine.runRenderLoop(() => {
      scene.render();
      const deltaTime = engine.getDeltaTime() / 1000;
      Modules.onUpdate(deltaTime);
      // Invoke all `onUpdate` callbacks
      this.onUpdateCallbacks.forEach((callback) => callback());
    });
  }
}

export function debug_modTextures(scene: Scene): void {
  // Graphics overrides
  // @TODO remove specular, add gouraud shading, flat shading, etc.
  // @TODO I guess write a big shader that I can use to do all the things I want
  scene.textures.forEach((texture) => {
    texture.updateSamplingMode(Texture.NEAREST_SAMPLINGMODE)
    texture.anisotropicFilteringLevel = 0;
  });
}
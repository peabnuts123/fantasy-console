import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import "@babylonjs/loaders/OBJ/objFileLoader";

import { Input } from '@fantasy-console/core/src/modules/Input';

import { readCartridgeArchive, loadCartridge, fetchCartridge, Cartridge, CartridgeArchive } from './cartridge';
import Resolver from './Resolver';
import { Game } from "./Game";
import { BabylonInputManager } from './modules/BabylonInputManager';

export type OnUpdateCallback = () => void;
export type OnDisposeCallback = () => void;

/**
 * Runtime for Fantasy Console.
 * Use this to run game cartridges.
 */
export class Runtime {
  private canvas: HTMLCanvasElement;
  private onUpdateCallbacks: OnUpdateCallback[];
  private onDisposeCallbacks: OnDisposeCallback[];
  private cartridge?: Cartridge;

  private engine?: Engine;
  private scene?: Scene;
  private game?: Game;

  public constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.onUpdateCallbacks = [];
    this.onDisposeCallbacks = [];
  }

  public onUpdate(callback: OnUpdateCallback): void {
    this.onUpdateCallbacks.push(callback);
  }

  public onDispose(callback: OnDisposeCallback): void {
    this.onDisposeCallbacks.push(callback);
  }

  /**
   * Load a cartridge into the runtime. Boot the cartridge with {@link run()}.
   * @param cartridgeBytes Raw bytes of the cartridge file
   */
  public async loadCartridge(cartridgeBytes: Uint8Array): Promise<void>;
  /**
   * Load a cartridge into the runtime. Boot the cartridge with {@link run()}.
   * @param url URL of the cartridge to fetch
   */
  public async loadCartridge(url: string): Promise<void>;
  public async loadCartridge(source: Uint8Array | string): Promise<void>;
  public async loadCartridge(source: Uint8Array | string): Promise<void> {
    let timerStart = performance.now();

    let cartridgeArchive: CartridgeArchive;
    if (source instanceof Uint8Array) {
      // Load cartridge from Uint8Array
      cartridgeArchive = await readCartridgeArchive(source);
    } else {
      // Load cartridge from URL
      cartridgeArchive = await fetchCartridge(source);
    }

    // Bind resolver to cartridge asset DB
    Resolver.registerFileSystem(cartridgeArchive.fileSystem);
    this.cartridge = await loadCartridge(cartridgeArchive);
    console.log(`Loaded cartridge in ${(performance.now() - timerStart).toFixed(1)}ms`);
  }

  public async run() {
    if (this.cartridge === undefined) {
      throw new Error('No cartridge loaded');
    }

    let initialCanvasWidth = this.canvas.width;
    let initialCanvasHeight = this.canvas.height;

    this.engine = new Engine(this.canvas, false);
    // Override application resolution to fixed resolution
    this.engine.setSize(initialCanvasWidth, initialCanvasHeight);

    // Initialize singleton modules
    Input.init(new BabylonInputManager(this.engine));

    // Babylon scene (NOT game scene)
    this.scene = new Scene(this.engine);

    // Game system singleton
    this.game = new Game(this.scene);

    // Boot game
    // *blows on cartridge*
    let timerStart = performance.now();
    await this.game.loadCartridge(this.cartridge);
    console.log(`Loaded game in ${(performance.now() - timerStart).toFixed(1)}ms`);

    // Wait for scene
    await this.scene.whenReadyAsync();

    this.engine.runRenderLoop(() => {
      const deltaTime = this.engine!.getDeltaTime() / 1000;
      this.scene!.render();
      this.game!.onUpdate(deltaTime);
      // Invoke all `onUpdate` callbacks
      this.onUpdateCallbacks.forEach((callback) => callback());
    });
  }

  public dispose() {
    console.log(`[Runtime] (dispose) Destroying runtime`);
    this.cartridge = undefined;

    this.game!.dispose();
    this.game = undefined;

    this.scene!.dispose();
    this.scene = undefined;

    this.engine!.dispose();
    this.engine = undefined;

    this.onDisposeCallbacks.forEach((callback) => callback());
  }
}

export function debug_modTexture(texture: BaseTexture) {
  // @TODO remove specular, add gouraud shading, flat shading, etc.
  // @TODO I guess write a big shader that I can use to do all the things I want
  if (texture.isReady()) {
    texture.updateSamplingMode(Texture.NEAREST_SAMPLINGMODE)
    texture.anisotropicFilteringLevel = 0;
  } else {
    if (texture instanceof Texture) {
      texture.onLoadObservable.addOnce(() => {
        debug_modTexture(texture);
      })
    } else {
      throw new Error(`Tried to wait for texture to load but texture is not of type 'Texture' - This is not implemented`);
    }
  }
}

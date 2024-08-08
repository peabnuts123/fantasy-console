import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/loaders/OBJ/objFileLoader";

import { Input } from '@fantasy-console/core/src/modules/Input';

import { loadCartridge, fetchCartridge } from './cartridge';
import Resolver from './Resolver';
import { Game } from "./Game";
import { BabylonInputManager } from './modules/BabylonInputManager';
import Modules from './modules';
import { RuntimeAssetResolverProtocol } from "./constants";

export type OnUpdateCallback = () => void;

const SAMPLE_CARTRIDGE_URL = "/sample-cartridge.pzcart";

/**
 * Runtime for Fantasy Console.
 * Use this to run game cartridges.
 */
export class Runtime {
  private canvas: HTMLCanvasElement;
  private onUpdateCallbacks: OnUpdateCallback[];

  public constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.onUpdateCallbacks = [];
  }

  public onUpdate(callback: OnUpdateCallback): void {
    this.onUpdateCallbacks.push(callback);
  }

  public async run() {
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

    // Load cartridge
    // @NOTE Load hard-coded cartridge from URL
    let timerStart = performance.now();
    const cartridgeArchive = await fetchCartridge(SAMPLE_CARTRIDGE_URL);
    let cartridge = await loadCartridge(cartridgeArchive);
    console.log(`Loaded cartridge in ${(performance.now() - timerStart).toFixed(1)}ms`);

    // Bind resolver to cartridge asset DB
    Resolver.registerAssetDb(RuntimeAssetResolverProtocol, cartridge.assetDb);

    // Boot game
    // *blows on cartridge*
    timerStart = performance.now();
    await game.loadCartridge(cartridge);
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
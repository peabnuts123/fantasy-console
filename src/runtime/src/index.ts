import { Color4, Texture, Color3 } from "@babylonjs/core";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/loaders/OBJ/objFileLoader";

import { loadCartridge, fetchCartridge } from './cartridge';
import Resolver from './Resolver';
import { Game } from "./Game";

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

    // Babylon scene (NOT game scene)
    var scene = new Scene(engine);

    // Game system singleton
    const game = new Game(scene);

    // Load cartridge
    // @NOTE Load hard-coded cartridge from URL
    let timerStart = performance.now();
    const cartridgeRaw = await fetchCartridge(SAMPLE_CARTRIDGE_URL);
    let cartridge = await loadCartridge(cartridgeRaw);
    Resolver.bindTo(cartridge.files);
    console.log(`Loaded cartridge in ${(performance.now() - timerStart).toFixed(1)}ms`);

    // Boot game
    // *blows on cartridge*
    timerStart = performance.now();
    game.loadCartridge(cartridge);
    console.log(`Loaded game in ${(performance.now() - timerStart).toFixed(1)}ms`);


    /* === @TODO Remove Hard-coded babylon / debug stuff === */
    {
      scene.clearColor = new Color4(0xF7 / 0xFF, 0xCE / 0xFF, 0x9B / 0xFF);

      // This creates and positions a free camera (non-mesh)
      var camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);

      // @DEBUG Pointer lock
      this.canvas.addEventListener("click", async () => {
        if (!document.pointerLockElement) {
          await this.canvas.requestPointerLock();
        }
      });

      camera.speed = 0.7;
      camera.keysUp = [87];
      camera.keysDown = [83];
      camera.keysLeft = [65];
      camera.keysRight = [68];
      camera.keysRotateLeft = [];
      camera.keysRotateRight = [];
      camera.keysUpward = [32];
      camera.keysDownward = [16];

      camera.setTarget(Vector3.Zero());
      camera.attachControl(this.canvas, true);

      const light = new HemisphericLight("light1", new Vector3(0.2, 1, 0), scene);
      // const light = new PointLight("light1", new Vector3(0.2, 1, 0), scene);
      light.diffuse = new Color3(1, 0.9, 0.8);
    }
    /* === @TODO Remove Hard-coded babylon stuff === */


    // Wait for scene
    await scene.whenReadyAsync();

    // Graphics overrides
    // @TODO remove specular, add gouraud shading, flat shading, etc.
    // @TODO I guess write a big shader that I can use to do all the things I want
    scene.textures.forEach((texture) => {
      texture.updateSamplingMode(Texture.NEAREST_SAMPLINGMODE)
      texture.anisotropicFilteringLevel = 0;
    });

    engine.runRenderLoop(() => {
      scene.render();
      game.update(engine.getDeltaTime() / 1000);
      // Invoke all `onUpdate` callbacks
      this.onUpdateCallbacks.forEach((callback) => callback());
    });
  }
}


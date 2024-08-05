import { makeAutoObservable, runInAction } from 'mobx';

import { SceneDefinition, SceneManifest } from "./project/scene";
import { SceneDb } from './SceneDb';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene as BabylonScene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';

export class SceneView {
  private _manifest: SceneManifest;
  private _scene?: SceneDefinition = undefined; // @NOTE explicit `undefined` for mobx
  private _isLoading: boolean;

  private engine?: Engine = undefined;
  private babylonScene?: BabylonScene = undefined;

  public constructor(manifest: SceneManifest, sceneDb: SceneDb) {
    this._manifest = manifest;
    this._isLoading = true;
    void this.load(manifest, sceneDb);

    // @NOTE Class properties MUST have a value explicitly assigned
    // by this point otherwise mobx won't pick them up.
    makeAutoObservable(this);
  }

  private async load(sceneManifest: SceneManifest, sceneDb: SceneDb): Promise<void> {
    // await new Promise((resolve) => setTimeout(resolve, 2000));
    const scene = await sceneDb.loadSceneFromManifest(sceneManifest);
    runInAction(() => {
      this._scene = scene;
      this._isLoading = false;
    });
  }

  public startBabylonView(canvas: HTMLCanvasElement) {
    // @DEBUG Dummy scene
    /* Scene */
    this.engine = new Engine(canvas, true, {}, true);
    this.babylonScene = new BabylonScene(this.engine);

    const camera = new FreeCamera("main", new Vector3(0, 5, -10), this.babylonScene);
    camera.setTarget(Vector3.Zero());
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new HemisphericLight("sky", new Vector3(0, 1, 0), this.babylonScene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Our built-in 'box' shape.
    const box = MeshBuilder.CreateBox("box", { size: 2 }, this.babylonScene);
    box.position.y = 1;

    // Our built-in 'ground' shape.
    MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, this.babylonScene);


    /* Lifecycle */
    const onResize = () => this.engine?.resize();

    if (window) {
      window.addEventListener("resize", onResize);
    }

    this.babylonScene.whenReadyAsync().then(() => {
      this.engine!.runRenderLoop(() => {
        const deltaTimeInMillis = this.babylonScene!.getEngine().getDeltaTime();
        const rpm = 10;
        box.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
        this.babylonScene?.render();
      });
    });


    /* Teardown - when scene view is unloaded */
    const onDestroyView = () => {
      console.log(`[SceneView] (onDestroyView) Goodbye!`);
      this.engine?.dispose();
      if (window) {
        window.removeEventListener("resize", onResize);
      }
    }
    return onDestroyView;
  }

  public get isLoading() {
    return this._isLoading;
  }

  public get hasLoaded() {
    return this._scene !== undefined;
  }

  public get scene(): SceneDefinition {
    if (this._scene === undefined) {
      throw new Error(`Scene not yet loaded`);
    }
    return this._scene;
  }

  public get manifest(): SceneManifest {
    return this._manifest;
  }
}

import { makeAutoObservable } from 'mobx';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene as BabylonScene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import "@babylonjs/loaders/OBJ/objFileLoader";

import { TransformBabylon } from '@fantasy-console/runtime/src/world/TransformBabylon';
import { GameObject } from '@fantasy-console/core/src/world';
import { GameObjectBabylon } from '@fantasy-console/runtime/src/world/GameObjectBabylon';
import { DirectionalLightComponentBabylon, MeshComponentBabylon, PointLightComponentBabylon } from '@fantasy-console/runtime/src/world/components';
import { DirectionalLightComponentConfig, GameObjectConfig, MeshComponentConfig, PointLightComponentConfig, SceneConfig, ScriptComponentConfig } from '@fantasy-console/runtime/src/cartridge';
import { debug_modTextures } from '@fantasy-console/runtime';
import { PointLight } from '@babylonjs/core/Lights/pointLight';


export class SceneView {
  private _scene: SceneConfig;

  private engine?: Engine = undefined;
  private babylonScene?: BabylonScene = undefined;
  /** Counter for unique {@link GameObject} IDs */
  private nextGameObjectId = 1000;

  public constructor(scene: SceneConfig) {
    this._scene = scene;

    // @NOTE Class properties MUST have a value explicitly assigned
    // by this point otherwise mobx won't pick them up.
    makeAutoObservable(this);
  }

  public startBabylonView(canvas: HTMLCanvasElement) {
    /* Scene */
    this.engine = new Engine(canvas, true, {}, true);
    this.babylonScene = new BabylonScene(this.engine);

    /* Lifecycle */
    const onResize = () => this.engine?.resize();
    if (window) {
      window.addEventListener("resize", onResize);
    }

    // Build scene (async)
    void (async () => {
      // @DEBUG Random camera constants
      const camera = new FreeCamera("main", new Vector3(0, 5, -10), this.babylonScene);
      camera.setTarget(Vector3.Zero());
      camera.attachControl(canvas, true);
      camera.speed = 0.5;
      camera.minZ = 0.1;

      await this.loadScene()

      await this.babylonScene!.whenReadyAsync()

      debug_modTextures(this.babylonScene!);

      this.engine!.runRenderLoop(() => {
        this.babylonScene?.render();
      });
    })()

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

  private async loadScene() {
    /* Scene clear color */
    this.babylonScene!.clearColor = this.scene.config.clearColor;

    /* Set up global ambient lighting */
    const ambientLight = new HemisphericLight("__ambient", new Vector3(0, 0, 0), this.babylonScene);
    ambientLight.intensity = this.scene.config.lighting.ambient.intensity;
    ambientLight.diffuse = this.scene.config.lighting.ambient.color;
    ambientLight.groundColor = this.scene.config.lighting.ambient.color;
    ambientLight.specular = Color3.Black();

    for (let sceneObject of this.scene.objects) {
      // @TODO do something with this game object?
      const _gameObject = await this.loadSceneObject(sceneObject);
    }
  }

  /*
    @TODO micro backlog
      // - hydrate raw definitions into "config" objects a-la Runtime
      // - put loaded project properties directly onto composer
      // - Add children to pzscene
      // - Add common resolver
      //   - Is this a common component?
      //   - register a provider for a scheme, something liek this
      - Add asset cache
        - Can this be a common component?
      // - Ponder how code sharing between editor and runtime looks
      //   - Cartridge archive
      //   - .pzproj
      //   - Concept of a "World" with objects in it
      //   - Probably editor and runtime are actually quite different, they just happen to be doing similar things
      //   - raw "Color" and "Vector3" types?
  */

  // @TODO this is basically identical to @fantasy-console/runtime/src/Game.createGameObjectFromConfig()
  // We should just re-use this functionality
  private async loadSceneObject(sceneObject: GameObjectConfig, parentTransform: TransformBabylon | undefined = undefined): Promise<GameObject> {
    console.log(`Loading scene object: `, sceneObject.name);
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
    await Promise.all(sceneObject.children.map((childSceneObject) => this.loadSceneObject(childSceneObject, gameObjectTransform)));

    // Create blank object
    const gameObject: GameObject = new GameObjectBabylon(
      this.nextGameObjectId++,
      {
        name: sceneObject.name,
        transform: gameObjectTransform,
      }
    );

    gameObjectTransform.setGameObject(gameObject);

    // Load game object components
    for (let componentConfig of sceneObject.components) {
      if (componentConfig instanceof MeshComponentConfig) {
        /* Mesh component */
        // @TODO load through cache
        let meshAsset = await SceneLoader.LoadAssetContainerAsync(
          componentConfig.meshAsset.fetchUri,
          undefined,
          this.babylonScene,
          undefined,
          componentConfig.meshAsset.fileExtension
        );
        gameObject.addComponent(new MeshComponentBabylon({ gameObject }, meshAsset));
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


  public get scene(): SceneConfig {
    return this._scene;
  }
}

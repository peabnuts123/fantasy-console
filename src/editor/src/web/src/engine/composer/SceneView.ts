import { makeAutoObservable, runInAction } from 'mobx';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene as BabylonScene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import "@babylonjs/loaders/OBJ";

import { TransformBabylon } from '@fantasy-console/runtime/world/TransformBabylon';
import { GameObject } from '@fantasy-console/core/world';
import { GameObjectBabylon } from '@fantasy-console/runtime/world/GameObjectBabylon';
import { DirectionalLightComponentBabylon, MeshComponentBabylon } from '@fantasy-console/runtime/world/components';
import { toColor3, toColor4 } from '@app/engine/composer/project/util/Color';

import { SceneDefinition, SceneManifest } from "./project/scene";
import { SceneObjectDefinition } from './project/scene/object';
import { toRuntimeVector3 } from './project/util/Vector3';
import { SceneObjectComponentType } from './project/scene/object/component';
import { Composer } from './Composer';
import { AssetType } from './project/AssetType';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';

export class SceneView {
  private composer: Composer;
  private _manifest: SceneManifest;
  private _scene?: SceneDefinition = undefined; // @NOTE explicit `undefined` for mobx
  private _isLoading: boolean;

  private engine?: Engine = undefined;
  private babylonScene?: BabylonScene = undefined;
  /** Counter for unique {@link GameObject} IDs */
  private nextGameObjectId = 1000;

  public constructor(manifest: SceneManifest, composer: Composer) {
    this._manifest = manifest;
    this.composer = composer;
    this._isLoading = true;
    void this.load(manifest);

    // @NOTE Class properties MUST have a value explicitly assigned
    // by this point otherwise mobx won't pick them up.
    makeAutoObservable(this);
  }

  private async load(sceneManifest: SceneManifest): Promise<void> {
    // await new Promise((resolve) => setTimeout(resolve, 2000));
    const scene = await this.composer.currentProject.sceneDb.loadSceneFromManifest(sceneManifest);
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

    void this.loadScene();


    /* Lifecycle */
    const onResize = () => this.engine?.resize();

    if (window) {
      window.addEventListener("resize", onResize);
    }

    this.babylonScene.whenReadyAsync().then(() => {
      this.engine!.runRenderLoop(() => {
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

  private async loadScene() {
    /* Scene clear color */
    this.babylonScene!.clearColor = toColor4(this.scene.config.clearColor);

    /* Set up global ambient lighting */
    const ambientLight = new HemisphericLight("__ambient", new Vector3(0, 0, 0), this.babylonScene);
    ambientLight.intensity = this.scene.config.lighting.ambient.intensity;
    ambientLight.diffuse = toColor3(this.scene.config.lighting.ambient.color);
    ambientLight.groundColor = toColor3(this.scene.config.lighting.ambient.color);
    ambientLight.specular = Color3.Black();

    for (let sceneObject of this.scene.objects) {
      await this.loadSceneObject(sceneObject);
    }
  }

  /*
    @TODO micro backlog
      - hydrate raw definitions into "config" objects a-la Runtime
      - put loaded project properties directly onto composer
      - Add children to pzscene
      - Add common resolver
        - Is this a common component?
        - register a provider for a scheme, something liek this
      - Add asset cache
        - Can this be a common component?
      - Ponder how code sharing between editor and runtime looks
        - Cartridge archive
        - .pzproj
        - Concept of a "World" with objects in it
        - Probably editor and runtime are actually quite different, they just happen to be doing similar things
        - raw "Color" and "Vector3" types?
  */

  private async loadSceneObject(sceneObject: SceneObjectDefinition, parentTransform: TransformBabylon | undefined = undefined) {
    console.log(`Loading scene object: `, sceneObject.name);
    // Construct game object transform for constructing scene's hierarchy
    const gameObjectTransform = new TransformBabylon(
      sceneObject.name,
      this.babylonScene!,
      parentTransform,
      toRuntimeVector3(sceneObject.transform.position)
    );

    // Create all child objects first
    // @TODO children
    // await Promise.all(gameObjectConfig.children.map((childObjectConfig) => this.createGameObjectFromConfig(childObjectConfig, gameObjectTransform)));

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
    for (let componentDefinition of sceneObject.components) {
      switch (componentDefinition.type) {
        case SceneObjectComponentType.Mesh:
          /* Mesh component */
          const meshFile = await this.composer.currentProject.assetDb.getById(componentDefinition.meshFileId, AssetType.Mesh);
          // @TODO put a protocol this to switch between sources? or something? a host?
          // @TODO load through cache
          let meshAsset = await SceneLoader.LoadAssetContainerAsync(`/project/` + meshFile.path, undefined, this.babylonScene, undefined, meshFile.extension);
          gameObject.addComponent(new MeshComponentBabylon({ gameObject }, meshAsset));
          break;
        case SceneObjectComponentType.DirectionalLight:
          /* Directional Light component */
          const light = new DirectionalLight(`light_directional`, Vector3.Down(), this.babylonScene);
          light.specular = Color3.Black();
          light.intensity = componentDefinition.intensity;
          light.diffuse = toColor3(componentDefinition.color);
          gameObject.addComponent(new DirectionalLightComponentBabylon({ gameObject }, light));
          break;
        // @TODO etc.
        default:
          console.log(`[DEBUG] Unimplemented object component type: ${componentDefinition.type}`);
      }
    }
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

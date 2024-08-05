import * as Jsonc from 'jsonc-parser';


import { SceneDefinition, SceneManifest } from "./project/scene";
import { FileSystem } from './filesystem';

export class SceneDb {
  private filesystem: FileSystem;
  private scenes: SceneManifest[];

  public constructor(filesystem: FileSystem, scenes: SceneManifest[]) {
    this.filesystem = filesystem;
    this.scenes = scenes;
  }

  public async loadSceneFromManifest(sceneManifest: SceneManifest): Promise<SceneDefinition> {
    const file = await this.filesystem.getByPath(sceneManifest.path);
    const json = new TextDecoder().decode(file.bytes);
    return Jsonc.parse(json) as SceneDefinition;
  }

  public async loadSceneByPathSuffix(pathSuffix: string): Promise<SceneDefinition> {
    const scene = this.getSceneManifestByPathSuffix(pathSuffix);
    return this.loadSceneFromManifest(scene);
  }

  public getSceneManifestByPathSuffix(pathSuffix: string): SceneManifest {
    const scenes = this.scenes.filter((scene) => {
      // Strip file extension from scene path
      let pathName = scene.path.replace(/\.[^.]+$/, '');
      // Test that suffix at least matches the path
      const looseMatch = pathName.endsWith(pathSuffix);
      // suffix must also match AT LEAST the entire file name of the scene
      // (i.e. last segment of the path)
      const pathSegments = pathName.split('/');
      return looseMatch && pathSuffix.endsWith(pathSegments[pathSegments.length - 1]);
    });

    if (scenes.length === 0) {
      throw new Error(`No scene matching suffix: ${pathSuffix}`);
    } else if (scenes.length > 1) {
      throw new Error(`More than one scene matches suffix: ${pathSuffix}`);
    } else {
      return scenes[0];
    }
  }

  public get allSceneManifests(): SceneManifest[] {
    return this.scenes;
  }
}
import type { SceneDefinition } from '../../archive';
import { AssetDb } from '../assets/AssetDb';
import { SceneData } from './SceneData';

export class SceneDb {
  private scenes: SceneData[];

  public constructor(sceneDefinitions: SceneDefinition[], assetDb: AssetDb) {
    this.scenes = sceneDefinitions.map((sceneDefinition) =>
      new SceneData(sceneDefinition, assetDb)
    );
  }

  public getByPathSuffix(pathSuffix: string): SceneData {
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

  public get allScenes(): SceneData[] {
    return this.scenes;
  }
}
import { ISceneScanner } from './ISceneScanner';
import { SceneObjectsScanner } from './SceneObjectsScanner';

export * from './ISceneScanner';
export * from './SceneObjectsScanner';

export const SceneScanners: ISceneScanner[] = [
  SceneObjectsScanner,
];

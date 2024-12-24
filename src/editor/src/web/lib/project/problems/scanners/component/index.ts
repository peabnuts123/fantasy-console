import { IComponentScanner } from './IComponentScanner';
import { MeshComponentScanner } from './MeshComponentScanner';
import { ScriptComponentScanner } from './ScriptComponentScanner';

export * from './IComponentScanner';
export * from './MeshComponentScanner';
export * from './ScriptComponentScanner';

export const ComponentScanners: IComponentScanner[] = [
  MeshComponentScanner,
  ScriptComponentScanner,
];

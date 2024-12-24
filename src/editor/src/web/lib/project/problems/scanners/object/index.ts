import { IObjectScanner } from './IObjectScanner';
import { ObjectComponentsScanner } from './ObjectComponentsScanner';

export * from './IObjectScanner';
export * from './ObjectComponentsScanner';

export const ObjectScanners: IObjectScanner[] = [
  ObjectComponentsScanner,
];

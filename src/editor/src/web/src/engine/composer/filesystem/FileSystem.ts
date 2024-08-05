import { File } from './File';

export interface FileSystem {
  getByPath(path: string): Promise<File>;
}

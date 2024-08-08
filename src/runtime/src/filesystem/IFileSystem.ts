import { VirtualFile } from "./VirtualFile";

export interface IFileSystem {
  getByPath(path: string): Promise<VirtualFile>;
}

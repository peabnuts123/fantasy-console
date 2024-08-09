import { VirtualFile } from "./VirtualFile";

export interface IFileSystem {
  getUrlForPath(path: string): string;
  readFile(path: string): Promise<VirtualFile>;
}

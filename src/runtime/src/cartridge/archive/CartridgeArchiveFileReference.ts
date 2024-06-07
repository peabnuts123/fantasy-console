import { VirtualFileType } from "../config/VirtualFile";

/**
 * Raw reference to a virtual file in a {@link CartridgeArchive}.
 * i.e. A pointer to a virtual file, before being loaded by the engine.
 */
export interface CartridgeArchiveFileReference {
  id: number;
  type: VirtualFileType;
  path: string;
}

import type { MeshComponent } from '@fantasy-console/core/src/world/components/MeshComponent';

import { ComponentConfig } from "./ComponentConfig";
import { VirtualFile, VirtualFileType } from "../VirtualFile";


/**
 * Configuration data for a {@link MeshComponent}.
 * i.e. loaded from the raw cartridge file but not yet loaded into the game.
 */
export class MeshComponentConfig extends ComponentConfig {
  /**
   * {@link VirtualFile} containing the mesh asset.
   */
  public meshFile: VirtualFile;
  public constructor(meshFile: VirtualFile) {
    super();

    // Validate
    if (meshFile.type !== VirtualFileType.Model) {
      throw new Error(`Cannot construct MeshComponent from non-model file ${meshFile}`);
    }

    this.meshFile = meshFile;
  }
}
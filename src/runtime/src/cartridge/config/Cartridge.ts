import { SceneConfig } from "./SceneConfig";
import { VirtualFileSystem } from "./VirtualFileSystem";

/**
 * A loaded game Cartridge, containing all the data for the entire game.
 */
export class Cartridge {
  public scenes: SceneConfig[];
  public files: VirtualFileSystem;

  public constructor(scenes: SceneConfig[], files: VirtualFileSystem) {
    this.scenes = scenes;
    this.files = files;
  }
}
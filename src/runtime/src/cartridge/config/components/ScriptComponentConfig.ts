import { ComponentConfig } from "./ComponentConfig";
import { VirtualFile, VirtualFileType } from "../VirtualFile";

/**
 * Configuration data for a custom component script written by the user.
 * i.e. loaded from the raw cartridge file but not yet loaded into the game.
 */
export class ScriptComponentConfig extends ComponentConfig {
  /**
   * {@link VirtualFile} containing the script asset.
   */
  public scriptFile: VirtualFile;
  public constructor(scriptFile: VirtualFile) {
    super();

    // Validate
    if (scriptFile.type !== VirtualFileType.Script) {
      throw new Error(`Cannot construct ScriptComponent from non-script file ${scriptFile}`);
    }

    this.scriptFile = scriptFile;
  }
}

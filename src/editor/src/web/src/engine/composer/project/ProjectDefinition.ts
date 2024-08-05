import { AssetDefinition } from "./AssetDefinition";
import { SceneManifest } from "./scene";

export interface ProjectDefinition {
  manifest: {
    projectName: string;
  },
  assets: AssetDefinition[];
  scenes: SceneManifest[];
}

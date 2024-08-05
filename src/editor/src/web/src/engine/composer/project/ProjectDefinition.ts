import { AssetDefinition } from "./AssetDefinition";

export interface ProjectDefinition {
  manifest: {
    projectName: string;
  },
  assets: AssetDefinition[];
  scenes: SceneManifest[];
}

import { AssetDefinition } from "./AssetDefinition";
import { SceneManifest } from "./scene";

export interface ProjectManifest {
  projectName: string;
}

export interface ProjectDefinition {
  manifest: ProjectManifest,
  assets: AssetDefinition[];
  scenes: SceneManifest[];
}

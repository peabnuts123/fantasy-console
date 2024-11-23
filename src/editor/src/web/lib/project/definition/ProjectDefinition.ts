import { AssetDefinition } from "./AssetDefinition";
import { SceneManifest } from "./scene";

export interface ProjectManifest {
  projectName: string;
}

// @TODO Do we need a `ProjectData`?
export interface ProjectDefinition {
  manifest: ProjectManifest,
  assets: AssetDefinition[];
  scenes: SceneManifest[];
}

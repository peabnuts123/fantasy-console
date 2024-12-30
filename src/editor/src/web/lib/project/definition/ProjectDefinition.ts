import { AssetDefinition } from "./AssetDefinition";
import { SceneManifest } from "./scene";

export interface ProjectManifest {
  readonly projectName: string;
}

export interface ProjectDefinition {
  readonly manifest: ProjectManifest,
  readonly assets: AssetDefinition[];
  readonly scenes: SceneManifest[];
}

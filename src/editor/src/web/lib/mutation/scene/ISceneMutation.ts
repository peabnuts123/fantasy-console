import { SceneViewController } from "@lib/composer/scene/SceneViewController";
import { ProjectController } from "@lib/project/ProjectController";

export interface SceneMutationArguments {
  SceneViewController: SceneViewController;
  ProjectController: ProjectController;
}

export interface ISceneMutation {
  get description(): string;
  apply(args: SceneMutationArguments): void;
  undo(args: SceneMutationArguments): void;
}

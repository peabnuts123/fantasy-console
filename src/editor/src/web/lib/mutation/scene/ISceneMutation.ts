import { SceneViewController } from "@lib/composer/scene/SceneViewController";
import { ProjectController } from "@lib/project/ProjectController";
import { IMutation } from "../IMutation";

export interface SceneMutationArguments {
  SceneViewController: SceneViewController;
  ProjectController: ProjectController;
}

export interface ISceneMutation extends IMutation<SceneMutationArguments> {
}

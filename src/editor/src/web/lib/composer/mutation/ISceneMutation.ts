import { ProjectController } from "@lib/project/ProjectController";
import { SceneView } from "../SceneView";

export interface SceneMutationArguments {
  SceneView: SceneView;
  ProjectController: ProjectController;
}

export interface ISceneMutation {
  apply(args: SceneMutationArguments): void;
  undo(args: SceneMutationArguments): void;
}
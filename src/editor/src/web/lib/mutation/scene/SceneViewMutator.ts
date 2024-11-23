import { ProjectController } from "@lib/project/ProjectController";
import { SceneViewController } from "@lib/composer/scene";
import { Mutator } from "../Mutator";
import { SceneViewMutationArguments } from "./SceneViewMutationArguments";


export type WriteSceneToDiskFn = (sceneViewController: SceneViewController) => Promise<void>;
export class SceneViewMutator extends Mutator<SceneViewMutationArguments> {
  private readonly sceneViewController: SceneViewController;
  private readonly projectController: ProjectController;
  private readonly writeSceneToDisk: WriteSceneToDiskFn;

  public constructor(sceneViewController: SceneViewController, projectController: ProjectController, writeSceneToDisk: WriteSceneToDiskFn) {
    super();
    this.sceneViewController = sceneViewController;
    this.projectController = projectController;
    this.writeSceneToDisk = writeSceneToDisk;
  }

  protected override getMutationArgs(): SceneViewMutationArguments {
    return {
      SceneViewController: this.sceneViewController,
      ProjectController: this.projectController,
    };
  }

  protected override persistChanges(): Promise<void> {
    return this.writeSceneToDisk(this.sceneViewController);
  }
}

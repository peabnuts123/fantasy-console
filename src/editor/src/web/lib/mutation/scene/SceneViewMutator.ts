import { ProjectController } from "@lib/project/ProjectController";
import { SceneViewController } from "@lib/composer/scene";
import { ISceneMutation } from "./ISceneMutation";

export class SceneViewMutator {
  private readonly sceneView: SceneViewController;
  private readonly projectController: ProjectController;
  private readonly mutationStack: ISceneMutation[];

  public constructor(sceneView: SceneViewController, projectController: ProjectController) {
    this.sceneView = sceneView;
    this.projectController = projectController;
    this.mutationStack = [];
  }

  public apply(mutation: ISceneMutation): void {
    // Push on to undo stack before applying
    //  so as to avoid losing applied mutations
    this.mutationStack.push(mutation);

    // Apply mutation
    mutation.apply({
      SceneViewController: this.sceneView,
      ProjectController: this.projectController,
    });
  }

  public undo(): void {
    if (this.mutationStack.length === 0) {
      return; // Stack is empty
    }

    // Undo mutation
    const mutation = this.mutationStack[this.mutationStack.length - 1];
    mutation.undo({
      SceneViewController: this.sceneView,
      ProjectController: this.projectController,
    });

    // Only remove from stack if undo was successful
    this.mutationStack.pop();
  }
}

import { ProjectController } from "@lib/project/ProjectController";
import { SceneViewController } from "@lib/composer/scene";
import { ISceneMutation } from "./ISceneMutation";
import { IContinuousSceneMutation } from "./IContinuousSceneMutation";

export class SceneViewMutator {
  private readonly sceneView: SceneViewController;
  private readonly projectController: ProjectController;
  private readonly mutationStack: ISceneMutation[];

  public constructor(sceneView: SceneViewController, projectController: ProjectController) {
    this.sceneView = sceneView;
    this.projectController = projectController;
    this.mutationStack = [];
  }

  public beginContinuous<TMutation extends IContinuousSceneMutation<any>>(continuousMutation: TMutation): void {
    // @TODO if latestMutation is not applied - error
    this.mutationStack.push(continuousMutation);
    continuousMutation.begin(this.getMutationArgs());
  }

  public updateContinuous<TMutation extends IContinuousSceneMutation<any>>(continuousMutation: TMutation, updateArgs: TMutation extends IContinuousSceneMutation<infer TUpdateArgs> ? TUpdateArgs : never): void {
    if (this.latestMutation !== continuousMutation) {
      throw new Error(`Cannot update continuous mutation - provided instance is not the latest mutation`);
    }
    continuousMutation.update(this.getMutationArgs(), updateArgs);
  }

  public apply(mutation: ISceneMutation): void {
    // Push on to undo stack before applying
    //  so as to avoid losing applied mutations
    this.mutationStack.push(mutation);

    // Apply mutation
    mutation.apply(this.getMutationArgs());
  }

  public undo(): void {
    if (this.mutationStack.length === 0) {
      return; // Stack is empty
    }

    // Undo mutation
    const mutation = this.mutationStack[this.mutationStack.length - 1];
    mutation.undo(this.getMutationArgs());

    // Only remove from stack if undo was successful
    this.mutationStack.pop();
  }

  private getMutationArgs() {
    return {
      SceneViewController: this.sceneView,
      ProjectController: this.projectController,
    };
  }

  private get latestMutation(): ISceneMutation | undefined {
    if (this.mutationStack.length === 0) {
      return undefined;
    } else {
      return this.mutationStack[this.mutationStack.length - 1];
    }
  }
}

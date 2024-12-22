import { ProjectController } from "@lib/project/ProjectController";
import { Mutator } from "../Mutator";
import { ProjectMutationArguments } from "./ProjectMutationArguments";

export class ProjectMutator extends Mutator<ProjectMutationArguments> {
  private readonly projectController: ProjectController;

  public constructor(projectController: ProjectController) {
    super();
    this.projectController = projectController;
  }

  protected override getMutationArgs(): ProjectMutationArguments {
    return {
      ProjectController: this.projectController,
    };
  }

  public override persistChanges(): Promise<void> {
    const projectFileJson = this.projectController.currentProjectJson.toString();
    const projectFileBytes = new TextEncoder().encode(projectFileJson);
    return this.projectController.fileSystem.writeFile(
      this.projectController.currentProjectFileName,
      projectFileBytes,
    );
  }
}

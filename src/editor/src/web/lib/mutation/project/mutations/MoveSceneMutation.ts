import { resolvePath } from '@lib/util/JsoncContainer';
import { ProjectDefinition } from '@lib/project/definition';
import { SceneData } from '@lib/project/data';
import { IProjectMutation } from "../IProjectMutation";
import { ProjectMutationArguments } from "../ProjectMutationArguments";

export class MoveSceneMutation implements IProjectMutation {
  private readonly sceneId: string;
  private newPath: string;

  public constructor(scene: SceneData, newPath: string) {
    this.sceneId = scene.id;
    this.newPath = newPath;

    if (newPath.trim() === '') {
      throw new Error(`Cannot move scene - 'path' cannot be empty`);
    }
  }

  apply({ ProjectController }: ProjectMutationArguments): void {
    const scene = ProjectController.project.scenes.getById(this.sceneId);
    if (scene === undefined) throw new Error(`Cannot move scene - No scene exists with Id '${this.sceneId}'`);
    const oldPath = scene.data.path;


    // 1. Update data
    scene.data.path = this.newPath;
    scene.manifest.path = this.newPath;

    // 2. Update JSON
    const jsonIndex = ProjectController.projectDefinition.value.scenes.findIndex((sceneManifest) => sceneManifest.id === scene.data.id);
    const jsonPath = resolvePath((project: ProjectDefinition) => project.scenes[jsonIndex].path);
    ProjectController.projectDefinition.mutate(jsonPath, this.newPath);

    // 3. Move asset on disk
    void ProjectController.fileSystem.moveFile(
      oldPath,
      this.newPath,
    );
  }

  undo(_args: ProjectMutationArguments): void {
    // @TODO prompt for undo?
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Rename scene`;
  }
}


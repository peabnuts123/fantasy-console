import { ProjectController } from "@lib/project/ProjectController";
import { SceneViewController } from "@lib/composer/scene";
import { invoke } from "@lib/util/TauriCommands";
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

  protected override async persistChanges(): Promise<void> {
    const { scene, sceneJson } = this.sceneViewController;
    const { project, projectDefinition, mutator: projectMutator } = this.projectController;

    const sceneDefinitionJson = sceneJson.toString();
    const sceneDefinitionBytes = new TextEncoder().encode(sceneDefinitionJson);
    const existingScene = project.scenes.getById(scene.id);
    if (existingScene === undefined) throw new Error(`Cannot persist changes to scene - it is not known to the project definition?`);

    const newSceneHash = await invoke('hash_data', { data: Array.from(sceneDefinitionBytes) });

    if (existingScene.manifest.hash !== newSceneHash) {
      // Scene contents have changes - record changes to hash
      existingScene.data.hash = newSceneHash;
      existingScene.manifest.hash = newSceneHash;

      // Hash must change in project file too
      const sceneManifestIndex = projectDefinition.value.scenes.findIndex((sceneManifest) => sceneManifest.id === scene.id);
      projectDefinition.mutate((project) => project.scenes[sceneManifestIndex].hash, newSceneHash);
      await projectMutator.persistChanges();
    }

    return this.projectController.fileSystem.writeFile(
      scene.path,
      sceneDefinitionBytes,
    );
  }
}

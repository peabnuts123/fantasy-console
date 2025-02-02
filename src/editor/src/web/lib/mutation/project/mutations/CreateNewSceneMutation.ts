import { v4 as uuid } from 'uuid';

import { ComponentDefinitionType } from '@fantasy-console/runtime/src/cartridge';

import { JsoncContainer, resolvePath } from '@lib/util/JsoncContainer';
import { ProjectDefinition, SceneManifest } from '@lib/project/definition';
import { SceneDefinition } from '@lib/project/definition/scene/SceneDefinition';
import { invoke } from '@lib/util/TauriCommands';
import { IProjectMutation } from "../IProjectMutation";
import { ProjectMutationArguments } from "../ProjectMutationArguments";

export class CreateNewSceneMutation implements IProjectMutation {
  private path: string;

  public constructor(path: string) {
    this.path = path;
  }

  apply({ ProjectController }: ProjectMutationArguments): void {
    // New Data
    const newSceneManifest: SceneManifest = {
      id: uuid(),
      hash: "", // @NOTE calculated asynchronously
      path: this.path,
    };
    const newSceneJsonc = this.createNewSceneDefinition();
    const newSceneJsoncBytes = new TextEncoder().encode(
      newSceneJsonc.toString()
    );

    // 0. Calculate hash (asynchronously)
    // @NOTE We could just delete this whole block and rely on the FS watcher to
    // notify the frontend of the scene's hash. However, PolyZone has a principle that no
    // functionality within the app should rely on the FS watcher. So we manually
    // request the hash of the new scene and assign it, in case the FS watcher is not working.
    invoke('hash_data', {
      data: Array.from(newSceneJsoncBytes),
    }).then((newSceneHash) => {
      // ???. (later) - Update references to hash
      const scene = ProjectController.project.scenes.getById(newSceneManifest.id);
      if (scene !== undefined) {
        scene.data.hash = newSceneHash;
        scene.manifest.hash = newSceneHash;
      }

      let sceneIndex = ProjectController.projectDefinition.value.scenes.findIndex((scene) => scene.id === newSceneManifest.id);
      if (ProjectController.projectDefinition.value.scenes[sceneIndex].hash !== newSceneHash) {
        let jsonPath = resolvePath((project: ProjectDefinition) => project.scenes[sceneIndex].hash);
        ProjectController.projectDefinition.mutate(jsonPath, newSceneHash);
        // @NOTE re-invoke persistChanges() after editing project file a second time
        return ProjectController.mutator.persistChanges();
      }
    });

    // 1. Update data
    ProjectController.project.scenes.add(newSceneManifest, newSceneJsonc);

    // 2. Update JSON
    const jsonPath = resolvePath((project: ProjectDefinition) => project.scenes[ProjectController.project.scenes.length]);
    ProjectController.projectDefinition.mutate(jsonPath, newSceneManifest, { isArrayInsertion: true })

    // 3. Create new asset on disk
    void ProjectController.fileSystem.writeFile(
      this.path,
      newSceneJsoncBytes,
    );
  }

  undo(args: ProjectMutationArguments): void {
    // @TODO prompt for undo?
    throw new Error("Method not implemented.");
  }

  private createNewSceneDefinition(): JsoncContainer<SceneDefinition> {
    const definition: SceneDefinition = {
      config: {
        clearColor: {
          r: 255,
          g: 235,
          b: 245,
        },
        lighting: {
          ambient: {
            color: {
              r: 255,
              g: 255,
              b: 255,
            },
            intensity: 0.3,
          },
        },
      },
      objects: [
        {
          id: uuid(),
          name: 'Main camera',
          transform: {
            position: { x: 0, y: 0, z: -5 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
          },
          children: [],
          components: [
            {
              id: uuid(),
              type: ComponentDefinitionType.Camera,
            }
          ]
        },
        {
          id: uuid(),
          name: 'Sun',
          transform: {
            position: { x: 0, y: 10, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
          },
          children: [],
          components: [
            {
              id: uuid(),
              type: ComponentDefinitionType.DirectionalLight,
              color: {
                r: 255,
                g: 255,
                b: 255,
              },
              intensity: 1,
            }
          ]
        },
      ],
    };

    return new JsoncContainer(JSON.stringify(definition, null, 2));
  }

  get description(): string {
    return `Create new scene`;
  }
}


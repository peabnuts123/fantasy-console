import { writeFile } from '@tauri-apps/plugin-fs';
import { v4 as uuid } from 'uuid';

import { ComponentDefinitionType, SceneDefinition } from '@fantasy-console/runtime/src/cartridge';

import { resolvePath } from '@lib/util/JsoncContainer';
import { ProjectDefinition, SceneManifest } from '@lib/project/definition';
import { IProjectMutation } from "../IProjectMutation";
import { ProjectMutationArguments } from "../ProjectMutationArguments";

export class CreateNewSceneMutation implements IProjectMutation {
  private path: string;

  public constructor(path: string) {
    this.path = path;
  }

  apply({ ProjectController }: ProjectMutationArguments): void {
    // @TODO Do we need to make explicit different types for scene on disk vs scene in manifest?
    const newSceneManifest: SceneManifest = {
      // hash: "", // @TODO soon...
      path: this.path,
    };

    // 1. Update data
    ProjectController.currentProject.scenes.push(newSceneManifest);

    // 2. Update JSON
    const jsonPath = resolvePath((project: ProjectDefinition) => project.scenes[ProjectController.currentProject.scenes.length]);
    ProjectController.currentProjectJson.mutate(jsonPath, newSceneManifest, { isArrayInsertion: true })

    // 3. Create new asset on disk
    const newSceneDefinition: Omit<SceneDefinition, 'path'> = {
      id: uuid(),
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

    void ProjectController.fileSystem.writeFile(
      this.path,
      new TextEncoder().encode(
        JSON.stringify(newSceneDefinition, null, 2)
      )
    );
  }

  // @TODO Some way of not supporting "undo" ?
  undo(args: ProjectMutationArguments): void {
    throw new Error("Method not implemented.");
  }

  get description(): string {
    return `Create new scene`;
  }
}


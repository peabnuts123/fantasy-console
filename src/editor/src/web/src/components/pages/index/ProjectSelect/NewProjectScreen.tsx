import { useState, type FunctionComponent } from "react";
import { z } from 'zod';
import cn from 'classnames';
import { save } from "@tauri-apps/plugin-dialog";
import * as path from '@tauri-apps/api/path';
import { exists, mkdir, writeTextFile } from "@tauri-apps/plugin-fs";
import { v4 as uuid } from 'uuid';

import { CameraComponentDefinition, ComponentDefinitionType, DirectionalLightComponentDefinition } from "@fantasy-console/runtime/src/cartridge";

import { convertToSafeFileName } from "@lib/util/path";
import { ProjectDefinition, SceneDefinition } from "@lib/project";
import { invoke } from "@lib/util/TauriCommands";
import { useLibrary } from "@lib/index";

// Form validation
const ProjectNameSchema = z.string()
  .nonempty("Project name cannot be empty");


export interface NewProjectScreenProps {
  cancelCreate: () => void;
}
export const NewProjectScreen: FunctionComponent<NewProjectScreenProps> = ({ cancelCreate }) => {
  const { ProjectController } = useLibrary();

  // State
  const [projectName, setProjectName] = useState<string>("");
  // - Form validation
  const [showProjectNameValidation, setShowProjectNameValidation] = useState<boolean>(false);

  // Computed state
  // - Form validation
  const projectNameValidationError = ProjectNameSchema.safeParse(projectName).error;
  const isProjectNameValidationErrorVisible = showProjectNameValidation && projectNameValidationError !== undefined;

  const isFormValid = !projectNameValidationError;

  async function onClickCreate() {
    setShowProjectNameValidation(true);
    if (!isFormValid) return;

    const documentsDirectory = await path.documentDir();
    const defaultFileName = convertToSafeFileName(projectName);
    const defaultPath = await path.join(documentsDirectory, `${defaultFileName}.pzproj`);
    const savePath = await save({
      title: "Create new PolyZone project",
      defaultPath,
      filters: [{
        name: 'PolyZone Project',
        extensions: ['pzproj'],
      }]
    });
    if (!savePath) return;

    // Write new project (including folder structure) to disk
    await createNewProject({
      projectName,
      projectPath: savePath,
    });

    // Load new project from disk
    await ProjectController.loadProject(savePath);
  }

  return (
    <>
      <div className="flex flex-row justify-between mb-2">
        <h2 className="text-h2 text-retro-shadow font-serif">New project</h2>
      </div>

      <form action="#" onSubmit={onClickCreate} className="mb-2">
        {/* Project Name */}
        <div className="mt-2">
          <label>
            {/* Label */}
            <div className="font-bold text-retro-shadow is-shallow mb-1">Project name</div>
            {/* Input */}
            <input
              type="text"
              className={cn("w-full p-1 text-black", {
                'text-red-800': isProjectNameValidationErrorVisible,
              })}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setShowProjectNameValidation(true)}
            />
            {/* Validation error */}
            {isProjectNameValidationErrorVisible &&
              projectNameValidationError.issues.map((validationError, index) => (
                <div key={index} className="bg-pink-500 text-black p-2">
                  {validationError.message}
                </div>
              ))
            }
          </label>
        </div>
      </form>

      <div className="flex flex-row justify-betweenx">
        <button type="submit" onClick={onClickCreate} className="button ml-0">Create</button>
        <button onClick={cancelCreate} className="button">Cancel</button>
      </div>
    </>
  );
};

interface CreateNewProjectArgs {
  projectName: string;
  projectPath: string;
}
async function createNewProject({ projectName, projectPath }: CreateNewProjectArgs) {
  const projectDirRoot = await path.resolve(projectPath, '..');

  // New data
  // @TODO Any way we could add default comments to this? Modify with jsonc?
  // - New scene
  const newSceneDefinition: SceneDefinition = {
    config: {
      clearColor: { r: 255, g: 214, b: 253 },
      lighting: {
        ambient: {
          color: { r: 255, g: 214, b: 253 },
          intensity: 0.4,
        },
      },
    },
    objects: [
      // @TODO default cube
      {
        id: uuid(),
        name: "Camera",
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
          } satisfies CameraComponentDefinition,
        ],
      },
      {
        id: uuid(),
        name: "Sun",
        transform: {
          position: { x: 0, y: 5, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        children: [],
        components: [
          {
            id: uuid(),
            type: ComponentDefinitionType.DirectionalLight,
            color: { r: 255, g: 214, b: 253 },
            intensity: 0.4,
          } satisfies DirectionalLightComponentDefinition,
        ]
      }
    ]
  };
  const newSceneJson = JSON.stringify(newSceneDefinition, null, 2);
  const newScenePath = `scenes/game.pzscene`;
  const newProjectDefinition: ProjectDefinition = {
    manifest: {
      projectName,
    },
    assets: [],
    scenes: [
      {
        id: uuid(),
        path: newScenePath,
        hash: await invoke('hash_data', {
          data: Array.from(new TextEncoder().encode(newSceneJson)),
        }),
      }
    ]
  }

  // Create top-level folders (if they do not already exist)
  const TopLevelFolders = [
    'models',
    'scenes',
    'scripts',
    'textures',
  ];
  for (const topLevelFolder of TopLevelFolders) {
    const folderPath = await path.resolve(projectDirRoot, topLevelFolder);
    if (!await exists(folderPath)) {
      await mkdir(folderPath);
    }
  }

  // Write new project file
  await writeTextFile(projectPath, JSON.stringify(newProjectDefinition, null, 2));

  // Write new scene
  const newSceneAbsolutePath = await path.resolve(projectDirRoot, newScenePath);
  await writeTextFile(newSceneAbsolutePath, newSceneJson);
}

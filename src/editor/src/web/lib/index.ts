import { createContext, useContext } from 'react';

import { ComposerController } from "./composer/ComposerController";
import { ProjectController } from "./project/ProjectController";
import { ApplicationDataController } from './application/ApplicationDataController';

export interface Library {
  ProjectController: ProjectController;
  ComposerController: ComposerController;
  ApplicationDataController: ApplicationDataController
  onPageUnload: () => void;
}

export function createLibrary(): Library {
  // Poor-man's dependency injection
  const applicationDataController = new ApplicationDataController();
  const projectController = new ProjectController(applicationDataController);
  const composerController = new ComposerController(projectController);
  return {
    ProjectController: projectController,
    ComposerController: composerController,
    ApplicationDataController: applicationDataController,
    onPageUnload() {
      projectController.onDestroy();
      composerController.onDestroy();
    },
  };
}

export const LibraryContext = createContext<Library>(undefined!);
export const useLibrary = () => useContext(LibraryContext);

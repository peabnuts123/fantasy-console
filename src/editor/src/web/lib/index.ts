import { createContext, useContext } from 'react';

import { ComposerController } from "./composer/ComposerController";
import { ProjectController } from "./project/ProjectController";

export interface Library {
  ProjectController: ProjectController;
  ComposerController: ComposerController;
  onPageUnload: () => void;
}

export function createLibrary(): Library {
  // Poor-man's dependency injection
  const projectController = new ProjectController();
  const composerController = new ComposerController(projectController);
  return {
    ProjectController: projectController,
    ComposerController: composerController,
    onPageUnload() {
      projectController.onDestroy();
      composerController.onDestroy();
    },
  };
}

export const LibraryContext = createContext<Library>(undefined!);
export const useLibrary = () => useContext(LibraryContext);

import { createContext, useContext } from 'react';

import { ComposerController } from "./composer/ComposerController";
import { ProjectController } from "./project/ProjectController";

export interface Library {
  ProjectController: ProjectController;
  ComposerController: ComposerController;
}

export function createLibrary(): Library {
  // Poor-man's dependency injection
  const projectController = new ProjectController();
  const composer = new ComposerController(projectController);
  return {
    ProjectController: projectController,
    ComposerController: composer,
  };
}

export const LibraryContext = createContext<Library>(undefined!);
export const useLibrary = () => useContext(LibraryContext);

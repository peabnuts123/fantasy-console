import { createContext, useContext, useState } from 'react';

import { ComposerController } from "./composer/ComposerController";
import { ProjectController } from "./project/ProjectController";
import { ApplicationDataController } from './application/ApplicationDataController';

export interface Library {
  ProjectController: ProjectController;
  ComposerController: ComposerController;
  ApplicationDataController: ApplicationDataController
  unloadProject: () => void,
  onPageUnload: () => void;
}

/* eslint-disable react-hooks/rules-of-hooks */ // I guess eslint is sad because the function is not called `use____()`
export function createLibrary(): Library {

  // Poor-man's dependency injection
  const [applicationDataController, _setApplicationDataController] = useState<ApplicationDataController>(new ApplicationDataController());
  const [projectController, setProjectController] = useState<ProjectController>(new ProjectController(applicationDataController));
  const [composerController, setComposerController] = useState<ComposerController>(new ComposerController(projectController));

  return {
    ProjectController: projectController,
    ComposerController: composerController,
    ApplicationDataController: applicationDataController,
    unloadProject() {
      projectController.onDestroy();
      composerController.onDestroy();

      // @NOTE be careful you don't accidentally leave dangling copies of old instances
      // laying around when construction new ones
      const newProjectController = new ProjectController(applicationDataController);
      const newComposerController = new ComposerController(newProjectController);
      setProjectController(newProjectController);
      setComposerController(newComposerController);
    },
    onPageUnload() {
      projectController.onDestroy();
      composerController.onDestroy();
    },
  };
}
/* eslint-enable react-hooks/rules-of-hooks */

export const LibraryContext = createContext<Library>(undefined!);
export const useLibrary = (): Library => useContext(LibraryContext);

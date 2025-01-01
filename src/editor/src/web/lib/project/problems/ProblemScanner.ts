import { AssetDb } from "../AssetDb";
import { ProjectController } from "../ProjectController";
import { ProjectAssetEvent } from "../watcher/assets";
import { ProjectFileEvent } from "../watcher/project";
import { ProjectSceneEvent } from "../watcher/scenes";

import { ProjectScanners } from './scanners/project';
import { SceneScanners } from './scanners/scene';


// Config
const DebounceTimeMilliseconds = 1000;

export type ReportProblemFn = (problemKey: string, path: string[], description: string) => void;

export interface ScannerContext {
  projectController: ProjectController;
  assetDb: AssetDb;
}

// @TODO Problem scanner backlog
// - Shouldn't the scanner hierarchy really be project -> (scene manifests/assets) -> scenes -> objects -> components
// - Duplicate files in asset list will cause problems in zip archive

export class ProblemScanner {
  private readonly projectController: ProjectController;
  private cancelDebounce: (() => void) | undefined = undefined;
  private stopListeningToFileSystemEvents: () => void;

  public constructor(projectController: ProjectController) {
    this.projectController = projectController;

    // Subscribe to file events
    const stopListeningToAssetEvents = this.projectController.filesWatcher.onAssetChanged((event) => this.onFileChanged(event));
    const stopListeningToSceneEvents = this.projectController.filesWatcher.onSceneChanged((event) => this.onFileChanged(event));
    const stopListeningToProjectFileEvents = this.projectController.filesWatcher.onProjectFileChanged((event) => this.onFileChanged(event));
    this.stopListeningToFileSystemEvents = () => {
      stopListeningToAssetEvents();
      stopListeningToSceneEvents();
      stopListeningToProjectFileEvents();
    };
  }

  private onFileChanged(event: ProjectAssetEvent | ProjectSceneEvent | ProjectFileEvent) {
    console.log(`[DEBUG] [ProblemScanner] (onFileChanged) Got event:`, event);

    // Cancel debounce timer if there is one ongoing
    if (this.cancelDebounce !== undefined) {
      console.log(`[DEBUG] [ProblemScanner] (onFileChanged) Debounc'd!`);
      this.cancelDebounce();
    }

    // Trigger scan after X time of no events
    const cancelDebounceKey = window.setTimeout(() => {
      this.cancelDebounce = undefined;
      this.scanForProblems();
    }, DebounceTimeMilliseconds);

    // Store new cancel function
    this.cancelDebounce = () => {
      clearTimeout(cancelDebounceKey);
    }
  }

  private scanForProblems() {
    // @TODO where do these go?
    const reportProblem: ReportProblemFn = (problemKey, path, description) => {
      this.debug_printProblem(problemKey, path, description);
    }
    const scannerContext: ScannerContext = {
      projectController: this.projectController,
      assetDb: this.projectController.project.assets,
    };

    console.log(`[ProblemScanner] (scanForProblems) Scanning project for problems...`);

    // Scan project
    const project = this.projectController.projectDefinition;
    for (const projectScanner of ProjectScanners) {
      projectScanner.scan(project.value, reportProblem, scannerContext);
    }

    // Scan scenes
    for (const scene of this.projectController.project.scenes.getAll()) {
      console.log(`[ProblemScanner] (scanForProblems) Scanning scene '${scene.manifest.path}' for problems...`);
      const sceneDefinition = scene.jsonc.value;
      for (const sceneScanner of SceneScanners) {
        sceneScanner.scan(sceneDefinition, scene.manifest.path, reportProblem, scannerContext);
      }
    }
  }

  private debug_printProblem(problemKey: string, path: string[], description: string) {
    console.log(`[ProblemScanner] (debug_printProblem) Found problem: (key='${problemKey}') "${path.join(' > ')}: ${description}"`);
  }

  public onDestroy() {
    this.stopListeningToFileSystemEvents();
    if (this.cancelDebounce !== undefined) {
      this.cancelDebounce();
    }
  }
}

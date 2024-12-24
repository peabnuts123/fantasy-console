import { AssetDb } from "../AssetDb";
import { ProjectAssetEvent } from "../ProjectAssetsWatcher";
import { ProjectController } from "../ProjectController";

import { ProjectScanners } from './scanners/project';
import { SceneScanners } from './scanners/scene';


// Config
const DebounceTimeMilliseconds = 1000;

export type ReportProblemFn = (problemKey: string, path: string[], description: string) => void;

export interface ScannerContext {
  projectController: ProjectController;
  assetDb: AssetDb;
}

export class ProblemScanner {
  private readonly projectController: ProjectController;
  private cancelDebounce: (() => void) | undefined = undefined;
  private stopListening: () => void;

  public constructor(projectController: ProjectController) {
    this.projectController = projectController;

    // Subscribe to asset events
    this.stopListening = this.projectController.assetsWatcher.listen((event) => this.onAssetChanged(event));
  }

  private onAssetChanged(event: ProjectAssetEvent) {
    console.log(`[DEBUG] [ProblemScanner] (onAssetChanged) Got asset event:`, event);

    // Cancel debounce timer if there is one ongoing
    if (this.cancelDebounce !== undefined) {
      console.log(`[DEBUG] [ProblemScanner] (onAssetChanged) Debounc'd!`);
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
      assetDb: this.projectController.assetDb,
    };

    console.log(`[ProblemScanner] (scanForProblems) Scanning project for problems...`);

    // Scan project
    const project = this.projectController.currentProject;
    for (const projectScanner of ProjectScanners) {
      projectScanner.scan(project, reportProblem, scannerContext);
    }

    // Scan scenes
    for (const rawSceneData of this.projectController.currentProjectRawSceneData) {
      console.log(`[ProblemScanner] (scanForProblems) Scanning scene '${rawSceneData.manifest.path}' for problems...`);
      const sceneDefinition = rawSceneData.jsonc.value;
      for (const sceneScanner of SceneScanners) {
        sceneScanner.scan(sceneDefinition, rawSceneData.manifest.path, reportProblem, scannerContext);
      }
    }
  }

  private debug_printProblem(problemKey: string, path: string[], description: string) {
    console.log(`[ProblemScanner] (debug_printProblem) Found problem: (key='${problemKey}') "${path.join(' > ')}: ${description}"`);
  }

  public onDestroy() {
    this.stopListening();
    if (this.cancelDebounce !== undefined) {
      this.cancelDebounce();
    }
  }
}

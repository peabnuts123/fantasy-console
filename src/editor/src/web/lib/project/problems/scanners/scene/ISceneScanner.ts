import { SceneDefinition } from "@lib/project/definition/scene/SceneDefinition";
import { ReportProblemFn, ScannerContext } from "../../ProblemScanner";

export interface ISceneScanner {
  scan(scene: SceneDefinition, path: string, reportProblem: ReportProblemFn, context: ScannerContext): void;
}

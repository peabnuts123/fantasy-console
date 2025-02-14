import { GameObjectDefinition } from "@polyzone/runtime/src/cartridge";
import { ReportProblemFn, ScannerContext } from "../../ProblemScanner";

export interface IObjectScanner {
  scan(object: GameObjectDefinition, ancestorPath: GameObjectDefinition[], reportProblem: ReportProblemFn, context: ScannerContext): void;
}

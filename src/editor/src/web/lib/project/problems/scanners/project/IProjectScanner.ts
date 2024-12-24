import { ReportProblemFn, ScannerContext } from "../../ProblemScanner";
import { ProjectDefinition } from "@lib/project/definition";

export interface IProjectScanner {
  scan(project: ProjectDefinition, reportProblem: ReportProblemFn, context: ScannerContext): void;
}

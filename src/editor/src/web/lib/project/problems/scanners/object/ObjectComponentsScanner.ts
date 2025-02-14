import { GameObjectDefinition } from "@polyzone/runtime/src/cartridge";
import { ReportProblemFn, ScannerContext } from "../../ProblemScanner";
import { ComponentScanners } from "../component";
import { IObjectScanner } from "./IObjectScanner";

/**
 * Object scanner that scans the object's components for problems
 * using component scanners
 */
export const ObjectComponentsScanner: IObjectScanner = {
  scan: function (object: GameObjectDefinition, ancestorPath: GameObjectDefinition[], reportProblem: ReportProblemFn, context: ScannerContext): void {
    const objectPath = [...ancestorPath, object]
      .map((object) => object.name)
      .join('/');

    // Curry problem reporter for components
    const reportComponentProblem: ReportProblemFn = (problemKey, componentPath, description) => {
      reportProblem(
        problemKey,
        [objectPath, ...componentPath],
        description,
      );
    };

    // Run each scanner over each component
    for (const component of object.components ?? []) {
      for (const componentScanner of ComponentScanners) {
        componentScanner.scan(component, reportComponentProblem, context);
      }
    }
  },
};

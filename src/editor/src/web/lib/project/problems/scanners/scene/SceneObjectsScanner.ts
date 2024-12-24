import { GameObjectDefinition } from "@fantasy-console/runtime/src/cartridge";
import { ReportProblemFn, ScannerContext } from "../../ProblemScanner";
import { ObjectScanners } from "../object";
import { ISceneScanner } from "./ISceneScanner";
import { SceneDefinition } from "@lib/project/definition/scene/SceneDefinition";

/**
 * Scene scanner that scans the scene's objects for problems
 * using object scanners
 */
export const SceneObjectsScanner: ISceneScanner = {
  scan: function (scene: SceneDefinition, path: string, reportProblem: ReportProblemFn, context: ScannerContext): void {
    // Curry problem reporter for components
    const reportObjectProblem: ReportProblemFn = (problemKey, objectPath, description) => {
      reportProblem(
        problemKey,
        [path, ...objectPath],
        description
      );
    };

    scanObjects(scene.objects, [], reportObjectProblem, context);
  }
}

/**
 * Recursively run object scanners over a collection of objects
 */
function scanObjects(objects: GameObjectDefinition[], objectPath: GameObjectDefinition[], reportProblem: ReportProblemFn, context: ScannerContext): void {
  for (const object of objects) {
    // Run scanners over object
    for (const objectScanner of ObjectScanners) {
      objectScanner.scan(object, objectPath, reportProblem, context);
    }

    // Recursively run scanners over object's children
    if (object.children) {
      scanObjects(object.children, [...objectPath, object], reportProblem, context);
    }
  }
}

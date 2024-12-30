import { ComponentDefinition, ComponentDefinitionType } from "@fantasy-console/runtime/src/cartridge";
import { isDefined } from "@fantasy-console/runtime/src/util";
import { ScriptAssetData } from "@lib/project/data/AssetData";
import { ReportProblemFn, ScannerContext } from "../../ProblemScanner";
import { IComponentScanner } from "./IComponentScanner";

export const ScriptComponentScanner: IComponentScanner = {
  scan: function (component: ComponentDefinition, reportProblem: ReportProblemFn, { assetDb }: ScannerContext): void {
    const componentPath = [`Script component (id='${component.id}')`];

    if (component.type === ComponentDefinitionType.Script) {
      if (isDefined(component.scriptFileId)) {
        const asset = assetDb.findById(component.scriptFileId);

        if (asset === undefined) {
          reportProblem(
            `ScriptComponent/ReferencedAssetDoesNotExist/id=${component.scriptFileId}`,
            componentPath,
            `Referencing asset that does not exist (asset id='${component.scriptFileId}')`
          );
        } else if (!(asset instanceof ScriptAssetData)) {
          reportProblem(
            `ScriptComponent/ReferencedAssetIsWrongType/id=${component.scriptFileId}`,
            componentPath,
            `Referencing asset (with id='${component.scriptFileId}') that is not a script asset (actual type='${asset.type}')`
          );
        }
      }
    }
  }
}

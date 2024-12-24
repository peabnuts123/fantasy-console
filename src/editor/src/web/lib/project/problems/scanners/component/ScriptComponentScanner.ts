import { ComponentDefinition, ComponentDefinitionType } from "@fantasy-console/runtime/src/cartridge";
import { ReportProblemFn, ScannerContext } from "../../ProblemScanner";
import { IComponentScanner } from "./IComponentScanner";
import { ScriptAssetData } from "@lib/project/data/AssetData";

export const ScriptComponentScanner: IComponentScanner = {
  scan: function (component: ComponentDefinition, reportProblem: ReportProblemFn, { assetDb }: ScannerContext): void {
    const componentPath = [`Script component (id='${component.id}')`];

    if (component.type === ComponentDefinitionType.Script) {
      if (component.scriptFileId !== undefined) {
        const asset = assetDb.assets.find((asset) => asset.id === component.scriptFileId);

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

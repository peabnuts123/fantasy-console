import { ComponentDefinition, ComponentDefinitionType } from "@polyzone/runtime/src/cartridge";
import { isDefined } from "@polyzone/runtime/src/util";
import { MeshAssetData } from "@lib/project/data/AssetData";
import { ReportProblemFn, ScannerContext } from "../../ProblemScanner";
import { IComponentScanner } from "./IComponentScanner";

export const MeshComponentScanner: IComponentScanner = {
  scan: function (component: ComponentDefinition, reportProblem: ReportProblemFn, { assetDb }: ScannerContext): void {
    const componentPath = [`Mesh component (id='${component.id}')`];

    if (component.type === ComponentDefinitionType.Mesh) {
      if (isDefined(component.meshFileId)) {
        const asset = assetDb.findById(component.meshFileId);

        if (asset === undefined) {
          reportProblem(
            `MeshComponent/ReferencedAssetDoesNotExist/id=${component.meshFileId}`,
            componentPath,
            `Referencing asset that does not exist (asset id='${component.meshFileId}')`,
          );
        } else if (!(asset instanceof MeshAssetData)) {
          reportProblem(
            `MeshComponent/ReferencedAssetIsWrongType/id=${component.meshFileId}`,
            componentPath,
            `Referencing asset (with id='${component.meshFileId}') that is not a mesh asset (actual type='${asset.type}')`,
          );
        }
      }
    }
  },
};

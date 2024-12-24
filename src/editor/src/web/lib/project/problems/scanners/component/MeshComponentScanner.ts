import { ComponentDefinition, ComponentDefinitionType } from "@fantasy-console/runtime/src/cartridge";
import { ReportProblemFn, ScannerContext } from "../../ProblemScanner";
import { IComponentScanner } from "./IComponentScanner";
import { MeshAssetData } from "@lib/project/data/AssetData";

export const MeshComponentScanner: IComponentScanner = {
  scan: function (component: ComponentDefinition, reportProblem: ReportProblemFn, { assetDb }: ScannerContext): void {
    const componentPath = [`Mesh component (id='${component.id}')`];

    if (component.type === ComponentDefinitionType.Mesh) {
      if (component.meshFileId !== undefined) {
        const asset = assetDb.assets.find((asset) => asset.id === component.meshFileId);

        if (asset === undefined) {
          reportProblem(
            `MeshComponent/ReferencedAssetDoesNotExist/id=${component.meshFileId}`,
            componentPath,
            `Referencing asset that does not exist (asset id='${component.meshFileId}')`
          );
        } else if (!(asset instanceof MeshAssetData)) {
          reportProblem(
            `MeshComponent/ReferencedAssetIsWrongType/id=${component.meshFileId}`,
            componentPath,
            `Referencing asset (with id='${component.meshFileId}') that is not a mesh asset (actual type='${asset.type}')`
          );
        }
      }
    }
  }
}

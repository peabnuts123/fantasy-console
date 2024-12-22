import { makeAutoObservable } from "mobx";
import { v4 as uuid } from 'uuid';

import { ComponentDefinitionType, MeshComponentDefinition, type ComponentDefinition } from "@fantasy-console/runtime/src/cartridge";

import type { MeshComponent } from "@lib/composer/scene/components";
import type { MeshAssetData } from "@lib/project/data/AssetData";
import type { IComposerComponentData } from "./IComposerComponentData";

export class MeshComponentData implements IComposerComponentData {
  public readonly id: string;
  /** {@link MeshAssetData} containing the mesh asset. */
  public meshAsset?: MeshAssetData;

  public componentInstance: MeshComponent | undefined = undefined;

  public constructor(id: string, meshAsset: MeshAssetData | undefined) {
    this.id = id;
    this.meshAsset = meshAsset;

    makeAutoObservable(this);
  }

  public toComponentDefinition(): ComponentDefinition {
    return {
      id: this.id,
      type: ComponentDefinitionType.Mesh,
      meshFileId: this.meshAsset?.id ?? null,
    } satisfies MeshComponentDefinition as MeshComponentDefinition;
  }

  public static createDefault(): MeshComponentData {
    return new MeshComponentData(
      uuid(),
      undefined,
    );
  }

  get componentName(): string {
    return `Mesh`;
  }
}

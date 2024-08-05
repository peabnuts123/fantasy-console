import { AssetType } from "./AssetType";

export interface AssetDefinition {
  type: AssetType;
  id: string;
  path: string;
  hash: string;
}

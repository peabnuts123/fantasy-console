/**
 * Raw reference to an asset.
 * i.e. A pointer to a file, before being loaded by the engine.
 */
export interface AssetDefinition {
  id: string;
  path: string;
}

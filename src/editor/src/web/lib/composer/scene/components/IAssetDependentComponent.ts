export interface IAssetDependentComponent {
  get assetDependencyIds(): string[];
}

export function isAssetDependentComponent(object: object | undefined): object is IAssetDependentComponent {
  return typeof object === 'object' && 'assetDependencyIds' in object;
}

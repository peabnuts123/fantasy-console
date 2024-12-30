export function isDefined<T>(property: T | undefined | null): property is T {
  return property !== undefined && property !== null;
}

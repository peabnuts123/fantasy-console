export interface IMutation<TMutationArgs> {
  get description(): string;
  apply(args: TMutationArgs): void;
  undo(_args: TMutationArgs): void;
}

import { IMutation } from "./IMutation";

export interface IContinuousMutation<TMutationArgs, TUpdateArgs> extends IMutation<TMutationArgs> {
  get hasBeenApplied(): boolean;
  set hasBeenApplied(value: boolean);

  begin(args: TMutationArgs): void;
  update(args: TMutationArgs, updateArgs: TUpdateArgs): void;
}

export function isContinuousMutation<TMutationArgs>(mutation: IMutation<TMutationArgs> | undefined): mutation is IContinuousMutation<TMutationArgs, unknown> {
  return mutation !== undefined && 'begin' in mutation && 'update' in mutation && 'hasBeenApplied' in mutation;
}
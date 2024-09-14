import { IMutation } from "./IMutation";

export interface IContinuousMutation<TMutationArgs, TUpdateArgs> extends IMutation<TMutationArgs> {
  begin(args: TMutationArgs): void;
  update(args: TMutationArgs, updateArgs: TUpdateArgs): void;
}

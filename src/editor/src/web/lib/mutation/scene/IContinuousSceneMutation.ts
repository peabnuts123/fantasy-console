import { IContinuousMutation } from "../IContinuousMutation";
import { ISceneMutation, SceneMutationArguments } from "./ISceneMutation";

export interface IContinuousSceneMutation<TUpdateArgs> extends ISceneMutation, IContinuousMutation<SceneMutationArguments, TUpdateArgs> {
}
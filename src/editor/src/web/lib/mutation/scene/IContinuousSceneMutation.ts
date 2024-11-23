import { IContinuousMutation } from "../IContinuousMutation";
import { ISceneMutation } from "./ISceneMutation";
import { SceneViewMutationArguments } from "./SceneViewMutationArguments";

export interface IContinuousSceneMutation<TUpdateArgs> extends ISceneMutation, IContinuousMutation<SceneViewMutationArguments, TUpdateArgs> {
}

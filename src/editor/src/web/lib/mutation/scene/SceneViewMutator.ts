import { ProjectController } from "@lib/project/ProjectController";
import { SceneViewController } from "@lib/composer/scene";
import { ISceneMutation } from "./ISceneMutation";
import { IContinuousSceneMutation } from "./IContinuousSceneMutation";
import { runInAction } from "mobx";
import { GameObjectConfigComposer } from "@lib/composer/config";
import { isContinuousMutation } from "../IContinuousMutation";

type Constructor<T> = new (...args: any[]) => T;
type AnyContinuousSceneMutation = IContinuousSceneMutation<any>;

class CurrentDebounceState {
  public readonly typeCtor: Constructor<AnyContinuousSceneMutation>;
  public readonly mutationTarget: GameObjectConfigComposer;
  public readonly mutation: AnyContinuousSceneMutation;
  /**
   * The function that is called after the debounce expires.
   * Automatically clears the timeout if you call this function manually,
   * if the value in `timeoutKey` has been defined
   */
  public readonly onDebounceExpire: () => void;
  public timeoutKey: number;

  public constructor(
    typeCtor: Constructor<AnyContinuousSceneMutation>,
    mutationTarget: GameObjectConfigComposer,
    mutation: AnyContinuousSceneMutation,
    onDebounceExpire: () => void,
  ) {
    this.typeCtor = typeCtor;
    this.mutationTarget = mutationTarget;
    this.mutation = mutation;
    // @NOTE wrap `onDebounceExpire` in a function that
    // clears the timeout (if it has not already fired)
    this.onDebounceExpire = () => {
      // console.log(`[CurrentDebounceState] (onDebounceExpire) Debounce expiring.`);
      window.clearTimeout(this.timeoutKey);
      onDebounceExpire();
    }
    this.timeoutKey = undefined!;
  }

  public isSameDebounceAction(
    typeCtor: Constructor<AnyContinuousSceneMutation>,
    mutationTarget: GameObjectConfigComposer,
  ) {
    return this.typeCtor === typeCtor && this.mutationTarget === mutationTarget;
  }
}

export class SceneViewMutator {
  private readonly sceneView: SceneViewController;
  private readonly projectController: ProjectController;
  private readonly mutationStack: ISceneMutation[];

  // State
  private currentDebounceState?: CurrentDebounceState = undefined;

  public constructor(sceneView: SceneViewController, projectController: ProjectController) {
    this.sceneView = sceneView;
    this.projectController = projectController;
    this.mutationStack = [];
  }

  public beginContinuous<TMutation extends AnyContinuousSceneMutation>(continuousMutation: TMutation): void {
    if (this.currentDebounceState !== undefined) {
      // If there is a lingering debounce mutation, apply it immediately
      // console.log(`[SceneViewMutator] (beginContinuous) Applying lingering debounced mutation`);
      this.currentDebounceState.onDebounceExpire();
    }

    // Validate previous mutation has been applied successfully
    if (
      isContinuousMutation(this.latestMutation) &&
      !this.latestMutation.hasBeenApplied
    ) {
      // Tried to call begin on a new mutation before applying the previous (continuous) mutation
      throw new Error(`Cannot begin continuous mutation - Previous continuous mutation has not been applied`);
    }

    // Push new mutation (not yet applied) and call `begin()`
    this.mutationStack.push(continuousMutation);
    runInAction(() => {
      continuousMutation.begin(this.getMutationArgs());
    });
  }

  public updateContinuous<TMutation extends AnyContinuousSceneMutation>(continuousMutation: TMutation, updateArgs: TMutation extends IContinuousSceneMutation<infer TUpdateArgs> ? TUpdateArgs : never): void {
    // Validate
    if (this.latestMutation !== continuousMutation) {
      throw new Error(`Cannot update continuous mutation - provided instance is not the latest mutation`);
    }

    runInAction(() => {
      continuousMutation.update(this.getMutationArgs(), updateArgs);
    });
  }

  /**
   * Apply a continuous mutation instantly. Equivalent to calling `beginContinuous()` followed by `updateContinuous` and then `apply()`
   */
  public applyInstantly<TMutation extends AnyContinuousSceneMutation>(continuousMutation: TMutation, updateArgs: TMutation extends IContinuousSceneMutation<infer TUpdateArgs> ? TUpdateArgs : never): void {
    this.beginContinuous(continuousMutation);
    this.updateContinuous(continuousMutation, updateArgs);
    this.apply(continuousMutation);
  }

  public apply(mutation: ISceneMutation): void {
    if (this.currentDebounceState !== undefined) {
      // If there is a lingering debounce mutation, apply it immediately
      // console.log(`[SceneViewMutator] (apply) Applying lingering debounced mutation`);
      this.currentDebounceState.onDebounceExpire();
    }

    // @NOTE Oosh. I'm sorry, this logic got real complicated !!
    if (mutation !== this.latestMutation) {
      // Applying a new mutation
      if (isContinuousMutation(mutation)) {
        // Expect when `mutation` is continuous to always == `latestMutation` as continuous mutations are pushed to the stack in `beginContinuous()`
        throw new Error(`Cannot apply continuous mutation - It is not the latest mutation, did you call 'beginContinuous()'?`);
      } else if (
        isContinuousMutation(this.latestMutation) &&
        !this.latestMutation.hasBeenApplied
      ) {
        // Tried to call apply on a new mutation before applying the previous (continuous) mutation
        throw new Error(`Cannot apply mutation - Previous continuous mutation has not been applied`);
      } else {
        // New, non-continuous mutation, and previous mutation was either non-continuous, or has been applied
        // console.log(`[SceneViewMutator] (apply) New instant mutation`);
        this.mutationStack.push(mutation);
      }
    } else {
      // `mutation` is the same as `latestMutation`
      // This should only be the case for continuous mutations that are being applied
      if (!isContinuousMutation(mutation)) {
        throw new Error(`Cannot apply mutation - It has already been applied`);
      } else if (mutation.hasBeenApplied) {
        throw new Error(`Cannot apply continuous mutation - It has already been applied`);
      } else {
        // Continuous mutation that has not yet been applied
        // console.log(`[SceneViewMutator] (apply) Applying continuous mutation`);
        mutation.hasBeenApplied = true;
      }
    }

    // Apply mutation
    runInAction(() => {
      mutation.apply(this.getMutationArgs());
    });

    // @TODO @DEBUG REMOVE
    console.log(`Mutation stack: `, this.mutationStack.map((mutation) => mutation.description));
  }

  public undo(): void {
    if (this.mutationStack.length === 0) {
      return; // Stack is empty
    }

    // Undo mutation
    const mutation = this.mutationStack[this.mutationStack.length - 1];
    mutation.undo(this.getMutationArgs());

    // Only remove from stack if undo was successful
    this.mutationStack.pop();
  }

  /**
   * Debounce repeated calls to a continuous mutation. The first time this is called, `begin()` will be called
   * on the mutation. Every time this function is called, `update()` will be called (including the first time).
   * After a debounce period has elapsed wherein no further calls to this function are made, `apply()` will be called
   * on the mutation.
   * If this function is called for a different target, or with a different mutation type, the previous debounced mutation (if any)
   * will be immediately applied.
   * @param typeCtor Reference to type/class of the this mutation, for uniquely identifying different mutation operations
   * @param mutationTarget The game object being mutated, for uniquely identifying different mutation operations
   * @param createMutation A function that creates a new instance of the mutation
   * @param getUpdateArgs A function that creates an object containing the updateArgs for calling `update()` on the Mutation
   * @param timeoutMs The debounce window length, in milliseconds. Defaults to 500ms.
   */
  public debounceContinuous<TMutation extends AnyContinuousSceneMutation>(
    typeCtor: Constructor<TMutation>,
    mutationTarget: GameObjectConfigComposer,
    createMutation: () => TMutation,
    getUpdateArgs: () => TMutation extends IContinuousSceneMutation<infer TUpdateArgs> ? TUpdateArgs : never,
    timeoutMs: number = 500,
  ): void {
    if (this.currentDebounceState === undefined) {
      // Start a new debounced action
      // console.log(`[SceneViewMutator] (debounceContinuous) Creating NEW debounced action`);
      const mutation = createMutation();
      this.beginContinuous(mutation);
      // Invoke update() on mutation once
      const updateArgs = getUpdateArgs();
      this.updateContinuous(mutation, updateArgs);

      // Record current debounce state
      const debounceState = this.currentDebounceState = new CurrentDebounceState(
        typeCtor,
        mutationTarget,
        mutation,
        () => {
          // On debounce expire
          this.currentDebounceState = undefined;
          this.apply(mutation);
        },
      );

      // Create debounce and store timeout key for resetting the debounce
      debounceState.timeoutKey = window.setTimeout(() => debounceState.onDebounceExpire(), timeoutMs)
    } else {
      // Prior debounce state exists
      if (this.currentDebounceState.isSameDebounceAction(typeCtor, mutationTarget)) {
        // This is an update for the same debounced action
        // console.log(`[SceneViewMutator] (debounceContinuous) Updating EXISTING debounced action`);
        // Invoke update() on mutation
        const updateArgs = getUpdateArgs();
        this.updateContinuous(this.currentDebounceState.mutation, updateArgs);
        // Clear previous timeout (debounce)
        window.clearTimeout(this.currentDebounceState.timeoutKey);
        // Create new debounce and store timeout key for resetting the debounce
        this.currentDebounceState.timeoutKey = window.setTimeout(() => this.currentDebounceState!.onDebounceExpire(), timeoutMs)
      } else {
        // This is a new debounced action, apply the previous action first
        // console.log(`[SceneViewMutator] (debounceContinuous) Applying lingering debounced mutation`);
        // Apply and expire the previous debounce action immediately
        this.currentDebounceState.onDebounceExpire();

        // Re-invoke this method now that current debounce state has been cleared
        this.debounceContinuous(
          typeCtor,
          mutationTarget,
          createMutation,
          getUpdateArgs,
          timeoutMs,
        );
      }
    }
  }


  private getMutationArgs() {
    return {
      SceneViewController: this.sceneView,
      ProjectController: this.projectController,
    };
  }

  private get latestMutation(): ISceneMutation | undefined {
    if (this.mutationStack.length === 0) {
      return undefined;
    } else {
      return this.mutationStack[this.mutationStack.length - 1];
    }
  }
}

import { IModule } from './IModule';

export enum InputButton {
  'L1' = 'L1',
  'L2' = 'L2',
  'L3' = 'L3',
  'R1' = 'R1',
  'R2' = 'R2',
  'R3' = 'R3',
  'Up' = 'Up',
  'Down' = 'Down',
  'Left' = 'Left',
  'Right' = 'Right',
  'A' = 'A',
  'B' = 'B',
  'X' = 'X',
  'Y' = 'Y',
  'Start' = 'Start',
  'Select' = 'Select',
}

export enum InputAxis {
  Left = 'Left',
  Right = 'Right',
}


export interface NativeInputManager {
  /**
   * Test whether `button` is currently pressed.
   * @param button The button to test
   */
  isButtonPressed(button: InputButton): boolean;
}

type InputState = Record<InputButton, boolean>;

class InputModule implements IModule {
  private manager!: NativeInputManager;
  private currentInputState: InputState | undefined;
  private lastFrameInputState: InputState | undefined;

  public onInit(): void {
    this.currentInputState = undefined;
    this.lastFrameInputState = undefined;
  }

  public onUpdate(_deltaTime: number): void {
    this.lastFrameInputState = this.currentInputState;
    this.currentInputState = this.getCurrentKeyboardState();
  }

  /**
   * Test whether `button` was pressed in the most recent frame.
   * @param button The button to test
   */
  public wasButtonPressed(button: InputButton): boolean {
    if (this.currentInputState === undefined || this.lastFrameInputState === undefined) {
      // Not recorded enough data yet (need 2 frames)
      return false;
    }

    // True if (and only if) the button was not pressed last frame but is pressed this frame
    return this.currentInputState[button] === true && this.lastFrameInputState[button] === false;
  }

  /**
   * Test whether `button` was released in the most recent frame.
   * @param button The button to test
   */
  public wasButtonReleased(button: InputButton): boolean {
    if (this.currentInputState === undefined || this.lastFrameInputState === undefined) {
      // Not recorded enough data yet (need 2 frames)
      return false;
    }

    // True if (and only if) the button was pressed last frame but is not pressed this frame
    return this.currentInputState[button] === false && this.lastFrameInputState[button] === true;
  }

  public isButtonPressed(button: InputButton): boolean {
    return this.manager.isButtonPressed(button);
  }

  private getCurrentKeyboardState(): InputState {
    // @NOTE mild type laundering
    const state = {} as InputState;
    for (let inputButton of Object.values(InputButton)) {
      state[inputButton] = this.isButtonPressed(inputButton);
    }
    return state;
  }

  /**
   * @internal
   */
  public init(manager: NativeInputManager) {
    this.manager = manager;
  }

  /**
   * @internal
   */
  public dispose() {
    this.manager = undefined!;
  }
}

export const Input = new InputModule();

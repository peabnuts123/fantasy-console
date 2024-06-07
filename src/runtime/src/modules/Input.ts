import { DeviceType } from "@babylonjs/core/DeviceInput/InputDevices/deviceEnums";
import { DeviceSourceManager } from "@babylonjs/core/DeviceInput/InputDevices/deviceSourceManager";
import { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';

import { Module } from './Module';

enum KeyCodes {
  'Tilde' = 192,
  'W' = 87,
  'A' = 65,
  'S' = 83,
  'D' = 68,
  'ArrowUp' = 38,
  'ArrowLeft' = 37,
  'ArrowRight' = 39,
  'ArrowDown' = 40,
}

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

const InputButtonToKeyCode: Record<InputButton, KeyCodes> = {
  [InputButton['Up']]: KeyCodes.W,
  [InputButton['Left']]: KeyCodes.A,
  [InputButton['Down']]: KeyCodes.S,
  [InputButton['Right']]: KeyCodes.D,
  [InputButton['L1']]: KeyCodes['Tilde'],
  [InputButton['L2']]: KeyCodes['Tilde'],
  [InputButton['L3']]: KeyCodes['Tilde'],
  [InputButton['R1']]: KeyCodes['Tilde'],
  [InputButton['R2']]: KeyCodes['Tilde'],
  [InputButton['R3']]: KeyCodes['Tilde'],
  [InputButton['A']]: KeyCodes['Tilde'],
  [InputButton['B']]: KeyCodes['Tilde'],
  [InputButton['X']]: KeyCodes['Tilde'],
  [InputButton['Y']]: KeyCodes['Tilde'],
  [InputButton['Start']]: KeyCodes['Tilde'],
  [InputButton['Select']]: KeyCodes['Tilde'],
}

type KeyboardState = Record<InputButton, boolean>;

export enum InputAxis {
  Left = 'Left',
  Right = 'Right',
}

const INPUT_THRESHOLD = 0.95;

class InputModule extends Module {
  private manager!: DeviceSourceManager;
  private currentKeyboardState: KeyboardState | undefined;
  private lastFrameKeyboardState: KeyboardState | undefined;

  override onUpdate(_deltaTime: number): void {
    this.lastFrameKeyboardState = this.currentKeyboardState;
    this.currentKeyboardState = this.getCurrentKeyboardState();
  }

  /**
   * Test whether `button` was pressed in the most recent frame.
   * @param button The button to test
   */
  public wasButtonPressed(button: InputButton): boolean {
    if (this.currentKeyboardState === undefined || this.lastFrameKeyboardState === undefined) {
      // Not recorded enough data yet (need 2 frames)
      return false;
    }

    // True if (and only if) the button was not pressed last frame but is pressed this frame
    return this.currentKeyboardState[button] === true && this.lastFrameKeyboardState[button] === false;
  }

  /**
   * Test whether `button` was released in the most recent frame.
   * @param button The button to test
   */
  public wasButtonReleased(button: InputButton): boolean {
    if (this.currentKeyboardState === undefined || this.lastFrameKeyboardState === undefined) {
      // Not recorded enough data yet (need 2 frames)
      return false;
    }

    // True if (and only if) the button was pressed last frame but is not pressed this frame
    return this.currentKeyboardState[button] === false && this.lastFrameKeyboardState[button] === true;
  }


  /**
   * Test whether `button` is currently pressed.
   * @param button The button to test
   */
  public isButtonPressed(button: InputButton): boolean {
    let keyboard = this.manager.getDeviceSource(DeviceType.Keyboard);
    if (keyboard) {
      let input = keyboard.getInput(InputButtonToKeyCode[button]);
      return input > INPUT_THRESHOLD;
    }

    return false;
  }

  private getCurrentKeyboardState(): KeyboardState {
    // @NOTE mild type laundering
    const state = {} as KeyboardState;
    for (let inputButton of Object.values(InputButton)) {
      state[inputButton] = this.isButtonPressed(inputButton);
    }
    return state;
  }

  /**
   * @internal
   */
  public init(engine: AbstractEngine) {
    this.manager = new DeviceSourceManager(engine);
  }
}

export const Input = new InputModule();

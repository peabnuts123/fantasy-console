import { DeviceType } from "@babylonjs/core/DeviceInput/InputDevices/deviceEnums";
import { DeviceSourceManager } from "@babylonjs/core/DeviceInput/InputDevices/deviceSourceManager";
import { Engine } from "@babylonjs/core/Engines/engine";

import { InputButton, NativeInputManager } from '@fantasy-console/core/src/modules/Input'

// @NOTE Find keycodes here: https://www.babylonjs-playground.com/#CIBK2P
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
  'Space' = 32,
  'LShift' = 16,
  'Enter' = 13,
  'Escape' = 27,
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
  [InputButton['A']]: KeyCodes.Space,
  [InputButton['B']]: KeyCodes['Tilde'],
  [InputButton['X']]: KeyCodes['Tilde'],
  [InputButton['Y']]: KeyCodes['Tilde'],
  [InputButton['Start']]: KeyCodes.Escape,
  [InputButton['Select']]: KeyCodes['Tilde'],
}


const INPUT_THRESHOLD = 0.95;

export class BabylonInputManager implements NativeInputManager {
  private manager: DeviceSourceManager;

  public constructor(engine: Engine) {
    this.manager = new DeviceSourceManager(engine);
    this.manager.onDeviceConnectedObservable.add((eventData) => {
      switch (eventData.deviceType) {
        case DeviceType.Generic:
          console.log(`Device connected: "Generic"`, eventData);
          break;
        case DeviceType.Keyboard:
          console.log(`Device connected: "Keyboard"`, eventData);
          break;
        case DeviceType.Mouse:
          console.log(`Device connected: "Mouse"`, eventData);
          break;
        case DeviceType.Touch:
          console.log(`Device connected: "Touch"`, eventData);
          break;
        case DeviceType.DualShock:
          console.log(`Device connected: "DualShock"`, eventData);
          break;
        case DeviceType.Xbox:
          console.log(`Device connected: "Xbox"`, eventData);
          break;
        case DeviceType.Switch:
          console.log(`Device connected: "Switch"`, eventData);
          break;
        case DeviceType.DualSense:
          console.log(`Device connected: "DualSense"`, eventData);
          break;
        default:
          console.error(`Unknown device type: ${(eventData as any).deviceType}`)
      }
    });
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
}

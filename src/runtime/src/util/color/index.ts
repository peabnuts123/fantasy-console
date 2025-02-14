import { Color3 as Color3Babylon, Color4 as Color4Babylon } from '@babylonjs/core/Maths/math.color';
import { IColor3Like, IColor4Like } from '@babylonjs/core/Maths/math.like';
import { Color3 as Color3Core, Color4 as Color4Core } from '@polyzone/core/src/util';
import { ColorDefinition } from '../../cartridge/archive/util'

export * from './WrappedColor3Babylon';

export function toColor3Core(color: IColor3Like): Color3Core {
  // Convert from Babylon [0..1] domain to typical [0..255] domain
  let factor = 1;
  if (color instanceof Color3Babylon || color instanceof Color4Babylon) {
    factor = 255;
  }
  return new Color3Core(color.r * factor, color.g * factor, color.b * factor);
}

export function toColor4Core(color: IColor4Like): Color4Core {
  // Convert from Babylon [0..1] domain to typical [0..255] domain
  let factor = 1;
  if (color instanceof Color4Babylon) {
    factor = 255;
  }
  return new Color4Core(color.r * factor, color.g * factor, color.b * factor, color.a * factor);
}

export function toColor3Babylon(color: IColor3Like): Color3Babylon {
  // Convert from typical [0..255] domain to Babylon [0..1] domain
  let factor = 255;
  if (color instanceof Color3Babylon || color instanceof Color4Babylon) {
    factor = 1;
  }

  return new Color3Babylon(
    color.r / factor,
    color.g / factor,
    color.b / factor,
  );
}

export function toColor4Babylon(color: IColor4Like): Color4Babylon {
  // Convert from typical [0..255] domain to Babylon [0..1] domain
  let factor = 255;
  if (color instanceof Color3Babylon || color instanceof Color4Babylon) {
    factor = 1;
  }

  return new Color4Babylon(
    color.r / factor,
    color.g / factor,
    color.b / factor,
    1
  );
}

export function toColor3Definition(color: IColor3Like): ColorDefinition {
  // Convert from Babylon [0..1] domain to typical [0..255] domain
  let factor = 1;
  if (color instanceof Color3Babylon || color instanceof Color4Babylon) {
    factor = 255;
  }

  return {
    r: color.r * factor,
    g: color.g * factor,
    b: color.b * factor,
  };
}

// @TODO Color4Definition

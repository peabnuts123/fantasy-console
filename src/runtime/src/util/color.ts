import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { IColor3Like } from '@babylonjs/core/Maths/math.like';
import { ColorDefinition } from '../cartridge/archive/util'


export function toColor3Babylon(color: IColor3Like): Color3 {
  return new Color3(
    color.r,
    color.g,
    color.b,
  );
}

export function toColor4Babylon(color: IColor3Like): Color4 {
  return new Color4(
    color.r,
    color.g,
    color.b,
    1
  );
}

export function toColor3Definition(color: IColor3Like): ColorDefinition {
  return {
    r: color.r,
    g: color.g,
    b: color.b,
  };
}
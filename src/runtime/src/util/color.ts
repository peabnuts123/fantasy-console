import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { IColor3Like } from '@babylonjs/core/Maths/math.like';
import { Color as Color3Archive } from '../cartridge/archive/util'


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

export function toColor3Archive(color: IColor3Like): Color3Archive {
  return {
    r: color.r,
    g: color.g,
    b: color.b,
  };
}
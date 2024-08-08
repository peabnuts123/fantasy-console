import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";

/* @TODO these probably need better names */

export interface Color {
  r: number;
  g: number;
  b: number;
}

export function toColor3(color: Color): Color3 {
  return new Color3(
    color.r,
    color.g,
    color.b,
  )
}

export function toColor4(color: Color): Color4 {
  return new Color4(
    color.r,
    color.g,
    color.b,
    1
  )
}
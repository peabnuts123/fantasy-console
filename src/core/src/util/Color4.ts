import { Color3 } from "./Color3";

export class Color4 {
  public r: number;
  public g: number;
  public b: number;
  public a: number;

  public constructor(color: Color3, a?: number);
  public constructor(r: number, g: number, b: number, a?: number);
  public constructor(redOrColor: number | Color3, greenOrAlpha?: number, blue?: number, alpha?: number) {
    let r: number, g: number, b: number, a: number;
    if (redOrColor instanceof Color3) {
      r = redOrColor.r;
      g = redOrColor.g;
      b = redOrColor.b;
      a = greenOrAlpha ?? 0xFF;
    } else {
      r = redOrColor;
      g = greenOrAlpha!;
      b = blue!;
      a = alpha ?? 0xFF;
    }

    // Validate
    if (r < 0 || r > 0xFF) throw new Error(`Cannot create Color4. 'r' must be between 0 and 255`);
    if (g < 0 || g > 0xFF) throw new Error(`Cannot create Color4. 'g' must be between 0 and 255`);
    if (b < 0 || b > 0xFF) throw new Error(`Cannot create Color4. 'b' must be between 0 and 255`);
    if (a < 0 || a > 0xFF) throw new Error(`Cannot create Color4. 'a' must be between 0 and 255`);

    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }


  public withR(value: number): Color4 {
    return new Color4(value, this.g, this.b);
  }

  public withG(value: number): Color4 {
    return new Color4(this.r, value, this.b);
  }

  public withB(value: number): Color4 {
    return new Color4(this.r, this.g, value);
  }

  public withA(value: number): Color4 {
    return new Color4(this.r, this.g, this.b, value);
  }

  public static white(): Color4 { return new Color4(0xFF, 0xFF, 0xFF); }
  public static black(): Color4 { return new Color4(0, 0, 0); }
  public static red(): Color4 { return new Color4(0xFF, 0, 0); }
  public static green(): Color4 { return new Color4(0, 0xFF, 0); }
  public static blue(): Color4 { return new Color4(0, 0, 0xFF); }
  public static yellow(): Color4 { return new Color4(0xFF, 0xFF, 0); }
  public static fuchsia(): Color4 { return new Color4(0xFF, 0, 0xFF); }
  public static cyan(): Color4 { return new Color4(0, 0xFF, 0xFF); }
}

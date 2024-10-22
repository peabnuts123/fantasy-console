import { Color4 } from "./Color4";

export class Color3 {
  private _r: number;
  private _g: number;
  private _b: number;

  public constructor(r: number, g: number, b: number) {
    // Validate
    if (r < 0 || r > 0xFF) throw new Error(`Cannot create Color3. 'r' must be between 0 and 255`);
    if (g < 0 || g > 0xFF) throw new Error(`Cannot create Color3. 'g' must be between 0 and 255`);
    if (b < 0 || b > 0xFF) throw new Error(`Cannot create Color3. 'b' must be between 0 and 255`);

    this._r = r;
    this._g = g;
    this._b = b;
  }

  public withR(value: number): Color3 {
    return new Color3(value, this.g, this.b);
  }

  public withG(value: number): Color3 {
    return new Color3(this.r, value, this.b);
  }

  public withB(value: number): Color3 {
    return new Color3(this.r, this.g, value);
  }

  public toColor4(alpha: number = 0xFF): Color4 {
    return new Color4(this, alpha);
  }

  public get r(): number { return this._r; }
  public set r(value: number) { this._r = value; }

  public get g(): number { return this._g; }
  public set g(value: number) { this._g = value; }

  public get b(): number { return this._b; }
  public set b(value: number) { this._b = value; }

  public static white(): Color3 { return new Color3(0xFF, 0xFF, 0xFF); }
  public static black(): Color3 { return new Color3(0, 0, 0); }
  public static red(): Color3 { return new Color3(0xFF, 0, 0); }
  public static green(): Color3 { return new Color3(0, 0xFF, 0); }
  public static blue(): Color3 { return new Color3(0, 0, 0xFF); }
  public static yellow(): Color3 { return new Color3(0xFF, 0xFF, 0); }
  public static fuchsia(): Color3 { return new Color3(0xFF, 0, 0xFF); }
  public static cyan(): Color3 { return new Color3(0, 0xFF, 0xFF); }
}

import { Color3 as Color3Babylon } from "@babylonjs/core/Maths/math.color";
import { Color3 as Color3Core } from "@fantasy-console/core/src/util";


/**
* A Color3 that is implemented around wrapping a Babylon Color3 internally.
*/
export class WrappedColor3Babylon extends Color3Core {
  /**
   * A function that can access the color that is being wrapped.
   */
  private readonly getValue: () => Color3Babylon;
  /**
   * A function that can set the value of the color being wrapped.
   */
  private readonly _setValue: (value: Color3Babylon) => void;

  public constructor(getValue: () => Color3Babylon, setValue: (value: Color3Babylon) => void) {
    const color = getValue();
    super(color.r, color.g, color.b);
    this.getValue = getValue;
    this._setValue = setValue;
  }

  public override get r(): number { return this.getValue().r; }
  public override set r(value: number) {
    super.r = value;
    this._setValue(new Color3Babylon(super.r, super.g, super.b));
  }

  public override get g(): number { return this.getValue().g; }
  public override set g(value: number) {
    super.g = value;
    this._setValue(new Color3Babylon(super.r, super.g, super.b));
  }

  public override get b(): number { return this.getValue().b; }
  public override set b(value: number) {
    super.b = value;
    this._setValue(new Color3Babylon(super.r, super.g, super.b));
  }

  public setValue(value: Color3Babylon): void {
    super.r = value.r;
    super.g = value.g;
    super.b = value.b;
    this._setValue(value);
  }

  public toString(): string {
    return `[${this.r}, ${this.g}, ${this.b}]`;
  }

  // @TODO We should probably stop relying on `super.r/y/z`
  // being the same as the underlying value
  // If we could just issue partial updates or always
  // reference the underlying value instead then we wouldn't
  // have to initialise + would prevent a category of bugs
  public initialise(value: Color3Babylon | undefined = undefined) {
    value ??= this.getValue().clone();
    this.setValue(value);
  }
}
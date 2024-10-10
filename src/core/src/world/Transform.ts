import type { Vector3 } from "../util/Vector3";
import type { GameObject } from "./GameObject";

export abstract class Transform {
  /* Position */
  public abstract get position(): Vector3;
  public abstract set position(value: Vector3);
  public abstract get localPosition(): Vector3;
  public abstract set localPosition(value: Vector3);

  /* Rotation */
  public abstract get rotation(): Vector3;
  public abstract set rotation(value: Vector3);
  public abstract get localRotation(): Vector3;
  public abstract set localRotation(value: Vector3);

  /* Scale */
  public abstract get scale(): Vector3;
  public abstract set scale(value: Vector3);
  public abstract get localScale(): Vector3;
  public abstract set localScale(value: Vector3);

  /* Parent */
  public abstract get parent(): Transform | undefined;
  public abstract set parent(value: Transform | undefined);

  public abstract get gameObject(): GameObject;

  public abstract get children(): Transform[];

}

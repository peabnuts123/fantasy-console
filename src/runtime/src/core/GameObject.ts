import { JsEngineObject, JsVec3 } from '@fantasy-console/engine';

/* Public */
export abstract class GameObject {
  private static __newEngineObject: JsEngineObject | undefined;
  private engineObject!: JsEngineObject;

  protected constructor() {
    if (GameObject.__newEngineObject !== undefined) {
      console.log(`[RAMBOTAN] Assign engineObject`);
      this.engineObject = GameObject.__newEngineObject;
    } else {
      throw new Error(`Attempted to create new GameObject manually`)
    }
  }

  /* Public */
  public onUpdate(_deltaTime: number): void {}

  /* Public */
  protected get position(): JsVec3 {
    return this.engineObject.get_position();
  }
  protected set position(value: JsVec3) {
    this.engineObject.set_position(value);
  }

  /* Private @TODO could use type laundering to set this property if need-be */
  public static createBound(ctor: new () => GameObject, engineObject: JsEngineObject): GameObject {
    console.log(`[RAMBOTAN] createBound()`);
    // @NOTE @HACKS initialise private field engineObject through a stateful static property
    // This is so that the `engineObject` property is set by the time the constructor is finished
    // (which is especially relevant to decorators like `@inject`)
    GameObject.__newEngineObject = engineObject;
    let gameObject = new ctor();
    GameObject.__newEngineObject = undefined;

    if (!(gameObject instanceof GameObject)) {
      throw new Error(`Object does extend from type 'GameObject'`);
    }
    // gameObject.engineObject = engineObject;
    console.log(`[RAMBOTAN] FINISHED`);
    return gameObject;
  }
}

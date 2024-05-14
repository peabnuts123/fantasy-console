import { JsEngineObject, JsVec3 } from '@engine/fantasy_console';

export abstract class GameObject {
  private engineObject!: JsEngineObject;

  public on_update(deltaTime: number): void {
    this.onUpdate(deltaTime);
  }

  public onUpdate(_deltaTime: number): void { }

  protected get position(): JsVec3 {
    return this.engineObject.get_position();
  }
  protected set position(value: JsVec3) {
    this.engineObject.set_position(value);
  }

  public static createBound(ctor: new () => GameObject, engineObject: JsEngineObject): GameObject {
    let gameObject = new ctor();
    if (!(gameObject instanceof GameObject)) {
      throw new Error(`Object does extend from type 'GameObject'`);
    }
    gameObject.engineObject = engineObject;
    return gameObject;
  }
}

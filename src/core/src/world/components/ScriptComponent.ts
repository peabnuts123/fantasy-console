import { GameObject } from "../GameObject";
import { GameObjectComponent } from "../GameObjectComponent";

// @NOTE Pragmatic decision to not make this class `abstract`.
// It causes type errors otherwise in `src/runtime/src/Game.ts`
export class ScriptComponent extends GameObjectComponent {
  public readonly id: string;
  public readonly gameObject: GameObject;

  public constructor(id: string, gameObject: GameObject) {
    super();
    this.id = id;
    this.gameObject = gameObject;
  }
}

import { IModule } from '@fantasy-console/core/modules/IModule';
import { Input } from '@fantasy-console/core/modules/Input';

export * from './BabylonInputManager';

class Modules {
  private modules: IModule[] = [
    Input,
  ]

  public onUpdate(deltaTime: number): void {
    this.modules.forEach((module) => module.onUpdate(deltaTime));
  }
}

export default new Modules();

import { Input } from './Input';
import { Module } from './Module';

export * from './Input';
export * from './Module';

class Modules {
  private modules: Module[] = [
    Input,
  ]

  public onUpdate(deltaTime: number): void {
    this.modules.forEach((module) => module.onUpdate(deltaTime));
  }
}

export default new Modules();

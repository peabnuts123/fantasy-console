
import type { ComponentData } from './components';
import { TransformData } from './TransformData';

/**
 * Data for a GameObject i.e. a GameObject loaded from the raw cartridge file
 * but not yet loaded into the game.
 */
export class GameObjectData {
  public readonly id: string;
  public readonly name: string;
  public readonly transform: TransformData;
  public readonly components: ComponentData[];
  public readonly children: GameObjectData[];

  public constructor(id: string, name: string, transform: TransformData, components: ComponentData[], children: GameObjectData[]) {
    this.id = id;
    this.name = name;
    this.transform = transform;
    this.components = components;
    this.children = children;
  }
}
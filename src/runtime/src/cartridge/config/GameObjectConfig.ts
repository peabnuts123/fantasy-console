
import type { ComponentConfig } from './components/ComponentConfig';
import { TransformConfig } from './TransformConfig';

/**
 * Preconfigured GameObject i.e. a GameObject loaded from the raw cartridge file
 * but not yet loaded into the game.
 */
export class GameObjectConfig {
  public id: string;
  public name: string;
  public transform: TransformConfig;
  public components: ComponentConfig[];
  public children: GameObjectConfig[];

  public constructor(id: string, name: string, transform: TransformConfig, components: ComponentConfig[], children: GameObjectConfig[]) {
    this.id = id;
    this.name = name;
    this.transform = transform;
    this.components = components;
    this.children = children;
  }
}
import type { Vector3 } from '@fantasy-console/core/src/util';

import type { ComponentConfig } from './components/ComponentConfig';

export interface GameObjectTransformConfig {
  position: Vector3;
  rotation: number; // @TODO expressed as a 1D angle for now
}

/**
 * Preconfigured GameObject i.e. a GameObject loaded from the raw cartridge file
 * but not yet loaded into the game.
 */
export class GameObjectConfig {
  public readonly id: string;
  public readonly name: string;
  public readonly transform: GameObjectTransformConfig;
  public readonly components: ComponentConfig[];
  public readonly children: GameObjectConfig[];

  public constructor(id: string, name: string, transform: GameObjectTransformConfig, components: ComponentConfig[], children: GameObjectConfig[]) {
    this.id = id;
    this.name = name;
    this.transform = transform;
    this.components = components;
    this.children = children;
  }
}
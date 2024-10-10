import type { GameObjectComponent } from '@fantasy-console/core/src/world'

/**
 * Configuration data for a {@link GameObjectComponent}.
 * i.e. loaded from the raw cartridge file but not yet loaded into the game.
 */
export abstract class ComponentData {
  public readonly id: string;

  public constructor(id: string) {
    this.id = id;
  }
}
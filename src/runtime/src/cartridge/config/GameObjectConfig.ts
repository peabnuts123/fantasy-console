import type { Vector3 } from '@fantasy-console/core/util/Vector3';

import { ComponentConfig } from './components/ComponentConfig';

/**
 * Preconfigured GameObject i.e. a GameObject loaded from the raw cartridge file
 * but not yet loaded into the game. Think of it like a template (Unity's "Prefabs", Unreal's "Blueprints", Godot's "Scenes", etc.)
 */
export class GameObjectConfig {
  public name: string;
  public position: Vector3;
  public rotation: number; // @TODO expressed as a 1D angle for now
  public components: ComponentConfig[];
  public children: GameObjectConfig[];

  public constructor(name: string, position: Vector3, rotation: number, components: ComponentConfig[], children: GameObjectConfig[]) {
    this.name = name;
    this.position = position;
    this.rotation = rotation;
    this.components = components;
    this.children = children;
  }
}
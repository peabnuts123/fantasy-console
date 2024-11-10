
import { GameObjectData } from "@lib/composer/data";

export function gameObjectAt(gameObjects: GameObjectData[], index: number): string | undefined {
  if (index < 0) return undefined;
  else if (index >= gameObjects.length) return undefined;
  else {
    return gameObjects[index].id;
  }
}

export interface HierarchyObjectDragData {
  gameObject: GameObjectData;
}

export interface HierarchyObjectDropZoneData {
  gameObjectId: string;
  type: string;
}

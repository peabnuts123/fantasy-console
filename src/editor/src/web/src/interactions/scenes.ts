import type { SceneData } from "@lib/project/data";
import { useDrag, useDrop } from "@lib/util/drag-and-drop";

export interface SceneDragState {
  isDragging: boolean;
}

export interface SceneDropState {
  isDragOverTarget: boolean;
}

export interface SceneDragData {
  sceneData: SceneData;
}

const SceneDragType = `scene`;

export function useSceneDrag<TElement extends HTMLElement = HTMLDivElement>(scene: SceneData) {
  return useDrag<SceneDragData, TElement>({
    type: SceneDragType,
    data: {
      sceneData: scene,
    },
    dropEffect: 'link',
  });
}

export function useSceneDrop<TElement extends HTMLElement = HTMLDivElement>(
  onDrop: (data: SceneDragData) => void
) {
  return useDrop<SceneDragData, {}, TElement>({
    accepts: SceneDragType,
    onDrop,
  });
}

import type { FunctionComponent } from "react";
import { useEffect, useRef } from 'react';
import cn from 'classnames';

import { GameObjectData } from "@lib/project/data";
import { useDrop } from '@lib/util/drag-and-drop'
import { HierarchyObjectDragData, HierarchyObjectDropZoneData } from "./util";
import { HierarchyObjectFacade } from "./HierarchyObjectFacade";


export interface RearrangeHierarchyDragSlotProps {
  gameObject: GameObjectData;
  onDrop: (data: HierarchyObjectDragData) => void;
  type: 'after' | 'before';
  isLastTopLevelSlot?: boolean;
}
export const RearrangeHierarchyDragSlot: FunctionComponent<RearrangeHierarchyDragSlotProps> = ({ gameObject, onDrop, type: dropZoneType, isLastTopLevelSlot }) => {
  // Default prop values
  isLastTopLevelSlot ??= false;

  // Refs
  const dropZoneElement = useRef<HTMLDivElement>(null);
  const wasDropIntoThisSlot = useRef<boolean>(false);

  // Hooks
  const [{ isDragging, isDragOverThisZone: isDragOverThisTarget, dragData, currentActiveDropZoneData }, DropTarget] = useDrop({
    accepts: `SceneHierarchyObject`,
    onDrop(data: HierarchyObjectDragData) {
      onDrop(data);
      wasDropIntoThisSlot.current = true;
    },
    data: {
      gameObjectId: gameObject.id,
      type: dropZoneType,
    } satisfies HierarchyObjectDropZoneData as HierarchyObjectDropZoneData,
    onDragEnd() {
      if (dropZoneElement.current === null) return;

      const shouldAnimate = wasDropIntoThisSlot.current === false;
      if (shouldAnimate) {
        // Animate out
        const dropZoneElementCurrent = dropZoneElement.current; // @NOTE Store in closure for `setTimeout` callbacks

        // Add transition
        dropZoneElementCurrent.classList.add('u-animate-min-height');

        setTimeout(() => {
          // Change height (1 frame later)
          dropZoneElementCurrent.style.setProperty('min-height', '0');
        });
        setTimeout(() => {
          // (After transition is complete) Remove transition
          dropZoneElementCurrent.style.removeProperty('min-height');
          dropZoneElementCurrent.classList.remove('u-animate-min-height');
        }, 300);
      } else {
        // Don't animate - hide slot immediately
        dropZoneElement.current.style.removeProperty('min-height');
      }

      // Clear out ref state
      wasDropIntoThisSlot.current = false;
    },
  });
  const { gameObject: dragSourceGameObject } = dragData || {};

  useEffect(() => {
    const inverseLerp = (value: number, min: number, max: number) => {
      return (value - min) / (max - min);
    }
    const clamp01 = (value: number): number => {
      return Math.min(Math.max(0, value), 1);
    }

    // Animate the size of the drop zones based on the distance to the mouse
    // Controlled via min-height so as to not animate
    const onMouseMove = (e: globalThis.MouseEvent) => {
      if (isLastTopLevelSlot) return;

      const HoverRangeMax = 50; /* pixels */
      const HoverRangeMin = 10; /* pixels */
      const MaxDropZoneHeight = 24; /* pixels */

      // @TODO should this consider X too lol?

      const { clientX, clientY } = e;
      if (clientX !== 0 && clientY !== 0 && dropZoneElement.current !== null) {
        const dropZoneRect = dropZoneElement.current.getBoundingClientRect();
        const rectMidpoint = (dropZoneRect.top + dropZoneRect.bottom) / 2;
        const delta = rectMidpoint - clientY;

        const absDeltaAsPercentage = 1 - clamp01(inverseLerp(Math.abs(delta), HoverRangeMin, HoverRangeMax));

        dropZoneElement.current.style.setProperty('min-height', `${MaxDropZoneHeight * absDeltaAsPercentage}px`);
      }
    };
    window.addEventListener('drag', onMouseMove);
    return () => {
      window.removeEventListener('drag', onMouseMove);
    }
  }, []);

  const isDraggingOverThisZone = isDragging && isDragOverThisTarget;

  return (
    <>
      <div
        className={cn("transition-[height] duration-200 overflow-hidden",
          { 'h-0': !isDraggingOverThisZone }, // @NOTE overridden by min-height animation
          { '!h-full': isLastTopLevelSlot }, // Expand to fill the rest of the space so that user can drop into bottom whitespace
        )}
        ref={dropZoneElement}
      >
        <div className="w-full h-full" ref={DropTarget}>
          {isDragOverThisTarget && (
            <HierarchyObjectFacade
              gameObject={dragSourceGameObject}
            />
          )}
        </div>
      </div >
    </>
  )
};

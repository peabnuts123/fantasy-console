import { RefObject, useEffect, useRef, useState } from "react";

import { DragTypeIdentifier } from "./DragTypeIdentifier";
import { DragAndDropData, useDragAndDropData } from "./data";

interface UseDragOptions<TDragData> {
  /** Type of this drag item */
  type: DragTypeIdentifier;
  /** Data associated with this drag item */
  data: TDragData;
  /** The type of cursor shown when this item is over a drop zone */
  dropEffect?: typeof DataTransfer.prototype.dropEffect;
}

interface UseDragState {
  /** Whether this item is being dragged */
  isDragging: boolean;
}

export function useDrag<TDragData, TElementType extends HTMLElement = HTMLDivElement>(options: UseDragOptions<TDragData>): [UseDragState, RefObject<TElementType | null>] {
  // Store drag and drop data in a ref so that callbacks always reference the current version
  const dragAndDropDataRef = useRef<DragAndDropData>(undefined!);
  dragAndDropDataRef.current = useDragAndDropData();
  /** Ref used to specify which element is the drag item */
  const dragItemRef = useRef<TElementType>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    const dragItem = dragItemRef.current;

    const dragStart: typeof window.ondragstart = (_e) => {
      // @NOTE Use `setTimeout()` to fix bug in drag and drop API
      // See: https://codepen.io/peabnuts123/pen/wvVYypz?editors=1111
      // See: https://github.com/react-dnd/react-dnd/issues/3649
      setTimeout(() => {
        setIsDragging(true);
        dragAndDropDataRef.current.beginDrag({ type: options.type, dragData: options.data, dropEffect: options.dropEffect });
      });
    };

    const dragEnd: typeof window.ondragend = (_) => {
      setIsDragging(false);
      dragAndDropDataRef.current.endDrag();
    };

    if (dragItem) {
      dragItem.draggable = true;
      dragItem.addEventListener('dragstart', dragStart);
      dragItem.addEventListener('dragend', dragEnd);
    }

    return () => {
      if (dragItem) {
        dragItem.draggable = false;
        dragItem.removeEventListener('dragstart', dragStart);
        dragItem.removeEventListener('dragend', dragEnd);
      }
    };
  }, [dragItemRef.current]); // Re-render effect in case dragItemRef is applied conditionally

  const dragState: UseDragState = {
    isDragging,
  };

  return [dragState, dragItemRef];
}


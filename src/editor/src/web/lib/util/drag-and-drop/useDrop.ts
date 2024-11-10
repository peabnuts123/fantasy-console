import { RefObject, useEffect, useRef } from "react";
import { DragTypeIdentifier } from "./DragTypeIdentifier";
import { useDragAndDropData } from "./data";

interface UseDropOptions<TDragData, TDropData> {
  /** Type of drag item this drop zone accepts */
  accepts: DragTypeIdentifier;
  /** Callback fired when a matching item is dropped into this drop zone */
  onDrop?: (dragData: TDragData) => void;
  /** Callback fired when a matching item enters this drop zone */
  onDragEnter?: () => void;
  /** Callback fired while a matching item is over this drop zone */
  onDragOver?: () => void;
  /** Callback fired when a matching item leaves this drop zone */
  onDragLeave?: () => void;
  /** Callback fired when a matching item begins dragging */
  onDragStart?: () => void;
  /** Callback fired when a matching item stops dragging */
  onDragEnd?: () => void;
  /** Data associated to this drop zone */
  data?: TDropData;
}

interface UseDropState<TDragData, TDropData> {
  /** Whether an item matching this drop zone is being dragged */
  isDragging: boolean;
  /** Whether a matching item is over this drop zone */
  isDragOverThisZone: boolean;
  /** Whether an item matching this drop zone is over any matching drop zone */
  isDragOverAnyZone: boolean;
  /** Data associated with the current drag */
  dragData: TDragData | undefined;
  /** Data associated with the current active drop zone */
  currentActiveDropZoneData: TDropData | undefined;
  __dropZoneId: string;
}

export function useDrop<TDragData, TDropData = never, TElementType extends HTMLElement = HTMLDivElement>(options: UseDropOptions<TDragData, TDropData>): [UseDropState<TDragData, TDropData>, RefObject<TElementType>] {
  // Store drag and drop data in a ref so that callbacks always reference the current version
  const dragAndDropDataRef = useRef<ReturnType<typeof useDragAndDropData>>(undefined!);
  dragAndDropDataRef.current = useDragAndDropData();
  /** Ref used to specify which element is the drop zone */
  const dropZoneRef = useRef<TElementType>(null);
  /** Ref used to store the ID of this drop zone */
  const dropZoneIdRef = useRef<string>(undefined!);
  /** Ref used to store the previous value of `isDragging`s */
  const _isDraggingOldValue = useRef<boolean>();
  /** Ref used to track which element is the the drag is currently over */
  const currentDragHoverTarget = useRef<EventTarget | null>(null);

  const onDrop: typeof window.ondrop = (e) => {
    if (!dragAndDropDataRef.current.isDragOfType(options.accepts)) return;

    if (options.onDrop) {
      options.onDrop(dragAndDropDataRef.current.getDragDataForType(options.accepts)!);
    }

    // @NOTE Duplicates `dragEnd`, but that may not fire if the drag item is destroyed as a result of dragEnd
    dragAndDropDataRef.current.endDrag();
  };

  const onDragEnter: typeof window.ondragenter = (e) => {
    // @NOTE Do NOT propagate `onDragEnter` to parent drop zones. This supports nested drop zones
    e.preventDefault();
    e.stopPropagation();

    // Ignore drag items of the wrong type
    if (!dragAndDropDataRef.current.isDragOfType(options.accepts)) return;

    // @NOTE Track which element the drag is currently in
    // This is kind of a crazy solution to prevent the drag from cancelling when
    // mousing over a child element of a drag
    // This works because of the order of `dragenter` and `dragleave` events
    currentDragHoverTarget.current = e.target;

    dragAndDropDataRef.current.setIsOver(options.accepts, dropZoneIdRef.current, true);

    if (options.onDragEnter) {
      options.onDragEnter();
    }
  };

  const onDragOver: typeof window.ondragover = (e) => {
    // Ignore drag items of the wrong type
    if (!dragAndDropDataRef.current.isDragOfType(options.accepts)) return;

    // @NOTE `preventDefault` in `dragOver` is used by browsers to identify drop zones
    // So ONLY prevent it if the drag is the correct type
    e.preventDefault();

    // Copy across drop effect from drag specification
    const dropEffect = dragAndDropDataRef.current.getDropEffectForType(options.accepts);
    if (dropEffect) {
      e.dataTransfer!.dropEffect = dropEffect;
    }

    if (options.onDragOver) {
      options.onDragOver();
    }
  };

  const onDragLeave: typeof window.ondragleave = (e) => {
    // @NOTE Do NOT propagate `onDragEnter` to parent drop zones. This supports nested drop zones
    e.preventDefault();
    e.stopPropagation();

    // Ignore drag items of the wrong type
    if (!dragAndDropDataRef.current.isDragOfType(options.accepts)) return;

    // @NOTE This is the magic for preventing drags from cancelling when mousing over a child element
    // Ignore `dragleave` unless it is the same as the target from `dragenter`.
    // If the user mouses over a child element, it will first fire `dragenter` which will update `currentDragHoverTarget`
    // and thus fail this check when the parent element fires `dragleave` i.e. the drag will still be marked as continuing
    if (currentDragHoverTarget.current !== e.target) return;

    // Clear the drag target if this `dragleave` was allowed to fire
    currentDragHoverTarget.current = null;

    dragAndDropDataRef.current.setIsOver(options.accepts, dropZoneIdRef.current, false);

    if (options.onDragLeave) {
      options.onDragLeave();
    }
  };

  useEffect(() => {
    const dropZone = dropZoneRef.current;
    let deregisterDropZone: Function | undefined = undefined;

    if (dropZone) {
      [dropZoneIdRef.current, deregisterDropZone] = dragAndDropDataRef.current.registerDropZone(options.accepts, options.data);

      dropZone.addEventListener('drop', onDrop);
      dropZone.addEventListener('dragenter', onDragEnter);
      dropZone.addEventListener('dragover', onDragOver);
      dropZone.addEventListener('dragleave', onDragLeave);
    }

    return () => {
      if (dropZone) {
        dropZone.removeEventListener('drop', onDrop);
        dropZone.removeEventListener('dragenter', onDragEnter);
        dropZone.removeEventListener('dragover', onDragOver);
        dropZone.removeEventListener('dragleave', onDragLeave);

        deregisterDropZone!();
      }
    }
  }, [dropZoneRef.current]);

  const dropState: UseDropState<TDragData, TDropData> = {
    isDragging: dragAndDropDataRef.current.isDragOfType(options.accepts),
    dragData: dragAndDropDataRef.current.getDragDataForType(options.accepts),
    isDragOverAnyZone: dragAndDropDataRef.current.isOverAnyDropZone(options.accepts),
    isDragOverThisZone: dragAndDropDataRef.current.isOverDropZone(options.accepts, dropZoneIdRef.current),
    currentActiveDropZoneData: dragAndDropDataRef.current.getActiveDropZoneDataForType<TDropData>(options.accepts),
    __dropZoneId: dropZoneIdRef.current,
  }

  // @NOTE Watch `dropState.isDragging` and fire `onDragStart` / `onDragEnd` when it changes
  useEffect(() => {
    // Track old value
    const oldValue = _isDraggingOldValue.current;
    _isDraggingOldValue.current = dropState.isDragging;

    // Ignore first render
    if (oldValue === undefined) return;

    if (dropState.isDragging) {
      if (options.onDragStart) {
        options.onDragStart();
      }
    } else {
      if (options.onDragEnd) {
        options.onDragEnd();
      }
    }
  }, [dropState.isDragging]);

  return [dropState, dropZoneRef];
}
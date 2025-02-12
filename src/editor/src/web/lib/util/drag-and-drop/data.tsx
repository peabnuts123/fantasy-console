/* eslint-disable react-hooks/rules-of-hooks */

import { createContext, FunctionComponent, PropsWithChildren, useContext, useState } from "react";
import { v4 as uuid } from 'uuid';

import { DragTypeIdentifier } from "./DragTypeIdentifier";

/** Data associated with current item being dragged */
interface CurrentDragData {
  /** Type of the current item being dragged */
  type: DragTypeIdentifier;
  /** Data associated with the current item being dragged */
  dragData: unknown;
  /** The type of cursor shown when the current item is over a drop zone */
  dropEffect: typeof DataTransfer.prototype.dropEffect | undefined;
}

/** Data associated with a drop zone state */
interface DropZoneState {
  /** Unique identifier of the drop zone associated with this data */
  id: string;
  /** Type of drag item the drop zone associated with this data accepts */
  type: DragTypeIdentifier;
  /** Whether the current drag is over the drop zone associated with this data */
  isOver: boolean;
  /** Associated data of the drop zone associated with this data */
  dropZoneData: unknown;
}

export type DragAndDropData = ReturnType<typeof createDragAndDropData>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createDragAndDropData() {
  // Data associated with the current drag
  const [currentDrag, setCurrentDrag] = useState<CurrentDragData | undefined>(undefined);
  // Data associated with all drop zones
  const [dropZoneStates, setDropZoneStates] = useState<Record<DragTypeIdentifier, Record<DragTypeIdentifier, DropZoneState>>>({});

  /** Remove a drop zone from the state */
  function deregisterDropZone(type: DragTypeIdentifier, dropZoneId: string): void {
    setDropZoneStates((dropZoneStates) => {
      if (dropZoneStates[type] === undefined) {
        return dropZoneStates;
      } else {
        const statesForType = { ...(dropZoneStates[type] ?? {}) };

        delete statesForType[dropZoneId];

        return {
          ...dropZoneStates,
          [type]: statesForType,
        };
      }
    });
  }

  return {
    /**
     * Mark a draggable item as being dragged
     * @param data Data associated with the current drag
     */
    beginDrag(data: CurrentDragData) {
      setCurrentDrag(data);
    },
    /**
     * Mark the current dragged item as no longer being dragged
     */
    endDrag() {
      if (currentDrag === undefined) return;
      const currentDragType = currentDrag!.type;

      // Clear out current drag data
      setCurrentDrag(undefined);
      // Reset data of all associated drop zones
      setDropZoneStates((dropZoneStates) => {
        const statesForType = dropZoneStates[currentDragType] ?? {};

        for (const dropZoneId in statesForType) {
          statesForType[dropZoneId].isOver = false;
        }

        return {
          ...dropZoneStates,
          [currentDragType]: statesForType,
        };
      });
    },
    /**
     * Set whether a matching drag item is over a drop zone
     * @param type The type of drag item associated with the drop zone
     * @param dropZoneId ID of the drop zone
     * @param isOver
     */
    setIsOver(type: DragTypeIdentifier, dropZoneId: string, isOver: boolean) {
      setDropZoneStates((dropZoneStates) => {
        if (currentDrag?.type !== type) {
          // Current drag does not match this drop zone - do not update
          return dropZoneStates;
        }

        if (
          dropZoneStates[type] &&
          dropZoneStates[type][dropZoneId] &&
          dropZoneStates[type][dropZoneId].isOver === isOver) {
          // Value has not changed - return identical reference - do not update
          return dropZoneStates;
        }

        const oldValue = dropZoneStates[type][dropZoneId];

        const newValue = {
          ...oldValue,
          isOver,
        } satisfies DropZoneState;

        return {
          ...dropZoneStates,
          [type]: {
            ...dropZoneStates[type],
            [dropZoneId]: newValue,
          },
        };
      });
    },
    /**
     * Get whether the current drag is of a given type.
     * @param type
     */
    isDragOfType(type: DragTypeIdentifier): boolean {
      return currentDrag?.type === type;
    },
    /**
     * Get the drop effect specified by the current drag item, for a given type.
     * If the current drag does not match {@link type}, returns `undefined`.
     * @param type
     */
    getDropEffectForType(type: DragTypeIdentifier): CurrentDragData['dropEffect'] {
      if (currentDrag?.type === type) {
        return currentDrag.dropEffect;
      } else {
        return undefined;
      }
    },
    /**
     * Get the data associated with the current drag item, for a given type.
     * If the current drag does not match {@link type}, returns `undefined`.
     * @param type
     * @returns
     */
    getDragDataForType<TDragData>(type: DragTypeIdentifier): TDragData | undefined {
      if (currentDrag?.type === type) {
        return currentDrag.dragData as TDragData;
      } else {
        return undefined;
      }
    },
    /**
     * Get whether the specified drop zone is reporting that a matching drag item is over it.
     * @param type The type of drag item associated with the drop zone
     * @param dropZoneId ID of the drop zone
     */
    isOverDropZone(type: DragTypeIdentifier, dropZoneId: string): boolean {
      const result = (dropZoneStates[type] &&
        dropZoneStates[type][dropZoneId] &&
        dropZoneStates[type][dropZoneId].isOver);

      return result ?? false;
    },
    /**
     * Get whether any drop zone is reporting that a matching drag item is over it.
     * @param type The type of drag item associated with the drop zones
     */
    isOverAnyDropZone(type: DragTypeIdentifier) {
      if (dropZoneStates[type] === undefined) {
        return false;
      } else {
        return Object.values(dropZoneStates[type]).some((state) => state.isOver);
      }
    },
    /**
     * Get the data associated with the drop zone that the current drag item is over, for a given type.
     * If the current drag item is not over any matching drop zone of the given type, returns `undefined`.
     * @param type
     */
    getActiveDropZoneDataForType<TDropData>(type: DragTypeIdentifier) {
      if (dropZoneStates[type] === undefined) {
        return undefined;
      } else {
        // const debug_numActiveZones = Object.values(dropZoneStates[type]).reduce((curr, next) => curr + (next.isOver ? 1 : 0), 0);
        // console.log(`[DragAndDropData] (getCurrentActiveDropZoneData) Num active zones: ${debug_numActiveZones}`);
        return Object.values(dropZoneStates[type]).find((state) => state.isOver)?.dropZoneData as TDropData | undefined;
      }
    },
    /**
     * Record a drop zone in the state.
     * @param type Type of drag item the drop zone is associated with
     * @param dropZoneData Data associated with this drop zone
     * @returns Tuple of the ID associated with the drop zone, and a function for deregistering it from the state
     */
    registerDropZone<TDropData>(type: DragTypeIdentifier, dropZoneData: TDropData | undefined): [string, () => void] {
      const dropZoneId = uuid();
      setDropZoneStates((dropZoneStates) => {
        const statesForType = dropZoneStates[type] ?? {};

        return {
          ...dropZoneStates,
          [type]: {
            ...statesForType,
            [dropZoneId]: {
              id: dropZoneId,
              type,
              isOver: false,
              dropZoneData,
            } satisfies DropZoneState,
          },
        };
      });

      return [dropZoneId, () => {
        deregisterDropZone(type, dropZoneId);
      }];
    },
  };
}

/**
 * Provider component for drag and drop data. Must exist as a parent of any drag operations.
 */
export const DragAndDropDataProvider: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const dragAndDropData = createDragAndDropData();

  return (
    <DragAndDropDataContext.Provider value={dragAndDropData}>
      {children}
    </DragAndDropDataContext.Provider>
  );
};

const DragAndDropDataContext = createContext<DragAndDropData>(undefined!);
export const useDragAndDropData = (): DragAndDropData => useContext(DragAndDropDataContext);

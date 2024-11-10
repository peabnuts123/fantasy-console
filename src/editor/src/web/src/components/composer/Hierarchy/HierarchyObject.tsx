import { SceneViewController } from "@lib/composer/scene";
import type { FunctionComponent, MouseEvent } from "react";
import { useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon, ArrowTurnDownRightIcon, TrashIcon } from '@heroicons/react/24/solid'
import { Menu, MenuItem } from "@tauri-apps/api/menu";
import cn from 'classnames';

import { SetGameObjectParentMutation } from "@lib/mutation/scene/mutations";
import { GameObjectData } from "@lib/composer/data";
import { useDrag, useDrop } from '@lib/util/drag-and-drop'
import { isRunningInBrowser } from "@lib/tauri";
import { observer } from "mobx-react-lite";
import { gameObjectAt, HierarchyObjectDragData, HierarchyObjectDropZoneData } from "./util";
import { RearrangeHierarchyDragSlot } from "./RearrangeHierarchyDragSlot";
import { HierarchyObjectFacade } from "./HierarchyObjectFacade";


export interface HierarchyObjectProps {
  controller: SceneViewController;
  gameObject: GameObjectData;
  parentGameObject: GameObjectData | undefined;
  contextActions: {
    createNewObject: (parent?: GameObjectData | undefined) => void;
    deleteObject: (gameObject: GameObjectData) => void;
  };
  previousSiblingId: string | undefined;
  nextSiblingId: string | undefined;
  hideDragSlots?: boolean;
}


export const HierarchyObject: FunctionComponent<HierarchyObjectProps> = observer(({
  controller,
  parentGameObject,
  gameObject,
  contextActions,
  previousSiblingId,
  nextSiblingId,
  hideDragSlots,
}) => {
  // Default props
  hideDragSlots ??= false;

  // State
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Hooks
  const [{ isDragging: isDraggingThisItem }, DragSource] = useDrag<HierarchyObjectDragData, HTMLButtonElement>({
    type: `SceneHierarchyObject`,
    data: {
      gameObject,
    } satisfies HierarchyObjectDragData,
  });

  const [{ isDragging: isDraggingAnyItem, isDragOverThisZone, currentActiveDropZoneData, dragData }, DropTarget] = useDrop({
    accepts: `SceneHierarchyObject`,
    onDrop(data: HierarchyObjectDragData) {
      onDropIntoNewParent(data);
    },
    data: {
      gameObjectId: gameObject.id,
      type: 'parent',
    } satisfies HierarchyObjectDropZoneData as HierarchyObjectDropZoneData,
  });

  const { gameObject: currentDragObjectData } = dragData ?? {};

  // Computed state
  /** Whether this object is selected in the scene view */
  const isSelected = controller.selectedObject === gameObject;
  /** Whether this object has children */
  const hasChildren = gameObject.children.length > 0;
  /** Whether this object's children are visible */
  const showChildren = (hasChildren && !isCollapsed) || (isDragOverThisZone);

  // Drag state
  // Sorry about this.
  /** Whether this object is the first of its siblings (i.e. top-level objects or children of another object) */
  const isFirstSibling = previousSiblingId === undefined;
  /** Whether the current object being dragged is not this object */
  const dragObjectIsNotThisObject = currentDragObjectData === undefined || currentDragObjectData.id !== gameObject.id;
  /** Whether the current object being dragged is not a parent (direct or indirect) of this object */
  const dragObjectIsNotParentOfThisObject = currentDragObjectData?.findGameObjectInChildren(gameObject.id) === undefined;
  /** Whether the current object being dragged is not the next sibling of this object */
  // @NOTE No need for a `dragObjectIsNotPreviousSibling` as this would mean `isFirstSibling=false`
  const dragObjectIsNotNextSibling = currentDragObjectData === undefined || currentDragObjectData.id !== nextSiblingId;
  /** Whether the current object being dragged is not a direct child of this object */
  const dragObjectIsNotDirectChildOfThisObject = currentDragObjectData === undefined || gameObject.children.every((childObject) => childObject.id !== currentDragObjectData.id);
  /** Whether the "before" drag slot should show */
  const showPreviousSiblingDragSlot = !hideDragSlots && isFirstSibling && dragObjectIsNotThisObject && dragObjectIsNotParentOfThisObject;
  /** Whether the "after" drag slot should show */
  const showNextSiblingDragSlot = !hideDragSlots && dragObjectIsNotNextSibling && dragObjectIsNotThisObject && dragObjectIsNotParentOfThisObject;
  /** Whether this object is a valid drop target (i.e. we aren't dragging its parent or one of its direct children) */
  const isThisObjectAValidDropTarget = dragObjectIsNotThisObject && dragObjectIsNotParentOfThisObject && dragObjectIsNotDirectChildOfThisObject;
  /** Whether this object is the last object in the list of top-level objects */
  const isLastTopLevelObject = nextSiblingId === undefined && parentGameObject === undefined;
  /** Whether this drag slot should be highlighted (e.g. because the active drag slot is one of its children) */
  const isThisDragSlotHighlighted = currentActiveDropZoneData !== undefined && (
    // Highlight if...
    // - The active drag slot is this object
    (
      currentActiveDropZoneData.gameObjectId === gameObject.id &&
      currentActiveDropZoneData.type === 'parent'
    ) ||
    // - The active drag slot is a sibling slot of one this object's direct children
    (
      gameObject.children.some((childObject) => childObject.id === currentActiveDropZoneData.gameObjectId) &&
      (currentActiveDropZoneData.type === 'before' || currentActiveDropZoneData.type === 'after')
    )
  );

  // Functions
  const showContextMenu = async (e: React.MouseEvent) => {
    // @NOTE Skip context menu in browser
    if (isRunningInBrowser()) return;

    e.preventDefault();
    e.stopPropagation();

    const menuItems = await Promise.all([
      MenuItem.new({
        text: 'Create new object',
        action: () => {
          contextActions.createNewObject();
        },
      }),
      MenuItem.new({
        text: 'Create new child object',
        action: () => {
          contextActions.createNewObject(gameObject);
        },
      }),
      MenuItem.new({
        text: 'Delete object',
        action: () => {
          contextActions.deleteObject(gameObject);
        },
      }),
      // MenuItem.new({
      //   text: 'Delete',
      //   action: async () => {
      //     console.log(`[Action] Delete`);
      //   },
      // }),
      // PredefinedMenuItem.new({ item: 'Separator' }),
      // MenuItem.new({
      //   text: 'Duplicate',
      //   action: async () => {
      //     console.log(`[Action] Duplicate`);
      //   },
      // }),
      // PredefinedMenuItem.new({ item: 'Separator' }),
      // MenuItem.new({
      //   text: 'Export',
      //   action: async () => {
      //     console.log(`[Action] Export`);
      //   },
      // }),
    ]);

    const menu = await Menu.new({
      items: menuItems,
    });

    await menu.popup();
  }
  const onClickDelete = (e: MouseEvent) => {
    e.stopPropagation();
    contextActions.deleteObject(gameObject);
  }

  const onDropIntoRearrangeSlot = (data: HierarchyObjectDragData, type: 'before' | 'after') => {
    // @NOTE TypeScript isn't smart enough to recognise use of property indexer `[type]` will satisfy the constraint
    //  so, manually specify properties `before` and `after`
    if (type === 'before') {
      controller.mutator.apply(new SetGameObjectParentMutation({
        gameObject: data.gameObject,
        newParent: parentGameObject,
        before: gameObject,
      }));
    } else {
      controller.mutator.apply(new SetGameObjectParentMutation({
        gameObject: data.gameObject,
        newParent: parentGameObject,
        after: gameObject,
      }));
    }
  };

  const onDropIntoNewParent = (data: HierarchyObjectDragData) => {
    controller.mutator.apply(new SetGameObjectParentMutation({
      gameObject: data.gameObject,
      newParent: gameObject,
    }));
  };

  return (
    <div
      className={cn(
        { 'opacity-40': isDraggingThisItem },
        { 'grow': isLastTopLevelObject },
      )}
    >
      {showPreviousSiblingDragSlot && (
        /* Drag re-arrange handle */
        <RearrangeHierarchyDragSlot
          gameObject={gameObject}
          onDrop={(data) => onDropIntoRearrangeSlot(data, 'before')}
          type="before"
        />
      )}

      <div /* Row + Children + Preview slot */
        className={cn('w-full cursor-pointer pl-[10px]', { 'bg-blue-300': isThisDragSlotHighlighted })}
        onContextMenu={showContextMenu}
      >
        <div /* Row: Icon + Name + Delete */
          className={cn("grow flex flex-row text-left",
            { 'bg-blue-400': !isDraggingAnyItem && isSelected },
            { 'hover:bg-blue-300 focus:bg-blue-300': !isDraggingAnyItem && !isSelected },
          )}
          ref={isThisObjectAValidDropTarget ? DropTarget : undefined}
        >
          {/* Icon */}
          <span className="shrink-0">
            {hasChildren ? (
              <span onClick={() => setIsCollapsed(!isCollapsed)}>
                {isCollapsed ? (
                  <ChevronRightIcon className="icon" />
                ) : (
                  <ChevronDownIcon className="icon" />
                )}
              </span>
            ) : (
              <ArrowTurnDownRightIcon className="icon opacity-20" />
            )}
          </span>

          {/* Object name */}
          <button
            className="grow pl-1 text-left"
            ref={DragSource}
            onClick={() => controller.selectionManager.select(gameObject)}
          >
            {gameObject.name}
          </button>

          {/* Delete icon */}
          {!isDraggingAnyItem && isSelected && (
            <button className="px-2 bg-blue-400 hover:bg-blue-500 focus:bg-blue-500 active:bg-blue-600" onClick={onClickDelete}>
              <TrashIcon className="icon w-4" />
            </button>
          )}
        </div>


        {showChildren && (
          /* Child objects */
          gameObject.children.map((childGameObject, index) => (
            <HierarchyObject
              key={childGameObject.id}
              controller={controller}
              gameObject={childGameObject}
              parentGameObject={gameObject}
              contextActions={contextActions}
              previousSiblingId={gameObjectAt(gameObject.children, index - 1)}
              nextSiblingId={gameObjectAt(gameObject.children, index + 1)}
              hideDragSlots={isCollapsed}
            />
          ))
        )}

        {/* Drag preview for reparenting */}
        <div className={cn('transition-[height] duration-200 overflow-hidden',
          // { 'h-6': isDragOverThisZone },
          { 'h-0': !isDragOverThisZone }
        )}>
          <HierarchyObjectFacade
            gameObject={currentDragObjectData}
          />
        </div>
      </div>

      {/* Drag re-arrange handle */}
      {showNextSiblingDragSlot && (
        <RearrangeHierarchyDragSlot
          gameObject={gameObject}
          onDrop={(data) => onDropIntoRearrangeSlot(data, 'after')}
          type="after"
          isLastTopLevelSlot={isLastTopLevelObject}
        />
      )}
    </div>
  )
});
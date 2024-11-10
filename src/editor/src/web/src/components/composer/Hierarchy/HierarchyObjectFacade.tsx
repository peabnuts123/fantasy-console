import type { FunctionComponent } from "react";
import { ChevronRightIcon, ChevronDownIcon, ArrowTurnDownRightIcon } from '@heroicons/react/24/solid'

import { GameObjectData } from "@lib/composer/data";

export const HierarchyObjectFacade: FunctionComponent<{ gameObject: GameObjectData | undefined }> = (({ gameObject }) => {
  // Constants
  const isCollapsed = true; // @NOTE in case we ever need to bring this back

  // Computed state
  const hasChildren = gameObject !== undefined && gameObject.children.length > 0;

  // Functions
  return (
    <>
      <div
        className="w-full flex flex-row pl-[10px]"
      >
        <div className="grow flex flex-row text-left bg-blue-400">
          {/* Icon */}
          <span className="shrink-0">
            {hasChildren ? (
              <span>
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
          <div className="grow pl-1 overflow-visible">{gameObject?.name}
          </div>
        </div>
      </div>

      {hasChildren && !isCollapsed && (
        /* Child objects */
        gameObject.children.map((gameObject) => (
          <HierarchyObjectFacade
            key={gameObject.id}
            gameObject={gameObject}
          />
        ))
      )}
    </>
  )
});
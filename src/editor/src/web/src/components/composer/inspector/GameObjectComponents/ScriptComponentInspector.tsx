import { DocumentIcon } from '@heroicons/react/24/outline'
import cn from 'classnames';

import Condition from "@app/components/util/condition";
import type { ScriptComponentData } from "@lib/composer/data";
import type { InspectorComponent } from "./InspectorComponent";
import { InspectorComponentBase } from "./InspectorComponentBase";

export const ScriptComponentInspector: InspectorComponent<ScriptComponentData> = ({ component, controller, gameObject }) => {
  // Computed state
  const hasAsset = component.scriptAsset !== undefined;

  return (
    /* @TODO Make a common "asset reference" component */
    <InspectorComponentBase component={component} controller={controller} gameObject={gameObject}>
      <label className="font-bold">Script</label>
      <div className="flex flex-row">
        {/* Asset icon */}
        <div className="flex bg-blue-300 justify-center items-center p-2">
          <DocumentIcon />
        </div>

        {/* Asset reference / name */}
        <div
          // ref={DropTarget}
          className={cn("w-full p-2 bg-white overflow-scroll", {
            // "!bg-blue-300": isDragOverTarget,
            'italic': !hasAsset,
          })}
        >
          <Condition if={hasAsset}
            then={() => component.scriptAsset!.path}
            else={() => "No script assigned"}
          />
        </div>

        {/* @TODO Remove reference button */}
      </div>
    </InspectorComponentBase>
  )
};

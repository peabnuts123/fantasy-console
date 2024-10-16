import type { FunctionComponent, PropsWithChildren } from "react";
import { observer } from "mobx-react-lite";

import type { IComposerComponentData } from "@lib/composer/data";
import type { InspectorComponentProps } from "./InspectorComponent";

export const InspectorComponentBase: FunctionComponent<PropsWithChildren<InspectorComponentProps<IComposerComponentData>>> = observer(({ children, component }) => {
  return (
    <div className="mb-2">
      <div className="p-1 bg-gradient-to-b from-[blue] to-slate-200 text-white text-retro-shadow">
        {/* Header */}
        <span className="font-bold">{component.componentName}</span>
      </div>
      <div className="p-2 bg-slate-200">
        {/* UI */}
        {children}
      </div>
    </div>
  );
});

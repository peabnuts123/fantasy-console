import { FunctionComponent, PropsWithChildren } from "react";
import { IComposerComponentConfig } from "@lib/composer/config/components";
import { InspectorComponentProps } from "./InspectorComponent";

export const InspectorComponentBase: FunctionComponent<PropsWithChildren<InspectorComponentProps<IComposerComponentConfig>>> = ({ children, component }) => {
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
};

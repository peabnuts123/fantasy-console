import type { FunctionComponent, PropsWithChildren } from "react";
import { observer } from "mobx-react-lite";
import { TrashIcon } from '@heroicons/react/24/solid'


import type { IComposerComponentData } from "@lib/composer/data";
import type { InspectorComponentProps } from "./InspectorComponent";
import { RemoveGameObjectComponentMutation } from "@lib/mutation/scene/mutations";

export const InspectorComponentBase: FunctionComponent<PropsWithChildren<InspectorComponentProps<IComposerComponentData>>> = observer(({ children, gameObject, component, controller }) => {
  const onClickDeleteComponent = () => {
    controller.mutator.apply(new RemoveGameObjectComponentMutation(gameObject, component));
  }

  return (
    <div className="mb-2">
      <div className="p-1 bg-gradient-to-b from-[blue] to-slate-200 text-white text-retro-shadow flex flex-row justify-between items-center">
        {/* Header */}
        <span className="font-bold">{component.componentName}</span>
        <button className="button is-shallow m-0" onClick={(_e) => onClickDeleteComponent()}><TrashIcon className="icon w-4" /></button>
      </div>
      <div className="p-2 bg-slate-200">
        {/* UI */}
        {children}
      </div>
    </div>
  );
});

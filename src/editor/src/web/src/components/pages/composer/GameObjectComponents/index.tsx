import { IComposerComponentConfig, MeshComponentConfigComposer } from "@lib/composer/config/components";
import { FunctionComponent, PropsWithChildren } from "react";

export interface InspectorComponentProps<TComponentType extends IComposerComponentConfig> {
  component: TComponentType;
}

export type InspectorComponent<TComponentType extends IComposerComponentConfig> = FunctionComponent<InspectorComponentProps<TComponentType>>;

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

const MeshComponentInspector: InspectorComponent<MeshComponentConfigComposer> = ({ component }) => {
  return (
    <InspectorComponentBase component={component}>
      {/* <span>Mesh file: {component.meshAsset.baseName}</span> */}
      <label>
        <span className="font-bold">Mesh</span>
        <input type="text" value={component.meshAsset.path} readOnly={true} className="w-full p-1" />
      </label>
    </InspectorComponentBase>
  )
};

const UnimplementedComponentInspector: InspectorComponent<IComposerComponentConfig> = ({ component }) => {
  return (
    <InspectorComponentBase component={component}>
      <p className="italic">Unimplemented Inspector UI!</p>
    </InspectorComponentBase>
  )
};

export function getInspectorFor<TComponentType extends IComposerComponentConfig>(gameObjectComponentConfig: TComponentType): InspectorComponent<TComponentType> {
  // @NOTE Assigning to a loosely-typed variable just to launder these types a bit
  // Seems TypeScript can't infer that if `gameObjectComponentConfig instance A` then result should be `InspectorComponent<A>`
  let result: FunctionComponent<any>;
  if (gameObjectComponentConfig instanceof MeshComponentConfigComposer) {
    result = MeshComponentInspector;
  } else {
    result = UnimplementedComponentInspector;
  }
  return result;
}

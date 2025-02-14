import { observer } from 'mobx-react-lite';

import { AssetType } from '@polyzone/runtime/src/cartridge';

import type { ScriptComponentData } from "@lib/project/data";
import { SetGameObjectScriptComponentAssetMutation } from '@lib/mutation/scene/mutations';
import type { ScriptAssetData } from '@lib/project/data/AssetData';
import { createAssetReferenceComponentOfType } from '../AssetReference';
import type { InspectorComponent } from "./InspectorComponent";
import { InspectorComponentBase } from "./InspectorComponentBase";

const ScriptAssetReference = createAssetReferenceComponentOfType<AssetType.Script>();

export const ScriptComponentInspector: InspectorComponent<ScriptComponentData> = observer(({ component, controller, gameObject }) => {
  const onUpdateScriptAsset = (scriptAsset: ScriptAssetData | undefined): void => {
    controller.mutator.apply(
      new SetGameObjectScriptComponentAssetMutation(
        gameObject,
        component,
        scriptAsset,
      ),
    );
  };

  return (
    <InspectorComponentBase component={component} controller={controller} gameObject={gameObject}>
      <ScriptAssetReference
        label='Script'
        assetType={AssetType.Script}
        asset={component.scriptAsset}
        onAssetChange={onUpdateScriptAsset}
      />
    </InspectorComponentBase>
  );
});

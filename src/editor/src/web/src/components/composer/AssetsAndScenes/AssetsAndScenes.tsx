import type { FunctionComponent } from "react";
import { observer } from "mobx-react-lite";

import { TabProvider, TabBar, TabPage } from "@app/components/tabs";
import { AssetList } from "./AssetList";
import { SceneList } from "./SceneList";

export const AssetsAndScenes: FunctionComponent = observer(({ }) => {
  return (
    <TabProvider defaultTabId="assets">
      <div className="h-full flex flex-col">
        <div className="pt-2 bg-gradient-to-b from-[blue] to-cyan-400 shrink-0 ">
          <TabBar tabs={[
            {
              type: 'page',
              tabId: 'assets',
              label: "Assets"
            },
            {
              type: 'page',
              tabId: 'scenes',
              label: "Scenes"
            }
          ]} />
        </div>

        <TabPage tabId="assets">
          <AssetList />
        </TabPage>

        <TabPage tabId="scenes">
          <SceneList />
        </TabPage>
      </div>
    </TabProvider>
  );
});

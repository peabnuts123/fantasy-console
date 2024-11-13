import type { FunctionComponent } from "react";
import { useState } from "react";
import { observer } from "mobx-react-lite";

import { useLibrary } from "@lib/index";
import { AssetListFileItem } from "./AssetListFileItem";
import { AssetListDirectoryItem } from "./AssetListDirectoryItem";

export const AssetList: FunctionComponent = observer(({ }) => {
  // Hooks
  const { ProjectController } = useLibrary();

  // Computed state
  const { assetDb } = ProjectController;

  const [currentDirectory, setCurrentDirectory] = useState<string[]>([]);

  return (
    <div className="px-2 h-full overflow-y-scroll grow">
      {/* Parent directory button */}
      {/* Only visible if you are not in the root */}
      {currentDirectory.length > 0 && (
        <div
          role="button"
          tabIndex={0}
          className="my-2 flex flex-row items-center p-2 border select-none cursor-pointer bg-white hover:bg-blue-100 focus:bg-blue-100 active:bg-blue-200"
          onClick={() => setCurrentDirectory(currentDirectory.slice(0, currentDirectory.length - 1))}
        >
          <span className="ml-2">..</span>
        </div>
      )}
      {/* Assets in the current folder */}
      {assetDb.dir(currentDirectory).map((asset) => {
        if (asset.type === 'file') {
          return (
            <AssetListFileItem
              key={asset.id}
              asset={asset}
            />
          )
        } else {
          return (
            <AssetListDirectoryItem
              key={asset.id}
              asset={asset}
              currentDirectory={currentDirectory}
              setCurrentDirectory={setCurrentDirectory}
            />
          )
        }
      })}
    </div>
  );
});

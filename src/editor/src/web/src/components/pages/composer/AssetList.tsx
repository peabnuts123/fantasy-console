import { FunctionComponent, useState } from "react";
import { FolderIcon, DocumentIcon } from '@heroicons/react/24/outline'
import cn from 'classnames';

import { useLibrary } from "@lib/index";
import Condition from "@app/components/util/condition";


interface Props { }

const AssetList: FunctionComponent<Props> = ({ }) => {
  const { ProjectController } = useLibrary();
  const { assetDb } = ProjectController;

  const [currentDirectory, setCurrentDirectory] = useState<string[]>([]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 bg-gradient-to-b from-[blue] to-cyan-400 text-white text-retro-shadow shrink-0">
        <h2 className="text-lg">Assets</h2>
      </div>
      <div className="relative px-2 h-full overflow-y-scroll grow">
        {/* Parent directory button */}
        {/* Only visible if you are not in the root */}
        <Condition if={currentDirectory.length > 0}
          then={() => (
            <div
              role="button"
              tabIndex={0}
              className="my-2 flex flex-row items-center p-2 border select-none cursor-pointer bg-white hover:bg-blue-100 focus:bg-blue-100 active:bg-blue-200"
              onClick={() => setCurrentDirectory(currentDirectory.slice(0, currentDirectory.length - 1))}
            >
              <span className="ml-2">..</span>
            </div>
          )}
        />
        {/* Assets in the current folder */}
        {assetDb.dir(currentDirectory).map((asset, index) => {
          const isFile = asset.type === 'file';
          const isDirectory = asset.type === 'directory';

          return (
            /* @TODO switch element between div and button when clickable */
            <div
              key={asset.name}
              role="button"
              tabIndex={0}
              className={cn("my-2 flex flex-row items-center p-2 border select-none bg-white", {
                'cursor-pointer hover:bg-blue-100 focus:bg-blue-100 active:bg-blue-200': isDirectory,
                'cursor-default': isFile,
              })}
              onClick={() => {
                if (isDirectory) {
                  setCurrentDirectory([...currentDirectory, asset.name]);
                }
              }}
            >
              <Condition if={asset.type === 'file'}
                then={() => <DocumentIcon />}
                else={() => <FolderIcon />}
              />
              <span className="ml-2">{asset.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssetList;

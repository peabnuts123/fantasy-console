import { FunctionComponent, useState } from "react";
import { FolderIcon } from '@heroicons/react/24/outline'
import cn from 'classnames';

import { AssetType } from "@fantasy-console/runtime/src/cartridge";

import { useModal } from '@lib/modal';
import { AssetListItemCommon, getIconForAssetType } from "@app/components/composer/AssetList";

/** Result payload for when the modal is closed by selected an asset */
interface AssetReferenceSelectedResultPayload {
  selected: true;
  assetId: string;
}

/** Result payload for when the modal is closed by cancelling */
interface AssetReferenceCancelledResultPayload {
  selected: false;
}

/** Result payload from this Asset Reference modal */
export type AssetReferenceResultPayload = AssetReferenceSelectedResultPayload | AssetReferenceCancelledResultPayload;

/** Reference to an asset for use with the Asset Reference modal */
export interface AssetReferenceModalAssetReference<TAssetType extends AssetType> {
  id: string;
  type: TAssetType,
  path: string[],
  name: string;
}

/** Data required by the Asset Reference modal */
export interface AssetReferenceModalData<TAssetType extends AssetType> {
  assets: AssetReferenceModalAssetReference<TAssetType>[];
}

/*
  @NOTE a lot of similarities with AssetList.
  But they are just kind of awkwardly different, and it's probably better
  to just have 2 copies of this code rather than try make some epic abstraction.
  A lot of re-use is happening with <AssetListItemCommon /> anyway.
 */

const AssetReferenceModal: FunctionComponent = ({ }) => {
  // State
  const modal = useModal<AssetReferenceModalData<AssetType>>({ assets: [] });
  const [currentDirectory, setCurrentDirectory] = useState<string[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>(undefined);

  // Computed state
  const assets = modal.data.assets;
  const isAnyAssetSelected = selectedAssetId !== undefined;

  const onClickSelect = async () => {
    await modal.close({
      selected: true,
      assetId: selectedAssetId!,
    } satisfies AssetReferenceSelectedResultPayload);
  };

  const onClickCancel = async () => {
    await modal.close({
      selected: false,
    } satisfies AssetReferenceCancelledResultPayload);
  };

  return (
    <div className="h-full flex flex-col">

      <div className="overflow-y-scroll">
        <div className="h-full flex flex-col">
          <div className="p-2 bg-gradient-to-b from-[blue] to-cyan-400 text-white text-retro-shadow shrink-0">
            <h2 className="text-lg">Select an asset</h2>
          </div>
          {/* @TODO put a fzf search in here */}
          <div className="relative px-2 h-full overflow-y-scroll grow">
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
            {dir(assets, currentDirectory).map((asset) => {
              if (asset.type === 'file') {
                return (
                  <AssetReferenceModalListFileItem
                    key={asset.id}
                    asset={asset}
                    selectedAssetId={selectedAssetId}
                    onSelectAsset={setSelectedAssetId}
                  />
                )
              } else {
                return (
                  <AssetReferenceModalListDirectoryItem
                    key={asset.id}
                    asset={asset}
                    currentDirectory={currentDirectory}
                    setCurrentDirectory={setCurrentDirectory}
                  />
                )
              }
            })}
          </div>
        </div>
      </div>
      {/* <AssetList /> */}
      <div className="flex flex-row justify-end">
        <button className="button" onClick={onClickSelect} disabled={!isAnyAssetSelected}>Select</button>
        <button className="button" onClick={onClickCancel}>Cancel</button>
      </div>
    </div>
  );
};

/*
 * Like AssetListFileItem, but different
 */
export interface AssetReferenceModalListFileItemProps {
  asset: AssetReferenceModalVirtualFile<AssetType>;
  selectedAssetId: string | undefined;
  onSelectAsset: (assetId: string) => void;
}
export const AssetReferenceModalListFileItem: FunctionComponent<AssetReferenceModalListFileItemProps> = ({ asset, selectedAssetId, onSelectAsset }) => {
  let AssetIcon = getIconForAssetType(asset.data.type);
  const isSelected = asset.id === selectedAssetId;
  return (
    <AssetListItemCommon
      asset={asset}
      Icon={AssetIcon}
      classNames={cn("cursor-grab", { '!bg-blue-300': isSelected })}
      onClick={() => onSelectAsset(asset.id)}
    />
  );
};

/*
 * Like AssetListDirectoryItem, but different
 */
export interface AssetReferenceModalListDirectoryItemProps {
  asset: AssetReferenceModalVirtualDirectory;
  currentDirectory: string[];
  setCurrentDirectory: (path: string[]) => void;
}
export const AssetReferenceModalListDirectoryItem: FunctionComponent<AssetReferenceModalListDirectoryItemProps> = ({ asset, currentDirectory, setCurrentDirectory }) => {
  return (
    <AssetListItemCommon
      asset={asset}
      Icon={FolderIcon}
      classNames="cursor-pointer focus:bg-blue-100 active:bg-blue-200"
      onClick={() => {
        setCurrentDirectory([...currentDirectory, asset.name]);
      }}
    />
  )
};

/*
 * Like AssetDbVirtual_____, but different
 */
type AssetReferenceModalVirtualNode<TAssetType extends AssetType> = AssetReferenceModalVirtualFile<TAssetType> | AssetReferenceModalVirtualDirectory;
interface AssetReferenceModalVirtualNodeBase {
  id: string;
  name: string;
}
interface AssetReferenceModalVirtualFile<TAssetType extends AssetType> extends AssetReferenceModalVirtualNodeBase {
  type: 'file';
  data: AssetReferenceModalAssetReference<TAssetType>;
}
interface AssetReferenceModalVirtualDirectory extends AssetReferenceModalVirtualNodeBase {
  type: 'directory';
}

/*
 * Like AssetDb.dir, but different
 */
function dir<TAssetType extends AssetType>(assets: AssetReferenceModalAssetReference<TAssetType>[], cwd: string[]): AssetReferenceModalVirtualNode<TAssetType>[] {
  // Find all assets that are at this node or below
  const assetsMatchingPrefix = assets.filter((asset) => {
    for (let i = 0; i < cwd.length; i++) {
      if (asset.path[i] != cwd[i]) {
        return false;
      }
    }

    return true;
  });

  // Map nodes into files and directories that are inside this path
  let files: AssetReferenceModalVirtualFile<TAssetType>[] = [];
  let directories: AssetReferenceModalVirtualDirectory[] = [];

  assetsMatchingPrefix.forEach((asset) => {
    let assetPath = asset.path.slice(cwd.length);

    if (assetPath.length === 0) {
      // Asset is a file in the directory
      files.push({
        id: asset.id,
        type: 'file',
        name: asset.name,
        data: asset,
      });
    } else {
      // Asset is in a subdirectory
      const subDirectoryName = assetPath[0];
      // Check if we already know about this directory first
      if (!directories.some((directory) => directory.name === subDirectoryName)) {
        directories.push({
          id: asset.id,
          type: 'directory',
          name: subDirectoryName,
        });
      }
    }
  });

  return [
    ...directories,
    ...files,
  ];
}

export default AssetReferenceModal;

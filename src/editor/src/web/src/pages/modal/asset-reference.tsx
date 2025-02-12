import { FunctionComponent, useState } from "react";
import { FolderIcon } from '@heroicons/react/24/outline';
import cn from 'classnames';

import { AssetType } from "@fantasy-console/runtime/src/cartridge";

import { useModal } from '@lib/modal';
import { createDirView } from "@lib/util/path";
import { getIconForAssetType } from "@app/components/composer/AssetsAndScenes/AssetList";
import { ListItemCommon } from "@app/components/composer/AssetsAndScenes";

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
  A lot of re-use is happening with <ListItemCommon /> anyway.
 */

const AssetReferenceModal: FunctionComponent = ({ }) => {
  // State
  const modal = useModal<AssetReferenceModalData<AssetType>>({ assets: [] });
  const [currentDirectory, setCurrentDirectory] = useState<string[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>(undefined);

  // Computed state
  const assets = modal.data.assets;
  const isAnyAssetSelected = selectedAssetId !== undefined;

  const currentDirectoryAssetView = createDirView(
    assets,
    currentDirectory,
    (asset) => asset.path,
    (asset) => ({
      id: asset.id,
      type: 'file',
      name: asset.name,
      data: asset,
    } satisfies AssetReferenceModalVirtualFile<AssetType> as AssetReferenceModalVirtualFile<AssetType>),
    (directoryName, asset) => ({
      id: asset.id,
      type: 'directory',
      name: directoryName,
    } satisfies AssetReferenceModalVirtualDirectory as AssetReferenceModalVirtualDirectory),
  );

  const onClickSelect = async (): Promise<void> => {
    await modal.close({
      selected: true,
      assetId: selectedAssetId!,
    } satisfies AssetReferenceSelectedResultPayload);
  };

  const onClickCancel = async (): Promise<void> => {
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
            {currentDirectoryAssetView.map((asset) => {
              if (asset.type === 'file') {
                return (
                  <AssetReferenceModalListFileItem
                    key={asset.id}
                    asset={asset}
                    selectedAssetId={selectedAssetId}
                    onSelectAsset={setSelectedAssetId}
                  />
                );
              } else {
                return (
                  <AssetReferenceModalListDirectoryItem
                    key={asset.id}
                    asset={asset}
                    currentDirectory={currentDirectory}
                    setCurrentDirectory={setCurrentDirectory}
                  />
                );
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
  const AssetIcon = getIconForAssetType(asset.data.type);
  const isSelected = asset.id === selectedAssetId;
  return (
    <ListItemCommon
      label={asset.name}
      Icon={AssetIcon}
      classNames={cn({ '!bg-blue-300': isSelected })}
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
    <ListItemCommon
      label={asset.name}
      Icon={FolderIcon}
      onClick={() => {
        setCurrentDirectory([...currentDirectory, asset.name]);
      }}
    />
  );
};

/*
 * Like AssetDbVirtual_____, but different
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export default AssetReferenceModal;

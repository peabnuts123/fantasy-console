import { useEffect, useRef, useState } from "react";
import type { ChangeEventHandler, FocusEventHandler, FunctionComponent, KeyboardEventHandler, MouseEventHandler } from "react";
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { observer } from "mobx-react-lite";
import { Menu, MenuItem } from "@tauri-apps/api/menu";

import { baseName, rename } from "@fantasy-console/runtime/src/util";
import { SceneData } from "@lib/project/data";
import { useLibrary } from "@lib/index";
import { isRunningInBrowser } from "@lib/tauri";
import { MoveSceneMutation } from "@lib/mutation/project/mutations";
import { useSceneDrag } from "@app/interactions/scenes";
import { ListItemCommon } from '../ListItemCommon';
import { convertToSafeFileName } from "@lib/util/path";


export interface SceneListVirtualFile {
  id: string;
  type: 'file';
  scene: SceneData;
}

export interface SceneListFileItemProps {
  file: SceneListVirtualFile;
  onClick?: () => void;
}

export const SceneListFileItem: FunctionComponent<SceneListFileItemProps> = observer(({ file, onClick }) => {
  // Prop defaults
  onClick ??= () => { };

  // Hooks
  const [{ }, DragSource] = useSceneDrag(file.scene);
  const { ProjectController } = useLibrary();

  // State
  const [isRenaming, setIsRenaming] = useState<boolean>(false);

  // Computed state
  const fileName = baseName(file.scene.path);
  const fileNameWithoutExtension = fileName.replace(/\.pzscene$/, '');

  // Functions
  const showContextMenu: MouseEventHandler = async (e) => {
    // @NOTE Skip context menu in browser
    if (isRunningInBrowser()) return;

    e.preventDefault();
    e.stopPropagation();

    const menuItems = await Promise.all([
      MenuItem.new({
        text: 'Rename scene',
        action: () => {
          setIsRenaming(true);
        },
      }),
    ]);

    const menu = await Menu.new({
      items: menuItems,
    });

    await menu.popup();
  };

  const onRenamed = (newBaseName: string): void => {
    console.log(`New path: ${newBaseName}`);
    setIsRenaming(false);
    if (newBaseName !== fileName) {
      const newPath = rename(file.scene.path, newBaseName);
      ProjectController.mutator.apply(new MoveSceneMutation(file.scene, newPath));
    }
  };

  return (
    isRenaming ? (
      <div
        className="w-full my-2 flex flex-row items-center p-2 border select-none bg-white"
      >
        <BuildingOffice2Icon className="icon mr-2 shrink-0" />
        <SceneNameTextInput
          value={fileNameWithoutExtension}
          onFinishedEditing={onRenamed}
          onCanceledEditing={() => setIsRenaming(false)}
        />
      </div>
    ) : (
      <ListItemCommon
        label={fileName}
        Icon={BuildingOffice2Icon}
        classNames="cursor-grab"
        onClick={onClick}
        onContextMenu={showContextMenu}
        innerRef={DragSource}
      />
    )
  );
});

export interface CreateNewSceneListFileItemProps {
  newPath: string,
  onCreate: (newPath: string) => void,
  onCancel: () => void,
}
/**
 * Stripped down version of SceneListFileItem for creating a new scene.
 * Only used to name the new scene, once the scene is named, a real SceneListFileItem
 * is put in its place
 */
export const CreateNewSceneListFileItem: FunctionComponent<CreateNewSceneListFileItemProps> = observer(({ newPath, onCreate, onCancel }) => {
  // Computed state
  const fileName = baseName(newPath);
  const fileNameWithoutExtension = fileName.replace(/\.pzscene$/, '');

  // Functions
  const onFinishedNaming = (newBaseName: string): void => {
    const createPath = rename(newPath, newBaseName);
    onCreate(createPath);
  };

  return (
    <div
      className="w-full my-2 flex flex-row items-center p-2 border select-none bg-white"
    >
      <BuildingOffice2Icon className="icon mr-2 shrink-0" />
      <SceneNameTextInput
        value={fileNameWithoutExtension}
        onFinishedEditing={onFinishedNaming}
        onCanceledEditing={onCancel}
      />
    </div>
  );
});

interface SceneNameTextInputProps {
  value: string;
  onFinishedEditing: (newValue: string) => void;
  onCanceledEditing: () => void;
}
const SceneNameTextInput: FunctionComponent<SceneNameTextInputProps> = ({ value, onFinishedEditing, onCanceledEditing }) => {
  // State
  const [inputText, setInputText] = useState<string>(`${value}`);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current === null) return;
    // Focus on component mount
    inputRef.current.focus();
  }, []);

  // Functions
  function toSceneFileName(baseName: string): string {
    return `${baseName.trim()}.pzscene`;
  }
  const onInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const inputText = convertToSafeFileName(e.target.value);
    setInputText(inputText);
  };

  const onBlurTextInput: FocusEventHandler = () => {
    // @TODO should blur cancel or accept?
    onFinishedEditing(toSceneFileName(inputText));
  };

  const onKeyDown: KeyboardEventHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onCanceledEditing();
    } else if (e.key === 'Enter') {
      onFinishedEditing(toSceneFileName(inputText));
    }
  };

  return (
    <div className="flex flex-row">
      <input
        type="text"
        ref={inputRef}
        className="w-[250px] p-1"
        value={inputText}
        minLength={1}
        onChange={onInputChange}
        onBlur={onBlurTextInput}
        onKeyDown={onKeyDown}
      />
      <span>.pzscene</span>
    </div>
  );
};

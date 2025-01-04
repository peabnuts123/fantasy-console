import { ChangeEventHandler, FunctionComponent, useEffect, useRef, useState } from "react";
import { BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { observer } from "mobx-react-lite";
import { Menu, MenuItem } from "@tauri-apps/api/menu";

import { baseName, rename } from "@fantasy-console/runtime/src/util";
import { SceneData } from "@lib/project/data";
import { useLibrary } from "@lib/index";
import { isRunningInBrowser } from "@lib/tauri";
import { MoveSceneMutation } from "@lib/mutation/project/mutations";
import { useSceneDrag } from "@app/interactions/scenes";
import { ListItemCommon } from '../ListItemCommon';


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
  let [{ }, DragSource] = useSceneDrag(file.scene);
  const { ProjectController } = useLibrary();

  // State
  const [isRenaming, setIsRenaming] = useState<boolean>(false);

  // Computed state
  const fileName = baseName(file.scene.path);
  const fileNameWithoutExtension = fileName.replace(/\.pzscene$/, '');

  // Functions
  const showContextMenu = async (e: React.MouseEvent) => {
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
  }

  const onRenamed = (newBaseName: string) => {
    console.log(`New path: ${newBaseName}`);
    setIsRenaming(false);
    if (newBaseName !== fileName) {
      const newPath = rename(file.scene.path, newBaseName);
      ProjectController.mutator.apply(new MoveSceneMutation(file.scene, newPath));
    }
  }

  return (
    isRenaming ? (
      <div
        className="w-full my-2 flex flex-row items-center p-2 border select-none bg-white"
      >
        <BuildingOffice2Icon className="icon mr-2 shrink-0" />
        <SceneNameTextInput value={fileNameWithoutExtension} onFinishedEditing={onRenamed} />
      </div>
    ) : (
      <ListItemCommon
        label={fileName}
        Icon={BuildingOffice2Icon}
        classNames=""
        onClick={onClick}
        onContextMenu={showContextMenu}
        innerRef={DragSource}
      />
    )
  );
});

interface SceneNameTextInputProps {
  value: string;
  onFinishedEditing: (newValue: string) => void;
}
const SceneNameTextInput: FunctionComponent<SceneNameTextInputProps> = ({ value, onFinishedEditing }) => {
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
    return `${baseName}.pzscene`;
  }
  const onInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    // @NOTE Remove characters that will make FS go brrrrr
    // Might need to be more restrictive with this later
    const inputText = e.target.value.replace(/[\/:*?"<>|]/g, '');
    setInputText(inputText);
  };

  const onBlurTextInput = () => {
    onFinishedEditing(toSceneFileName(inputText));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onFinishedEditing(toSceneFileName(value));
    } else if (e.key === 'Enter') {
      onFinishedEditing(toSceneFileName(inputText));
    }
  }

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
}

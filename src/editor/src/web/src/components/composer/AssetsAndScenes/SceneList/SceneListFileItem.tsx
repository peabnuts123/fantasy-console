import { FunctionComponent } from "react";
import { BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { observer } from "mobx-react-lite";

import { baseName } from "@fantasy-console/runtime/src/util";
import { SceneData } from "@lib/project/data";
import { ListItemCommon } from '../ListItemCommon';
import { useSceneDrag } from "@app/interactions/scenes";


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
  onClick ??= () => {};

  const sceneName = baseName(file.scene.path);

  let [{ }, DragSource] = useSceneDrag(file.scene);

  return (
    <ListItemCommon
      label={sceneName}
      Icon={BuildingOffice2Icon}
      classNames=""
      onClick={onClick}
      innerRef={DragSource}
    />
  );
});

import { FunctionComponent } from "react";
import { BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { observer } from "mobx-react-lite";

import { baseName } from "@fantasy-console/runtime/src/util";
import { SceneManifest } from "@lib/project/definition";
import { ListItemCommon } from '../ListItemCommon';


export interface SceneListVirtualFile {
  id: string;
  type: 'file';
  scene: SceneManifest;
}

export interface SceneListFileItemProps {
  file: SceneListVirtualFile;
}

export const SceneListFileItem: FunctionComponent<SceneListFileItemProps> = observer(({ file }) => {
  const sceneName = baseName(file.scene.path);

  return (
    <ListItemCommon
      label={sceneName}
      /* @TODO Delete maybe, one day, when autoload is done? */
      // innerContent={
      //   <div className="grow flex flex-row justify-between">
      //     {/* Label */}
      //     <span>{sceneName}</span>

      //     {/* Button(s) */}
      //     <div className="hidden group-hover/listitem:block">
      //       <div
      //         role="button"
      //         tabIndex={0}
      //         className="hover:bg-pink-400 px-2 h-full inline-flex justify-center items-center"
      //         onClick={() => console.log(`[DEBUG] @TODO DELETE`)}
      //       >
      //         <TrashIcon className="icon w-4" />
      //       </div>
      //     </div>
      //   </div>
      // }
      Icon={BuildingOffice2Icon}
      classNames=""
    />
  );
});

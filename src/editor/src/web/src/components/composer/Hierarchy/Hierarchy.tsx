import { SceneViewController } from "@lib/composer/scene";
import type { FunctionComponent } from "react";
import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { PlusIcon } from '@heroicons/react/24/outline'
import { observer } from "mobx-react-lite";

import { CreateBlankGameObjectMutation, DeleteGameObjectMutation } from "@lib/mutation/scene/mutations";
import { GameObjectData } from "@lib/composer/data";
import { isRunningInBrowser } from "@lib/tauri";

import { gameObjectAt } from "./util";
import { HierarchyObject } from "./HierarchyObject";

interface Props {
  controller: SceneViewController;
}

export const Hierarchy: FunctionComponent<Props> = observer(({ controller }) => {
  // Functions
  const createNewObject = (parent: GameObjectData | undefined = undefined) => {
    controller.mutator.apply(new CreateBlankGameObjectMutation(parent));
  };
  const deleteObject = (gameObjectData: GameObjectData) => {
    controller.mutator.apply(new DeleteGameObjectMutation(gameObjectData));
  };
  const showContextMenu = async (e: React.MouseEvent) => {
    // @NOTE Skip context menu in browser
    if (isRunningInBrowser()) return;

    e.preventDefault();
    e.stopPropagation();

    const menuItems = await Promise.all([
      MenuItem.new({
        text: 'Create new object',
        action: () => {
          createNewObject();
        },
      }),
    ]);

    const menu = await Menu.new({
      items: menuItems,
    });

    await menu.popup();
  };

  return (
    <>
      <div className="p-2 bg-gradient-to-b from-[blue] to-teal-500 text-white text-retro-shadow">
        <h2 className="text-lg">{controller.scene.path}</h2>
      </div>
      <div className="p-3 bg-slate-300 h-full flex flex-col" onContextMenu={showContextMenu}>
        <button className="button" onClick={() => createNewObject()}><PlusIcon className="icon mr-1" /> New object</button>
        {controller.scene.objects.map((gameObject, index) => (
          <HierarchyObject
            key={gameObject.id}
            controller={controller}
            gameObject={gameObject}
            parentGameObject={undefined} // Top-level objects have no parent
            contextActions={{ createNewObject, deleteObject }}
            previousSiblingId={gameObjectAt(controller.scene.objects, index - 1)}
            nextSiblingId={gameObjectAt(controller.scene.objects, index + 1)}
          />
        ))}
      </div>
    </>
  );
});

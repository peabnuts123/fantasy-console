import { type FunctionComponent } from "react";
import { observer } from "mobx-react-lite";

import { useLibrary } from "@lib/index";
import { AppTile } from "./AppTile";

export const ToolsMenu: FunctionComponent = observer(() => {
  const { ProjectController } = useLibrary();
  const { project } = ProjectController;

  return (
    <>
      <h2 className="text-h2 italic mb-3 font-serif text-retro-shadow">{project.manifest.projectName}</h2>
      <div className="grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 py-3">
        <AppTile href="/composer" label="Composer" description="Create, edit and arrange objects and scenes. Test your game." />
        <AppTile href="/player" label="Player" description="Play game cartridges." />
        <AppTile label="Soon&trade;" />
        <AppTile label="Soon&trade;" />
        <AppTile label="Soon&trade;" />
        <AppTile label="Soon&trade;" />
      </div>
    </>
  );
});

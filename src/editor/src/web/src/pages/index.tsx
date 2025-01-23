import { type FunctionComponent } from "react";
import { observer } from "mobx-react-lite";

import { useLibrary } from "@lib/index";
import Spinner from "@app/components/spinner";
import { ToolsMenu } from "@app/components/pages/index/ToolsMenu";
import { ProjectSelect } from "@app/components/pages/index/ProjectSelect";

const IndexPage: FunctionComponent = observer(() => {
  const { ProjectController } = useLibrary();

  return (
    <div className="flex flex-col p-4 h-full bg-gradient-to-b from-[blue] to-black text-white">
      <h1 className="text-h1 italic mb-3 font-serif text-retro-shadow">PolyZone</h1>
      {ProjectController.hasLoadedProject ? (
        <ToolsMenu />
      ) : ProjectController.isLoadingProject ? (
        <div className="flex justify-center items-center h-full">
          <Spinner inverted={true} message="Loading project..." />
        </div>
      ) : (
        <ProjectSelect />
      )}
    </div>
  );
});



export default IndexPage;

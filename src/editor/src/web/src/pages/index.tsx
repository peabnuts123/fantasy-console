import { useState, type FunctionComponent } from "react";
import { observer } from "mobx-react-lite";
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid'

import { useLibrary } from "@lib/index";
import Spinner from "@app/components/spinner";
import { ToolsMenu } from "@app/components/pages/index/ToolsMenu";
import { ProjectSelect } from "@app/components/pages/index/ProjectSelect";

const IndexPage: FunctionComponent = observer(() => {
  const { ProjectController } = useLibrary();
  const [currentError, setCurrentError] = useState<string | undefined>();

  return (
    <div className="flex flex-col p-4 h-full bg-gradient-to-b from-[blue] to-black text-white">
      <h1 className="text-h1 italic mb-3 font-serif text-retro-shadow">PolyZone</h1>
      {currentError ? (
        <div className="flex flex-col grow max-w-[800px] mx-auto">
          <div className="bg-slate-400 bg-opacity-40 p-4 ">
            <h2 className="text-h3 text-retro-shadow mb-4"><ExclamationTriangleIcon className="icon mr-1 icon-retro-shadow" /> Error</h2>
            <p className="mb-4">{currentError}</p>
            <button onClick={() => setCurrentError(undefined)} className="button ml-0">Okay</button>
          </div>
        </div>
      ) : ProjectController.hasLoadedProject ? (
        /* @TODO should this be a different route and we lift project select up to this component? */
        <ToolsMenu />
      ) : ProjectController.isLoadingProject ? (
        <div className="flex justify-center items-center h-full">
          <Spinner inverted={true} message="Loading project..." />
        </div>
      ) : (
        <ProjectSelect showError={setCurrentError} />
      )}
    </div>
  );
});



export default IndexPage;

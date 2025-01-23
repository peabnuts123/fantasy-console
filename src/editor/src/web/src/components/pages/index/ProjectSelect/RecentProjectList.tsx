import { useEffect, useState, type FunctionComponent } from "react";
import { open } from '@tauri-apps/plugin-dialog';
import { ArrowUpTrayIcon, DocumentIcon } from '@heroicons/react/24/outline'

import { useLibrary } from "@lib/index";
import { ApplicationData } from "@lib/application";
import { RecentProjectTile } from "./RecentProjectTile";


interface RecentProjectListProps {
  showCreateProjectScreen: () => void;
}

export const RecentProjectList: FunctionComponent<RecentProjectListProps> = ({ showCreateProjectScreen }) => {
  const { ProjectController, ApplicationDataController } = useLibrary();

  // State
  const [appData, setAppData] = useState<ApplicationData | undefined>(undefined);

  // Computed state
  const isAppDataLoaded = appData !== undefined;

  // Effects
  useEffect(() => {
    ApplicationDataController.getAppDataWithCallback((appData) => {
      // Load app data
      setAppData(appData);

      // Default to new project screen if there are no recent projects
      if (appData.recentProjects.length === 0) {
        showCreateProjectScreen();
      }
    });
  }, []);

  // Functions
  const loadProject = async () => {
    const selected = await open({
      filters: [{
        name: 'PolyZone Project',
        extensions: ['pzproj']
      }]
    }) as string | null;

    if (selected === null) return;

    await ProjectController.loadProject(selected);
  };

  return (
    <>
      <div className="flex flex-row justify-between mb-2">
        <h2 className="text-h2 text-retro-shadow font-serif mb-4">Recent projects</h2>

        <div className="flex flex-row">
          <button onClick={loadProject} className="button"><ArrowUpTrayIcon className="icon mr-1" /> Open project</button>
          <button onClick={showCreateProjectScreen} className="button"><DocumentIcon className="icon mr-1" /> New project</button>
        </div>
      </div>

      <div className="w-full mr-1 overflow-y-auto">
        {isAppDataLoaded && (
          appData.recentProjects.map((project, index) => (
            <RecentProjectTile key={index} project={project} />
          ))
        )}
      </div>
    </>
  )
};

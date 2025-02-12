import { ReactEventHandler, type FunctionComponent } from "react";
import { observer } from "mobx-react-lite";
import { XMarkIcon } from '@heroicons/react/24/outline';

import { useLibrary } from "@lib/index";
import { RecentProjectData } from "@lib/application";
import { ProjectFileNotFoundError } from "@lib/project/ProjectController";

export interface RecentProjectTileProps {
  project: RecentProjectData;
  showError: (error: string) => void;
}
export const RecentProjectTile: FunctionComponent<RecentProjectTileProps> = observer(({ project, showError }) => {
  // Hooks
  const { ProjectController, ApplicationDataController } = useLibrary();

  // Functions
  const loadProject = (): void => {
    void ProjectController.loadProject(project.path)
      .catch((e) => {
        if (e instanceof ProjectFileNotFoundError) {
          // Project file not found - remove project from recent project list
          void removeProjectFromRecentProjects().then(() => {
            showError(`Failed to open project: The project file at "${project.path}" no longer exists (likely it has been moved or deleted).`);
          });
        } else {
          throw e;
        }
      });
  };
  const removeProjectFromRecentProjects = async (): Promise<void> => {
    await ApplicationDataController.mutateAppData((appData) => {
      appData.recentProjects = appData.recentProjects.filter((recentProjectData) => recentProjectData.path !== project.path);
      return appData;
    });
  };
  const onClickRemoveButton: ReactEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    void removeProjectFromRecentProjects();
  };

  /**
   * Convert a path into segments, for better line-wrapping.
   * e.g. "/Users/jeff/Documents" => ["/Users", "/jeff", "Documents"]
   * e.g. "C:\Users\jeff\Documents" => ["C:\", "Users\", "jeff\", "Documents"]
   */
  const segmentifyPath = (path: string): string[] => {
    return path.split(/([\\\/])/)   // Split into segments via slashes like [`/`, `Users`, `/`, ...] or [`C:`, `\`, `Users`, ...]
      .filter(Boolean)                        // Remove falsey (empty) strings
      .reduce((curr, next, index) => { // Combine into tuplets e.g. [`/Users`, `/jeff`, ...]
        // Odd token: Append to previous
        if (index % 2 === 1) curr[curr.length - 1] += next;
        // Even token: Add new
        else curr.push(next);
        return curr;
      }, [] as string[]);
  };

  return (
    <button
      className="group flex flex-row items-stretch w-full text-left bg-slate-400 bg-opacity-40 mb-4 hover:bg-slate-500 hover:bg-opacity-40 active:bg-slate-700 active:bg-opacity-40"
      onClick={loadProject}
    >
      <div className="grow p-4">
        <div className="text-h3 text-retro-shadow is-shallow mb-1">{project.name}</div>
        <div className="text-sm text-gray-300">Last opened: {project.lastOpened.toLocaleString()}</div>
        {/* @NOTE flex-wrap block element spans just to make wrapping work normally 🥴 */}
        <div className="text-sm text-gray-300 flex flex-row flex-wrap">{segmentifyPath(project.path).map((pathSegment, index) => (
          <span key={index} className="block">{pathSegment}</span>
        ))}</div>
      </div>
      <div className="w-10 shrink-0 flex flex-row justify-end items-start opacity-0 group-hover:opacity-100 focus-within:opacity-100">
        <div
          role="button"
          tabIndex={0}
          className="hover:bg-slate-900 hover:bg-opacity-30 focus:bg-slate-900 focus:bg-opacity-30 p-2"
          onClick={onClickRemoveButton}
          onKeyDown={(e) =>
            ['Enter', ' '].includes(e.key) && onClickRemoveButton(e)
          }
        >
          <XMarkIcon className="icon" />
        </div>
      </div>
    </button>
  );
});

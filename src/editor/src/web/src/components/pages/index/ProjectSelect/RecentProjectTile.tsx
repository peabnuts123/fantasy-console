import { type FunctionComponent } from "react";
import { observer } from "mobx-react-lite";

import { useLibrary } from "@lib/index";
import { RecentProjectData } from "@lib/application";

export interface RecentProjectTileProps {
  project: RecentProjectData;
}
export const RecentProjectTile: FunctionComponent<RecentProjectTileProps> = observer(({ project }) => {
  // Hooks
  const { ProjectController } = useLibrary();

  // Functions
  const loadProject = () => {
    void ProjectController.loadProject(project.path);
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
        else curr.push(next)
        return curr;
      }, [] as string[])
  };

  return (
    <button
      className="block w-full text-left bg-slate-400 bg-opacity-40 mb-4 p-4 hover:bg-slate-500 hover:bg-opacity-40 active:bg-slate-700 active:bg-opacity-40"
      onClick={loadProject}
    >
      <div className="text-h3 text-retro-shadow is-shallow mb-1">{project.name}</div>
      <div className="text-sm text-gray-300">Last opened: {project.lastOpened.toLocaleString()}</div>
      {/* @NOTE flex-wrap block element spans just to make wrapping work normally 🥴 */}
      <div className="text-sm text-gray-300 flex flex-row flex-wrap">{segmentifyPath(project.path).map((pathSegment, index) => (
        <span key={index} className="block">{pathSegment}</span>
      ))}</div>
    </button>
  );
});
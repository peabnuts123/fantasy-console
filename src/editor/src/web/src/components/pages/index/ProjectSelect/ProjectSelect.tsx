import { useState, type FunctionComponent } from "react";
import { observer } from "mobx-react-lite";

import { NewProjectScreen } from "./NewProjectScreen";
import { RecentProjectList } from "./RecentProjectList";

export interface ProjectSelectProps {
  showError: (error: string) => void;
}
export const ProjectSelect: FunctionComponent<ProjectSelectProps> = observer(({ showError }) => {
  // State
  const [isCreatingNewProject, setIsCreatingNewProject] = useState<boolean>(false);

  return (
    <div className="flex flex-col grow overflow-y-hidden mx-auto w-full max-w-[500px] md:max-w-[650px] lg:max-w-[800px] xl:max-w-[1000px]">
      {isCreatingNewProject ? (
        <NewProjectScreen cancelCreate={() => setIsCreatingNewProject(false)} />
      ) : (
        <RecentProjectList
          showCreateProjectScreen={() => setIsCreatingNewProject(true)}
          showErrorMessage={showError}
        />
      )}
    </div>
  );
});

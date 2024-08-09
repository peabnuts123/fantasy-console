import { FunctionComponent } from "react";
import { observer } from "mobx-react-lite";

import SceneView from "@app/components/pages/composer/SceneView";
import { Condition } from '@app/components/util/condition';
import Spinner from "@app/components/spinner";
import { useComposer } from "@lib/composer/Composer";
import { SceneManifest } from "@lib/composer/project";


interface Props { }

const ProjectName: string = 'sample.pzproj'

const ComposerPage: FunctionComponent<Props> = observer(({ }) => {
  const Composer = useComposer();

  const loadProject = async () => {
    // @DEBUG just load a hard-coded project
    await Composer.loadProject(ProjectName);
  };

  const loadScene = async (scene: SceneManifest) => {
    await Composer.loadScene(scene);
  };

  return (
    <div className="page">
      <h1>Composer</h1>
      <Condition if={Composer.hasLoadedProject}
        then={() => (
          <>
            {/* @TODO one day, multiple tabs */}
            <h1>Project: {Composer.currentProjectManifest.projectName}</h1>

            <h2>Scenes</h2>
            <ul>
              {Composer.currentProject.scenes.map((sceneManifest) => (
                <li key={sceneManifest.path}>
                  <button onClick={() => loadScene(sceneManifest)}>Load Scene: {sceneManifest.path}</button>
                </li>
              ))}
            </ul>

            <Condition if={Composer.hasLoadedScene}
              then={() => (
                <SceneView scene={Composer.currentScene} />
              )}
            />
          </>
        )}
        else={() => (
          <>
            <Condition if={Composer.isLoadingProject}
              then={() => (
                <>
                  <Spinner message="Loading project..." />
                </>
              )}
              else={() => (
                <div>
                  <button onClick={() => loadProject()}>Load project</button>
                </div>
              )}
            />
          </>
        )}
      />
    </div>
  )
});



export default ComposerPage;

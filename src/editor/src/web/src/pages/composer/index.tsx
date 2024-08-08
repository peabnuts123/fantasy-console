import { FunctionComponent } from "react";
import { observer } from "mobx-react-lite";

import { SceneConfig } from "@fantasy-console/runtime/src/cartridge";

import SceneView from "@app/components/pages/composer/SceneView";
import { Condition } from '@app/components/util/condition';
import Spinner from "@app/components/spinner";
import { useComposer } from "@lib/composer/Composer";


interface Props { }

const ProjectName: string = 'sample.pzproj'

const ComposerPage: FunctionComponent<Props> = observer(({ }) => {
  const Composer = useComposer();

  // Computed state
  let firstScene: SceneConfig | undefined = undefined;
  if (Composer.hasLoadedProject) {
    firstScene = Composer.sceneDb.allScenes[0];
  }

  const loadProject = async () => {
    // @DEBUG just load a hard-coded project
    await Composer.loadProject(ProjectName);
  };

  const loadScene = async (scene: SceneConfig) => {
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
              {Composer.sceneDb.allScenes.map((scene) => (
                <li key={scene.path}>
                  <button onClick={() => loadScene(scene)}>Load Scene: {scene.path}</button>
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

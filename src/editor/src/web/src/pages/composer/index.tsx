import { FunctionComponent } from "react";
import { observer } from "mobx-react-lite";
import { open } from '@tauri-apps/api/dialog';

import SceneView from "@app/components/pages/composer/SceneView";
import { Condition } from '@app/components/util/condition';
import Spinner from "@app/components/spinner";
import { useComposer } from "@lib/composer/Composer";
import { SceneManifest } from "@lib/composer/project";


interface Props { }

const ComposerPage: FunctionComponent<Props> = observer(({ }) => {
  const Composer = useComposer();

  const loadProject = async () => {
    const selected = await open({
      filters: [{
        name: 'PolyZone Project',
        extensions: ['pzproj']
      }]
    }) as string | null;

    if (selected === null) return;

    await Composer.loadProject(selected);
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

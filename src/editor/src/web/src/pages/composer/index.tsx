import { FunctionComponent, useEffect, useState } from "react";
import "@babylonjs/core/Materials/standardMaterial";
import { observer } from "mobx-react-lite";

import SceneView from "@app/components/pages/composer/SceneView";
import { useComposer } from "@app/engine/composer/Composer";
import { Condition } from '@app/components/util/condition';

import Spinner from "@app/components/spinner";
import { SceneManifest } from "@app/engine/composer/project/scene";

interface Props { }

const ProjectName: string = 'sample.pzproj'

const ComposerPage: FunctionComponent<Props> = observer(({ }) => {
  const Composer = useComposer();

  // Computed state
  let firstScene: SceneManifest | undefined = undefined;
  if (Composer.hasLoadedProject) {
    firstScene = Composer.currentProject.sceneDb.allSceneManifests[0];
  }

  const loadProject = async () => {
    // @DEBUG just load a hard-coded project
    await Composer.loadProject(ProjectName);
  };

  const loadScene = async (sceneManifest: SceneManifest) => {
    await Composer.loadScene(sceneManifest);
  };

  return (
    <div className="page">
      <h1>Composer</h1>
      <Condition if={Composer.hasLoadedProject}
        then={() => (
          <Condition if={Composer.hasLoadedScene}
            then={() => (
              <SceneView scene={Composer.currentScene} />
            )}
            else={() => (
              <>
                {/* @TODO one day, multiple tabs */}
                <h1>Project: {Composer.currentProject.project.manifest.projectName}</h1>

                <h2>Scenes</h2>
                <ul>
                  {Composer.currentProject.sceneDb.allSceneManifests.map((sceneManifest) => (
                    <li key={sceneManifest.path}>
                      <button onClick={() => loadScene(sceneManifest)}>Load Scene: '{sceneManifest.path}'</button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          />
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

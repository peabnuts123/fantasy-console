import React, { FunctionComponent, useEffect, useRef } from "react";

import { SceneView as SceneViewEngine } from "@app/engine/composer/SceneView";
import { observer } from "mobx-react-lite";
import { Condition } from "@app/components/util/condition";
import Spinner from "@app/components/spinner";


interface Props {
  scene: SceneViewEngine;
}

const SceneViewComponent: FunctionComponent<Props> = observer(({ scene: SceneView }) => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !SceneView.hasLoaded) return;

    return SceneView.startBabylonView(canvas);
  }, [SceneView.hasLoaded]);

  return (
    <>
      <h1>Scene: {SceneView.manifest.path}</h1>
      <Condition if={SceneView.hasLoaded}
        then={() => (
          <>
            <h1>Viewport</h1>
            <canvas
              style={{ width: "100%" }}
              ref={canvasRef}
            />
          </>
        )}
        else={() => (
          <Condition if={SceneView.isLoading}
            then={() => (
              <Spinner message="Loading scene..." />
            )}
            else={() => (
              <code>Erk - invalid state</code>
            )}
          />
        )}
      />
    </>
  );
});

export default SceneViewComponent;

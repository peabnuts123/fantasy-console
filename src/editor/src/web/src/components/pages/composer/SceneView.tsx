import React, { FunctionComponent, useEffect, useRef } from "react";

import { SceneView as SceneViewEngine } from "@lib/composer/SceneView";
import { observer } from "mobx-react-lite";


interface Props {
  scene: SceneViewEngine;
}

const SceneViewComponent: FunctionComponent<Props> = observer(({ scene: SceneView }) => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    return SceneView.startBabylonView(canvas);
  }, [SceneView]);

  return (
    <>
      <h1>Scene: {SceneView.scene.path}</h1>
      <h1>Viewport</h1>
      <canvas
        style={{ width: "100%" }}
        ref={canvasRef}
      />
    </>
  );
});

export default SceneViewComponent;

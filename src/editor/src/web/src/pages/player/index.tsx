import { FunctionComponent, useEffect, useRef } from "react";

import { Runtime } from '@fantasy-console/runtime';

interface Props { }

const PlayerPage: FunctionComponent<Props> = ({ }) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvas.current) {
      const runtime = new Runtime(canvas.current);
      void runtime.run();
    }
  }, []);

  return (
    <div className="player">
      <canvas
        ref={canvas}
        className="player__canvas"
        width="640"
        height="480"
      />
    </div>
  );
};

export default PlayerPage;

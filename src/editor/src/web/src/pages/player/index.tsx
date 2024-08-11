import { FunctionComponent, useEffect, useRef } from "react";

import { Runtime } from '@fantasy-console/runtime';

// const CARTRIDGE_URL = `/sample-cartridge.pzcart`;
const CARTRIDGE_URL = `/debug.pzcart`;

interface Props { }

const PlayerPage: FunctionComponent<Props> = ({ }) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvas.current) {
      const runtime = new Runtime(canvas.current);

      void runtime.loadCartridge(CARTRIDGE_URL)
        .then(() =>
          runtime.run()
        );
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

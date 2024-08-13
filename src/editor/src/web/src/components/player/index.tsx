import { FunctionComponent, useEffect, useRef } from "react";

import { Runtime } from '@fantasy-console/runtime';

interface Props {
  cartridge: Uint8Array | string;
}

const Player: FunctionComponent<Props> = ({ cartridge }) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvas.current) {
      const runtime = new Runtime(canvas.current);

      void runtime.loadCartridge(cartridge)
        .then(() =>
          runtime.run()
        );

      return () => {
        runtime.dispose();
      };
    }
  }, [cartridge]);

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

export default Player;

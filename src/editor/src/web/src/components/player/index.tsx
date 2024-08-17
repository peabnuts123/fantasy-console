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
    <div className="grow relative">
      {/* @NOTE ye-olde absolute position hacks */}
      <div className="absolute top-0 right-0 left-0 bottom-0">
        <canvas
          ref={canvas}
          className="w-full h-full object-contain [image-rendering:_pixelated]"
          width="640"
          height="480"
        />
      </div>
    </div>
  );
};

export default Player;

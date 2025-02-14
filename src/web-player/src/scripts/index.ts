import { Runtime } from '@polyzone/runtime';

const CARTRIDGE_URL = `/sample-cartridge.pzcart`;

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement | null;
  if (!canvas) throw new Error('Canvas element not found');
  const fpsCounter = document.getElementById('debug_framerate') as HTMLDivElement | null;
  if (!fpsCounter) throw new Error('FPS counter element not found');

  const runtime = new Runtime(canvas);

  await runtime.loadCartridge(CARTRIDGE_URL);

  // Count number of frames drawn per second
  let framesDrawn = 0;
  runtime.onUpdate(() => {
    framesDrawn++;
  });
  setInterval(() => {
    console.log(`Frames drawn: ${framesDrawn}`);
    fpsCounter.innerText = `${framesDrawn}fps`;
    framesDrawn = 0;
  }, 1000);

  await runtime.run();
}

void main();
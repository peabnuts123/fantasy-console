import { Runtime } from '@fantasy-console/runtime';

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const fpsCounter = document.getElementById('debug_framerate') as HTMLDivElement;

  const runtime = new Runtime(canvas);

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
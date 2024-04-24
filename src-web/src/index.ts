import { Engine } from '@engine/fantasy_console';

// @NOTE v8 custom property
// Increase stack trace size for better view of Rust panics
(Error as any).stackTraceLimit = 50;

enum KeyCode {
  W = 0,
  A = 1,
  S = 2,
  D = 3,
}
const NativeCodeToKeyCodeMap: Record<string, KeyCode> = {
  'KeyW': KeyCode.W,
  'KeyA': KeyCode.A,
  'KeyS': KeyCode.S,
  'KeyD': KeyCode.D,
}

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');

  // Construct 3d rendering engine
  const engine = new Engine(canvas.width, canvas.height);

  // Load demo scene
  await engine.load_scene();

  const frameBuffer = engine.buffer;

  // Initialise all Alpha to 0xFF
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const pixelIndex = ((y * canvas.width) + x) * 4;
      frameBuffer[pixelIndex + 3] = 0xFF;                 /* A */
    }
  }

  // Initialize a new ImageData object
  let imageData = new ImageData(frameBuffer, canvas.width, canvas.height);

  let framesDrawn = 0;
  let lastFrameTime = performance.now();
  const draw: FrameRequestCallback = () => {
    // Draw the next frame into the frame buffer
    let currentFrameTime = performance.now();
    let deltaT = currentFrameTime - lastFrameTime;
    engine.update(deltaT / 1000);
    lastFrameTime = currentFrameTime;

    // Write frame buffer to canvas
    ctx!.putImageData(imageData, 0, 0);

    requestAnimationFrame(draw);

    // Count number of frames drawn
    framesDrawn++;
  }

  // Begin drawing
  requestAnimationFrame(draw);

  // Count number of frames drawn per second
  setInterval(() => {
    console.log(`Frames drawn: ${framesDrawn}`);
    framesDrawn = 0;
  }, 1000);


  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;

    const keyCode = NativeCodeToKeyCodeMap[event.code];
    if (keyCode !== undefined) {
      engine.on_key_press(keyCode);
    }
  });
  document.addEventListener('keyup', (event) => {
    const keyCode = NativeCodeToKeyCodeMap[event.code];
    if (keyCode !== undefined) {
      engine.on_key_release(keyCode);
    }
  });
}

void main();
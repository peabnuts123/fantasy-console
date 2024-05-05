import { Engine } from '@engine/fantasy_console';

// @NOTE v8 custom property
// Increase stack trace size for better view of Rust panics
(Error as any).stackTraceLimit = 50;

const ENABLE_DEBUG_FRAMERATE_COUNTER = true;

enum KeyCode {
  W = 0,
  A = 1,
  S = 2,
  D = 3,
  Shift = 4,
  Space = 5,
}
const NativeCodeToKeyCodeMap: Record<string, KeyCode> = {
  'KeyW': KeyCode.W,
  'KeyA': KeyCode.A,
  'KeyS': KeyCode.S,
  'KeyD': KeyCode.D,
  'ShiftLeft': KeyCode.Shift,
  'ShiftRight': KeyCode.Shift,
  'Space': KeyCode.Space,
}

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const fpsCounter = document.getElementById('debug_framerate') as HTMLDivElement;

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

  let mouseInputDelta = {
    x: 0,
    y: 0,
  };

  let framesDrawn = 0;
  let lastFrameTime = performance.now();
  const draw: FrameRequestCallback = () => {
    // Draw the next frame into the frame buffer
    let currentFrameTime = performance.now();
    let deltaT = currentFrameTime - lastFrameTime;
    engine.update(deltaT / 1000);
    lastFrameTime = currentFrameTime;

    // Write frame buffer to canvas
    ctx.putImageData(imageData, 0, 0);

    requestAnimationFrame(draw);
    // setTimeout(draw);

    // Count number of frames drawn
    framesDrawn++;

    engine.set_mouse_value(mouseInputDelta.x, mouseInputDelta.y);

    // Reset mouse input
    mouseInputDelta.x = 0;
    mouseInputDelta.y = 0;
  }

  // Begin drawing
  requestAnimationFrame(draw);
  // setTimeout(draw);

  // Count number of frames drawn per second
  setInterval(() => {
    console.log(`Frames drawn: ${framesDrawn}`);
    if (ENABLE_DEBUG_FRAMERATE_COUNTER) {
      fpsCounter.innerText = `${framesDrawn}fps`;
    }
    framesDrawn = 0;
  }, 1000);


  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;

    // console.log(`[DEBUG] Key code: ${event.code}`);
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


  // Pointer lock stuff
  canvas.addEventListener("click", async () => {
    if (!document.pointerLockElement) {
      await canvas.requestPointerLock();
    }
  });

  document.addEventListener("pointerlockchange", lockChangeAlert, false);
  function lockChangeAlert() {
    if (document.pointerLockElement === canvas) {
      console.log("The pointer lock status is now locked");
      document.addEventListener("mousemove", onMouseMove, false);
    } else {
      console.log("The pointer lock status is now unlocked");
      document.removeEventListener("mousemove", onMouseMove, false);
    }
  }

  function onMouseMove(e: MouseEvent) {
    mouseInputDelta.x += e.movementX;
    mouseInputDelta.y += e.movementY;
  }
}

void main();
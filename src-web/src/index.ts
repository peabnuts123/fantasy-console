import { Engine } from '@engine/fantasy_console';

// @NOTE v8 custom property
// Increase stack trace size for better view of Rust panics
(Error as any).stackTraceLimit = 50;

// FantasyConsole.run_gl_demo();

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');

  // Construct 3d rendering engine
  const engine = new Engine(canvas.width, canvas.height);

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
  const draw: FrameRequestCallback = () => {
    // Draw the next frame into the frame buffer
    engine.set_image_data();

    // Write frame buffer to canvas
    ctx!.putImageData(imageData, 0, 0);

    requestAnimationFrame(draw);

    // Count number of frames drawn
    framesDrawn++;
  }

  // Count number of frames drawn per second
  setInterval(() => {
    console.log(`Frames drawn: ${framesDrawn}`);
    framesDrawn = 0;
  }, 1000);

  requestAnimationFrame(draw);
}

void main();
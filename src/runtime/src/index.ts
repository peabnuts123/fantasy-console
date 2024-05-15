import { Engine } from '@fantasy-console/engine';

// @NOTE v8 custom property
// Increase stack trace size for better view of Rust panics
(Error as any).stackTraceLimit = 50;

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

export type OnUpdateCallback = () => void;
export type MouseInputDelta = { x: number, y: number };

export class Runtime {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private ctx: CanvasRenderingContext2D;
  private mouseInputDelta: MouseInputDelta;
  private lastFrameTime: number;
  private onUpdateCallbacks: OnUpdateCallback[];

  private imageData!: ImageData;


  public constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Ye-olde this-binding hacks
    this.update = this.update.bind(this);

    // Construct game engine instance
    this.engine = new Engine(canvas.width, canvas.height);

    // Initialise state
    this.ctx = canvas.getContext('2d')!;
    this.mouseInputDelta = { x: 0, y: 0 };
    this.lastFrameTime = performance.now();
    this.onUpdateCallbacks = [];
  }

  public onUpdate(callback: OnUpdateCallback): void {
    this.onUpdateCallbacks.push(callback);
  }

  public async run() {
    // Load sample cartridge
    // @TODO rename
    await this.engine.loadScene();

    // Initialise frame buffer
    const frameBuffer = this.engine.buffer; // @NOTE must be called last (after loading cartridge). Subsequent memory allocations can throw off this pointer.
    for (let y = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < this.canvas.width; x++) {
        const pixelIndex = ((y * this.canvas.width) + x) * 4;
        frameBuffer[pixelIndex + 3] = 0xFF;
      }
    }
    this.imageData = new ImageData(frameBuffer, this.canvas.width, this.canvas.height);

    // Begin drawing
    requestAnimationFrame(this.update);

    /* Input handling */
    document.addEventListener('keydown', (event) => this.onKeyDown(event));
    document.addEventListener('keyup', (event) => this.onKeyUp(event));


    /* Pointer lock stuff */
    this.canvas.addEventListener("click", async () => {
      if (!document.pointerLockElement) {
        await this.canvas.requestPointerLock();
      }
    });
    const onMouseMove = (e: MouseEvent) => {
      this.mouseInputDelta.x += e.movementX;
      this.mouseInputDelta.y += e.movementY;
    };
    document.addEventListener("pointerlockchange", () => {
      if (document.pointerLockElement === this.canvas) {
        document.addEventListener("mousemove", onMouseMove);
      } else {
        document.removeEventListener("mousemove", onMouseMove);
      }
    });

  }

  private update(): void {
    // Draw the next frame into the frame buffer
    let currentFrameTime = performance.now();
    let deltaT = currentFrameTime - this.lastFrameTime;
    this.engine.update(deltaT / 1000);
    this.lastFrameTime = currentFrameTime;

    // Write frame buffer to canvas
    this.ctx.putImageData(this.imageData, 0, 0);

    // Update mouse input state
    this.engine.set_mouse_value(this.mouseInputDelta.x, this.mouseInputDelta.y);

    // Reset mouse input
    this.mouseInputDelta.x = 0;
    this.mouseInputDelta.y = 0;

    // Invoke all `onUpdate` callbacks
    this.onUpdateCallbacks.forEach((callback) => callback());

    // Draw loop
    // setTimeout(draw);
    requestAnimationFrame(this.update);
  }

  private onKeyDown(event: KeyboardEvent) {
    if (event.repeat) return;

    const keyCode = NativeCodeToKeyCodeMap[event.code];
    if (keyCode !== undefined) {
      this.engine.on_key_press(keyCode);
    }
  }

  private onKeyUp(event: KeyboardEvent) {
    const keyCode = NativeCodeToKeyCodeMap[event.code];
    if (keyCode !== undefined) {
      this.engine.on_key_release(keyCode);
    }
  }
}

import { Runtime } from '@fantasy-console/runtime';

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const runtime = new Runtime(canvas);
  await runtime.run();
}

void main();
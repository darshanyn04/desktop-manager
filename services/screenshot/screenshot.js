import { captureFrame } from '../screen-stream/capture/index.js';

export async function takeScreenshot() {
  // capture() should already return a JPEG buffer
  const buffer = await captureFrame();
  return buffer;
}

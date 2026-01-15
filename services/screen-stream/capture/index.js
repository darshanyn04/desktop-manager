import { platform } from 'os';
import { captureMac } from './mac.js';
import { captureWindows } from './windows.js';
import { getCursorPosition } from './cursor.js';
import { overlayCursor } from './overlay.js';

export async function captureFrame() {
  const os = platform();

  let frame;

  if (os === 'darwin') frame = await captureMac();
  else if (os === 'win32') frame = await captureWindows();
  else throw new Error('Unsupported OS');

  const cursor = getCursorPosition();
  return overlayCursor(frame, cursor);
}

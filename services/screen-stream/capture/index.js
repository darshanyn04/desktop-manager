import { platform } from 'os';
import { captureMac } from './mac.js';
import { captureWindows } from './windows.js';

export async function captureFrame() {
  const os = platform();
  if (os === 'darwin') return captureMac();
  if (os === 'win32') return captureWindows();
  throw new Error('Unsupported OS');
}

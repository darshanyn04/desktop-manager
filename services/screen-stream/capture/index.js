import { platform } from 'os';
import { captureMac } from './mac.js';
import { captureWindows } from './windows.js';
import { captureLinux } from './linux.js';

export async function captureFrame() {
  const os = platform();
  if (os === 'darwin') return captureMac();
  if (os === 'win32') return captureWindows();
  if (os === 'linux') return captureLinux();
  throw new Error('Unsupported OS');
}

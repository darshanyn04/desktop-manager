import { isMac, isWindows } from '../../../common/osDetector.js';
import captureMac from './mac.js';
import captureWindows from './windows.js';

export default async function capture() {
  if (isMac()) return captureMac();
  if (isWindows()) return captureWindows();
  throw new Error('Unsupported OS');
}

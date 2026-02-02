import fs from 'fs';
import path from 'path';

// injected by screenStream
import { getLatestFrame } from './screenshotState.js';

export function takeScreenshot({
  save = true,
  dir = 'screenshots'
} = {}) {
  const frame = getLatestFrame();

  if (!frame) {
    throw new Error('No frame available yet');
  }

  if (!save) return frame;

  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(
    dir,
    `screenshot-${Date.now()}.jpg`
  );

  fs.writeFileSync(filePath, frame);
  console.log('📸 Screenshot saved:', filePath);

  return filePath;
}

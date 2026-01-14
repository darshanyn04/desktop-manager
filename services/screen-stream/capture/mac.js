import { exec } from 'child_process';
import sharp from 'sharp';

export async function captureMac() {
  await new Promise((resolve, reject) => {
    exec('screencapture -x -t jpg /tmp/fireflink-frame.jpg', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  return sharp('/tmp/fireflink-frame.jpg')
    .jpeg({ quality: 70 })
    .toBuffer();
}

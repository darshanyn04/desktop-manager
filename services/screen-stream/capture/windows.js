import screenshot from 'screenshot-desktop';
import sharp from 'sharp';

export default async function captureWindows() {
  const img = await screenshot({ format: 'jpg' });
  return sharp(img)
    .jpeg({ quality: 70 })
    .toBuffer();
}

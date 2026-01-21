import sharp from 'sharp';
import path from 'path';
import robot from 'robotjs';

const CURSOR_PATH = path.resolve('assets/cursor.png');

const HOTSPOT_X = 12;
const HOTSPOT_Y = 12;

export async function overlayCursor(frameBuffer, cursor) {
  const screen = robot.getScreenSize(); // logical size

  const image = sharp(frameBuffer);
  const meta = await image.metadata(); // physical size (retina-aware)

  const scaleX = meta.width / screen.width;
  const scaleY = meta.height / screen.height;

  const left = Math.round(
    cursor.x * scaleX - HOTSPOT_X * scaleX
  );
  const top = Math.round(
    cursor.y * scaleY - HOTSPOT_Y * scaleY
  );

  return image
    .composite([
      {
        input: CURSOR_PATH,
        left,
        top
      }
    ])
    .jpeg({ quality: 70 })
    .toBuffer();
}

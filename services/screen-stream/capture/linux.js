import { exec } from "child_process";
import sharp from "sharp";

const FRAME_PATH = "/tmp/fireflink-frame.jpg";
const FRAME_PATH_PNG = "/tmp/fireflink-frame.png";

function isWayland() {
  return !!process.env.WAYLAND_DISPLAY;
}

export async function captureLinux() {
  await new Promise((resolve, reject) => {
    const cmd = isWayland()
      // Wayland → grim (PNG only)
      ? `grim ${FRAME_PATH_PNG}`
      // X11 → ImageMagick
      : `import -window root ${FRAME_PATH}`;

    exec(cmd, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const input = isWayland() ? FRAME_PATH_PNG : FRAME_PATH;

  return sharp(input)
    .jpeg({ quality: 70 })
    .toBuffer();
}

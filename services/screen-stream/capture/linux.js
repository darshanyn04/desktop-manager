import { exec } from "child_process";
import sharp from "sharp";
import fs from "fs";

const FRAME_PATH = "/tmp/fireflink-frame.jpg";

function isWayland() {
  return !!process.env.WAYLAND_DISPLAY;
}

export default async function captureLinux() {
  const command = isWayland()
    ? `grim ${FRAME_PATH}`                             
    : `ffmpeg -y -f x11grab -i :0.0 -frames:v 1 ${FRAME_PATH}`; // X11

  await new Promise((resolve, reject) => {
    exec(command, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  return sharp(FRAME_PATH).jpeg({ quality: 70 }).toBuffer();
}

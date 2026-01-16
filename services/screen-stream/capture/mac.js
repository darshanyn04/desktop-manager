import { exec } from "child_process";
import sharp from "sharp";
import fs from "fs/promises";

const TMP = "/tmp/fireflink-frame.jpg";

export async function captureMacFrame() {
  await new Promise((resolve, reject) => {
    exec(`screencapture -x -t jpg ${TMP}`, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const buffer = await sharp(TMP)
    .jpeg({ quality: 70 })
    .toBuffer();

  return buffer;
}

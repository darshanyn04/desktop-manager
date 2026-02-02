import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

let recording = false;
let ffmpeg = null;
let outputFile = null;

const RECORDINGS_DIR = path.resolve('recordings');
const FPS = 24;

export function startLinuxRecording() {
  if (recording) return outputFile;

  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

  outputFile = path.join(
    RECORDINGS_DIR,
    `recording-${Date.now()}.mp4`
  );

  ffmpeg = spawn('ffmpeg', [
    '-y',
    '-f', 'x11grab',
    '-framerate', String(FPS),
    '-i', process.env.DISPLAY || ':0.0',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outputFile
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  recording = true;
  console.log('🎥 Linux recording started:', outputFile);
  return outputFile;
}

export async function stopLinuxRecording() {
  if (!recording) return null;

  recording = false;
  ffmpeg.kill('SIGINT');
  await new Promise(r => ffmpeg.once('exit', r));

  return outputFile;
}

export function linuxStatus() {
  return { recording, file: outputFile };
}

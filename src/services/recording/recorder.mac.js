import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { captureFrame } from '../screen-stream/capture/index.js';

let recording = false;
let ffmpeg = null;
let intervalId = null;
let outputFile = null;

const RECORDINGS_DIR = path.resolve('recordings');
const FPS = 5;

export function startMacRecording() {
  if (recording) return outputFile;

  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

  outputFile = path.join(
    RECORDINGS_DIR,
    `recording-${Date.now()}.mp4`
  );

  ffmpeg = spawn('ffmpeg', [
    '-y',
    '-f', 'image2pipe',
    '-framerate', String(FPS),
    '-vcodec', 'mjpeg',
    '-i', 'pipe:0',
    '-pix_fmt', 'yuv420p',
    '-vcodec', 'libx264',
    '-preset', 'veryfast',
    '-movflags', 'frag_keyframe+empty_moov+faststart',
    outputFile
  ], { stdio: ['pipe', 'ignore', 'pipe'] });

  ffmpeg.stderr.on('data', d => {
    console.error('[FFMPEG]', d.toString());
  });

  intervalId = setInterval(async () => {
    try {
      const buffer = await captureFrame();
      if (ffmpeg.stdin.writable) {
        ffmpeg.stdin.write(buffer);
      }
    } catch (err) {
      console.error('Recording capture error:', err);
    }
  }, 1000 / FPS);

  recording = true;
  console.log('🎥 macOS recording started:', outputFile);
  return outputFile;
}

export async function stopMacRecording() {
  if (!recording) return null;

  recording = false;
  clearInterval(intervalId);

  if (ffmpeg?.stdin?.writable) {
    ffmpeg.stdin.end();
  }

  await new Promise(resolve => ffmpeg.once('exit', resolve));

  console.log('🛑 macOS recording saved:', outputFile);
  return outputFile;
}

export function macStatus() {
  return { recording, file: outputFile };
}

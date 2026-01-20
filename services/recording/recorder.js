import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { frameBus } from '../../common/frameBus.js';

/* ---------------- CONFIG ---------------- */

const RECORDINGS_DIR = path.resolve('recordings');
const RECORD_WIDTH = 1920;
const RECORD_HEIGHT = 1080;
const FPS = 24;

/* ---------------- STATE ---------------- */

let recording = false;
let ffmpeg = null;
let outputFile = null;

/* ---------------- START ---------------- */

export function startRecording() {
  if (recording) return outputFile;

  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

  outputFile = path.join(
    RECORDINGS_DIR,
    `recording-${Date.now()}.mp4`
  );

  const platform = os.platform();

const ffmpegArgs = [
  '-y',
  '-loglevel', 'error',

  '-f', 'x11grab',
  '-framerate', String(FPS),
  '-i', process.env.DISPLAY || ':0.0',


  '-c:v', 'libx264',
  '-preset', 'veryfast',
  '-tune', 'zerolatency',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart+frag_keyframe+empty_moov',


  outputFile
];

  ffmpeg = spawn('ffmpeg', ffmpegArgs, {
    stdio: ['pipe', 'ignore', 'pipe']
  });

  ffmpeg.stderr.on('data', d => {
    console.error('[FFMPEG]', d.toString());
  });

  frameBus.on('frame', onFrame);

  recording = true;
  console.log('🎥 Recording started:', outputFile);

  return outputFile;
}
/* ---------------- FRAME HANDLER ---------------- */

function onFrame(buffer) {
  if (!recording || !buffer) return;

  if (ffmpeg?.stdin?.writable) {
    ffmpeg.stdin.write(buffer);
  }
}


export async function stopRecording() {
  if (!recording) return null;

  recording = false;

  if (!ffmpeg) return null;

  console.log('🛑 Stopping recording...');

  // ✅ Properly stop FFmpeg
  ffmpeg.kill('SIGINT');

  await new Promise((resolve) => {
    ffmpeg.once('exit', resolve);
  });

  ffmpeg = null;

  if (!fs.existsSync(outputFile)) {
    console.error('❌ Recording failed: file not created');
    return null;
  }

  console.log('✅ Recording saved:', outputFile);
  return outputFile;
}

export function status() {
  return {
    recording,
    file: outputFile,
    resolution: `${RECORD_WIDTH}x${RECORD_HEIGHT}`,
    fps: FPS,
    platform: os.platform()
  };
}

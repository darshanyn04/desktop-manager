import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { frameBus } from '../../common/frameBus.js';

/* ---------------- CONFIG ---------------- */

const RECORDINGS_DIR = path.resolve('recordings');
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
  let ffmpegArgs = [];

  /* ================= MACOS (MJPEG PIPE) ================= */

  if (platform === 'darwin') {
    ffmpegArgs = [
      '-y',
      '-loglevel', 'error',

      // 🔑 INPUT: MJPEG frames from Swift
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-framerate', String(FPS),
      '-i', 'pipe:0',

      // 🔑 OUTPUT
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-tune', 'zerolatency',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart+frag_keyframe+empty_moov',

      outputFile
    ];
  }

  /* ================= LINUX (X11) ================= */

  else if (platform === 'linux') {
    ffmpegArgs = [
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
  }

  /* ================= WINDOWS ================= */

  else if (platform === 'win32') {
    ffmpegArgs = [
      '-y',
      '-loglevel', 'error',

      '-f', 'gdigrab',
      '-framerate', String(FPS),
      '-i', 'desktop',

      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-tune', 'zerolatency',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart+frag_keyframe+empty_moov',

      outputFile
    ];
  }

  else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  ffmpeg = spawn('ffmpeg', ffmpegArgs, {
    stdio: platform === 'darwin'
      ? ['pipe', 'ignore', 'pipe'] // mac needs stdin
      : ['ignore', 'ignore', 'pipe']
  });

  ffmpeg.stderr.on('data', d => {
    console.error('[FFMPEG]', d.toString());
  });

  // 🔥 Only macOS uses frameBus
  if (platform === 'darwin') {
    frameBus.on('frame', onMacFrame);
  }

  recording = true;
  console.log(`🎥 Recording started (${platform}):`, outputFile);

  return outputFile;
}

/* ---------------- MAC FRAME HANDLER ---------------- */

function onMacFrame(buffer) {
  if (!recording || !buffer) return;
  if (ffmpeg?.stdin?.writable) {
    ffmpeg.stdin.write(buffer);
  }
}

/* ---------------- STOP ---------------- */

export async function stopRecording() {
  if (!recording || !ffmpeg) return null;

  recording = false;
  const platform = os.platform();

  console.log('🛑 Stopping recording...');

  if (platform === 'darwin') {
    frameBus.off('frame', onMacFrame);
    ffmpeg.stdin.end(); // MJPEG pipe
  } else {
    ffmpeg.kill('SIGINT'); // direct capture
  }

  await new Promise(resolve => {
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

/* ---------------- STATUS ---------------- */

export function status() {
  return {
    recording,
    file: outputFile,
    fps: FPS,
    platform: os.platform()
  };
}

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

let recording = false;
let ffmpeg = null;
let outputFile = null;

const RECORDINGS_DIR = path.resolve('recordings');
const FPS = 24;

export function startWindowsRecording() {
  if (recording) return outputFile;

  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

  outputFile = path.join(
    RECORDINGS_DIR,
    `recording-${Date.now()}.mp4`
  );

  ffmpeg = spawn(
    'ffmpeg',
    [
      '-y',

      // Windows desktop capture
      '-f', 'gdigrab',
      '-framerate', String(FPS),
      '-i', 'desktop',

      // Stabilize timestamps
      '-vsync', '1',

      // Encoding
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-pix_fmt', 'yuv420p',

      // Required for clean MP4
      '-movflags', '+faststart',

      outputFile
    ],
    {
      stdio: ['pipe', 'ignore', 'pipe'] // 🔴 stdin ENABLED
    }
  );

  ffmpeg.stderr.on('data', d => {
    const msg = d.toString().trim();
    if (msg) console.log('[ffmpeg]', msg);
  });

  ffmpeg.on('exit', (code, signal) => {
    console.log(
      `🛑 Windows recording stopped (code=${code}, signal=${signal})`
    );
    recording = false;
    ffmpeg = null;
  });

  recording = true;
  console.log('🎥 Windows recording started:', outputFile);
  return outputFile;
}

export async function stopWindowsRecording() {
  if (!recording || !ffmpeg) return null;

  recording = false;

  // ✅ Proper Windows-safe stop
  try {
    ffmpeg.stdin.write('q\n');
  } catch {
    ffmpeg.kill('SIGTERM');
  }

  await new Promise(resolve => ffmpeg.once('exit', resolve));

  return outputFile;
}

export function windowsStatus() {
  return { recording, file: outputFile };
}

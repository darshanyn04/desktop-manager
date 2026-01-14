import { spawn } from 'child_process';
import { frameBus } from '../../common/frameBus.js';
import fs from 'fs';
import path from 'path';

let recording = false;
let ffmpeg = null;
let outputFile = null;

const RECORDINGS_DIR = path.resolve('recordings');

export function startRecording() {
  if (recording) return outputFile;

  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

  const ts = Date.now();
  outputFile = path.join(RECORDINGS_DIR, `recording-${ts}.mp4`);

//   ffmpeg = spawn('ffmpeg', [
//     '-y',
//     '-f', 'image2pipe',       // feed images as a stream
//     '-vcodec', 'mjpeg',       // input codec
//     '-r', '30',               // optional input FPS
//     '-i', 'pipe:0',           // stdin
//     '-movflags', 'frag_keyframe+empty_moov+faststart',
//     '-pix_fmt', 'yuv420p',
//     '-vcodec', 'libx264',
//     '-preset', 'veryfast',
//     '-tune', 'zerolatency',
//     outputFile
//   ], {
//     stdio: ['pipe', 'ignore', 'ignore']
//   });
ffmpeg = spawn('ffmpeg', [
  '-y',
  '-f', 'image2pipe',
  '-vcodec', 'mjpeg',
  '-i', 'pipe:0',
  '-framerate', '5',   // output framerate
  '-movflags', 'frag_keyframe+empty_moov+faststart',
  '-pix_fmt', 'yuv420p',
  '-vcodec', 'libx264',
  '-preset', 'veryfast',
  '-tune', 'zerolatency',
  outputFile
], { stdio: ['pipe', 'ignore', 'ignore'] });


  const onFrame = ({ buffer }) => {
    if (recording && ffmpeg?.stdin.writable) {
      ffmpeg.stdin.write(buffer);
    }
  };

  frameBus.on('frame', onFrame);

  recording = true;
  console.log('🎥 Real-time recording started:', outputFile);

  return outputFile;
}

export async function stopRecording() {
  if (!recording) return null;

  recording = false;
  frameBus.removeAllListeners('frame');

  if (ffmpeg?.stdin.writable) ffmpeg.stdin.end();

  // Wait for FFmpeg to finish writing the file
  await new Promise((resolve) => {
    ffmpeg.on('exit', resolve);
  });

  ffmpeg = null;
  console.log('🛑 Recording stopped, file finalized:', outputFile);

  return outputFile;
}


export function status() {
  return {
    recording,
    file: outputFile
  };
}

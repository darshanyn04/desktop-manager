import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export const linuxCaptureEmitter = new EventEmitter();

let proc = null;
let buffer = Buffer.alloc(0);

export function startLinuxCapture({
  fps = 10,
  width = 1280,
  height = 720
} = {}) {
  if (proc) return;

  console.log('🐧 Starting Linux screen capture (X11 / XWayland)');

  proc = spawn(
    'ffmpeg',
    [
      '-loglevel', 'error',
      '-f', 'x11grab',
      '-framerate', String(fps),
      '-i', process.env.DISPLAY || ':0',

      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-q:v', '5',
      '-flush_packets', '1',
      'pipe:1'
    ],
    {
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

  proc.stdout.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (true) {
      const soi = buffer.indexOf(Buffer.from([0xff, 0xd8]));
      const eoi = buffer.indexOf(Buffer.from([0xff, 0xd9]), soi + 2);

      if (soi === -1 || eoi === -1) break;

      const frame = buffer.slice(soi, eoi + 2);
      buffer = buffer.slice(eoi + 2);

      linuxCaptureEmitter.emit('frame', frame);
    }
  });

  proc.stderr.on('data', (d) => {
    console.warn('[ffmpeg]', d.toString().trim());
  });

  proc.on('exit', () => {
    console.log('🛑 Linux capture stopped');
    proc = null;
    buffer = Buffer.alloc(0);
  });
}

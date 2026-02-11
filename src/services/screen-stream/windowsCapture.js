import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export const windowsCaptureEmitter = new EventEmitter();

let proc = null;
let buffer = Buffer.alloc(0);

export function startWindowsCapture({
  fps = 10,
  width = 1280,
  height = 720
} = {}) {
  if (proc) {
    console.warn('⚠️ [WIN-FFMPEG] Capture already running');
    return;
  }

  console.log('🪟 [WIN-FFMPEG] Starting Windows screen capture');
  console.log(`🎯 [WIN-FFMPEG] fps=${fps}, resolution=${width}x${height}`);

  proc = spawn(
    'ffmpeg',
   [
  '-loglevel', 'info',

  '-f', 'gdigrab',
  '-framerate', String(fps),
  '-i', 'desktop',

  '-vf',
  `scale=${width}:${height}:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`,

  '-f', 'image2pipe',
  '-vcodec', 'mjpeg',
  '-q:v', '5',
  '-flush_packets', '1',

  'pipe:1'
]
,
    {
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

  proc.on('spawn', () => {
    console.log('✅ [WIN-FFMPEG] ffmpeg process spawned');
  });

  // 📸 MJPEG frame parsing (unchanged)
  proc.stdout.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (true) {
      const soi = buffer.indexOf(Buffer.from([0xff, 0xd8]));
      const eoi = buffer.indexOf(Buffer.from([0xff, 0xd9]), soi + 2);

      if (soi === -1 || eoi === -1) break;

      const frame = buffer.slice(soi, eoi + 2);
      buffer = buffer.slice(eoi + 2);

      windowsCaptureEmitter.emit('frame', frame);
    }
  });

  // 📜 ffmpeg logs (errors, warnings, info)
  proc.stderr.on('data', (d) => {
    const msg = d.toString().trim();
    if (msg.length) {
      console.log(`[ffmpeg] ${msg}`);
    }
  });

  proc.on('exit', (code, signal) => {
    console.log(
      `🛑 [WIN-FFMPEG] ffmpeg exited (code=${code}, signal=${signal})`
    );
    proc = null;
    buffer = Buffer.alloc(0);
  });

  proc.on('error', (err) => {
    console.error('🔥 [WIN-FFMPEG] Failed to start ffmpeg:', err);
  });
}

export function stopWindowsCapture() {
  if (!proc) {
    console.warn('⚠️ [WIN-FFMPEG] Capture not running');
    return;
  }

  console.log('🛑 [WIN-FFMPEG] Stopping capture');
  proc.kill('SIGINT');
  proc = null;
  buffer = Buffer.alloc(0);
}

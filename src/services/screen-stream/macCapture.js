import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export const macCaptureEmitter = new EventEmitter();

let proc = null;
let buffer = Buffer.alloc(0);

export function startMacCapture() {
  if (proc) return;

  proc = spawn(
    './mac-capture/.build/release/mac-capture',
    [],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  proc.stderr.on('data', d => {
    if (d.toString().includes('READY')) {
      console.log('✅ Swift capture ready');
    }
  });

  proc.stdout.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= 4) {
      const frameLength = buffer.readUInt32BE(0);
      if (buffer.length < 4 + frameLength) break;

      const frame = buffer.slice(4, 4 + frameLength);
      buffer = buffer.slice(4 + frameLength);

      macCaptureEmitter.emit('frame', frame);
    }
  });

  proc.on('exit', () => {
    proc = null;
  });
}

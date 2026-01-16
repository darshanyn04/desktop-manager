import { WebSocketServer } from 'ws';
import { startMacCapture, macCaptureEmitter } from './macCapture.js';

let wss = null;

export function startScreenStream({ port = 9500 } = {}) {
  if (wss) return;

  wss = new WebSocketServer({ port });
  console.log(`📺 WS stream on ws://localhost:${port}`);

  startMacCapture();

  macCaptureEmitter.on('frame', frame => {
    for (const client of wss.clients) {
      if (client.readyState === 1) {
        client.send(frame);
      }
    }
  });
}

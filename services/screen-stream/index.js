import { WebSocketServer } from 'ws';
import { frameBus } from '../../common/frameBus.js';
import { captureFrame } from './capture/index.js';

let intervalId = null;

export function startScreenStream({ fps = 5, port = 9500 } = {}) {
  const wss = new WebSocketServer({ port });
  console.log(`📺 Screen stream WS server running on ws://localhost:${port}`);

  // Broadcast MJPEG frames to all connected clients
  wss.on('connection', (ws) => {
    console.log('🔗 Client connected to MJPEG stream');
  });

  intervalId = setInterval(async () => {
    try {
      const buffer = await captureFrame();
      frameBus.emit('frame', { buffer });

      // Send to all WS clients
      wss.clients.forEach((client) => {
        if (client.readyState === 1) { // 1 = OPEN
          client.send(buffer);
        }
      });
    } catch (err) {
      console.error('Error capturing frame:', err);
    }
  }, 1000 / fps);
}

export function stopScreenStream() {
  clearInterval(intervalId);
}

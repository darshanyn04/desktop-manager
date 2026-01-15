import { WebSocketServer } from 'ws';
import { frameBus } from '../../common/frameBus.js';
import { captureFrame } from './capture/index.js';

let intervalId = null;
let wss = null;

export function startScreenStream({ fps = 5, port = 9500 } = {}) {
  if (wss) {
    console.log('📺 Screen stream already running');
    return;
  }

  wss = new WebSocketServer({ port });
  console.log(`📺 Screen stream WS server running on ws://localhost:${port}`);

  // Broadcast MJPEG frames to all connected clients
  wss.on('connection', (ws) => {
    console.log('🔗 Client connected to MJPEG stream');

    ws.on('close', () => {
      console.log('❌ Client disconnected from MJPEG stream');

      // If no clients remain, stop streaming
      if (wss.clients.size === 0) {
        console.log('🛑 No clients connected, stopping screen capture');
        stopScreenStream();
      }
    });
  });

  intervalId = setInterval(async () => {
    try {
      if (wss.clients.size === 0) return; // safety check

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
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('🛑 Screen streaming interval stopped');
  }

  if (wss) {
    wss.close(() => {
      console.log('🛑 WebSocket server closed');
    });
    wss = null;
  }
}

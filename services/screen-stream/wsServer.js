import { WebSocketServer } from 'ws';
import capture from './capture/index.js';

export function startWsServer({ port = 9200, fps = 5 } = {}) {
  const wss = new WebSocketServer({ port });

  console.log(`🔥 Screen WS Stream running on ws://0.0.0.0:${port}`);

  wss.on('connection', (ws) => {
    console.log('📡 Client connected → starting stream');

    const interval = setInterval(async () => {
      try {
        const frame = await capture();
        if (ws.readyState === ws.OPEN) {
          ws.send(frame);
        }
      } catch (err) {
        console.error('❌ Capture error:', err.message);
      }
    }, 1000 / fps);

    ws.on('close', () => {
      console.log('🛑 Client disconnected → stopping stream');
      clearInterval(interval);
    });
  });

  return wss;
}

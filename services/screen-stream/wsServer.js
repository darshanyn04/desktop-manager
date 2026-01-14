import { WebSocketServer } from 'ws';
import { frameBus } from '../../common/frameBus.js';

export function startWsServer({ port }) {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws) => {
    console.log('📡 WS client connected');

    const onFrame = ({ buffer }) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(buffer);
      }
    };

    frameBus.on('frame', onFrame);

    ws.on('close', () => {
      frameBus.off('frame', onFrame);
      console.log('❌ WS client disconnected');
    });
  });

  console.log(`📡 MJPEG WS streaming on ws://0.0.0.0:${port}`);
}

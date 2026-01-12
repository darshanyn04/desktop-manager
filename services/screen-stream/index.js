import { startWsServer } from './wsServer.js';

export function start(config = {}) {
  return startWsServer(config);
}

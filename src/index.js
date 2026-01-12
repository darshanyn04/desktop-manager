import { start } from '../services/screen-stream/index.js';

const PORT = process.env.STREAM_PORT || 9200;
const FPS = process.env.STREAM_FPS || 5;

start({
  port: Number(PORT),
  fps: Number(FPS),
});

import express from 'express';
import { registerRecordingRoutes } from '../services/recording/index.js';
import { registerScreenshotRoutes } from '../services/screenshot/index.js';
import { startScreenStream } from '../services/screen-stream/index.js';

const app = express();
const PORT = 9400;

startScreenStream({ fps: 5, port: 9500 });

registerRecordingRoutes(app);
registerScreenshotRoutes(app);

app.get('/health', (_, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`🚀 Desktop Manager running on http://localhost:${PORT}`);
});

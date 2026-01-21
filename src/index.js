import express from 'express';
import { startScreenStream } from '../services/screen-stream/index.js';
import { registerRecordingRoutes } from '../services/recording/index.js';
import { takeScreenshot } from '../services/screen-stream/index.js';

const app = express();
const PORT = 9400;

startScreenStream({ port: 9500 });

registerRecordingRoutes(app);

app.get('/health', (_, res) => res.send('OK'));

app.get('/api/screenshot', (req, res) => {
  try {
    const frame = takeScreenshot();

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.send(frame);
  } catch (err) {
    res.status(409).json({
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Desktop Manager running on http://localhost:${PORT}`);
});

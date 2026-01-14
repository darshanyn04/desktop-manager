import express from 'express';
import { registerRecordingRoutes } from '../services/recording/index.js';
import { startScreenStream } from '../services/screen-stream/index.js';

const app = express();
const PORT = 9400;

// Start screen stream WS server
startScreenStream({ fps: 5, port: 9500 });

// Register recording routes
registerRecordingRoutes(app);

// Health check
app.get('/health', (_, res) => res.send('OK'));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Desktop Manager running on http://localhost:${PORT}`);
});

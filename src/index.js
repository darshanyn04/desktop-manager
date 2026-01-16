import express from 'express';
import { startScreenStream } from '../services/screen-stream/index.js';

const app = express();
const PORT = 9400;

startScreenStream({ port: 9500 });

app.get('/health', (_, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`🚀 Desktop Manager running on http://localhost:${PORT}`);
});

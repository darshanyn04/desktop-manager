import express from 'express';
import fs from 'fs';
import path from 'path';
import { startRecording, stopRecording, status } from './recorder.js';


export function registerRecordingRoutes(app) {
  const router = express.Router();

  router.post('/start', (req, res) => {
    startRecording();
    res.json({ success: true });
  });

router.post('/stop', async (req, res) => {
  const filePath = await stopRecording();

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(400).json({ error: 'No recording found' });
  }

  const filename = path.basename(filePath);
  const stat = fs.statSync(filePath);

  res.writeHead(200, {
    'Content-Type': 'video/mp4',
    'Content-Length': stat.size,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Connection': 'close'
  });

  const stream = fs.createReadStream(filePath);

  stream.pipe(res);

  res.on('finish', () => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('❌ Failed to delete recording:', err);
      } else {
        console.log('🗑️ Recording file deleted:', filePath);
      }
    });
  });
});




  router.get('/status', (req, res) => {
    res.json(status());
  });

  app.use('/recording', router);
}

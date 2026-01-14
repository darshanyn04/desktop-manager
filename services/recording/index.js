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

  router.post('/stop', (req, res) => {
    const filePath = stopRecording();

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(400).json({ error: 'No recording found' });
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${path.basename(filePath)}"`
    );
    res.setHeader('Content-Length', fs.statSync(filePath).size);

    fs.createReadStream(filePath).pipe(res);
  });

  router.get('/status', (req, res) => {
    res.json(status());
  });

  app.use('/recording', router);
}

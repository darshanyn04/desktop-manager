import express from 'express';
import { takeScreenshot } from './screenshot.js';

export function registerScreenshotRoutes(app) {
  const router = express.Router();

  // 📸 Binary screenshot
  router.get('/', async (req, res) => {
    try {
      const buffer = await takeScreenshot();

      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 📸 Base64 screenshot (optional)
  router.get('/base64', async (req, res) => {
    try {
      const buffer = await takeScreenshot();
      res.json({
        image: buffer.toString('base64')
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.use('/screenshot', router);
}

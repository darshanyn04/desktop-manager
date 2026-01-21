import express from "express";
import { startScreenStream, takeScreenshot } from "./services/screen-stream/index.js";
import { registerRecordingRoutes } from "./services/recording/index.js";

export function createDesktopManager({
  apiPort = 9400,
  streamPort = 9500
} = {}) {
  const app = express();

  startScreenStream({ port: streamPort });
  registerRecordingRoutes(app);

  app.get("/health", (_, res) => res.send("OK"));

  app.get("/api/screenshot", async (_, res) => {
    try {
      const frame = await takeScreenshot();

      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Cache-Control", "no-store");
      res.send(frame);
    } catch (err) {
      res.status(409).json({ error: err.message });
    }
  });

  const server = app.listen(apiPort, () => {
    console.log(
      `🚀 Desktop Manager running on http://localhost:${apiPort}`
    );
  });

  return { app, server };
}

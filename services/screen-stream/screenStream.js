import { WebSocketServer } from "ws";
import os from "os";
import { frameBus } from "../../common/frameBus.js";
import { captureFrame } from "./capture/index.js";

/* ---------------- STATE ---------------- */

let wss = null;
let intervalId = null;
let capturing = false;
let capturingFrame = false;

let currentFps = 10;
let currentPort = 9500;

/* ---------------- PUBLIC API ---------------- */

export function startScreenStream({ fps = 10, port = 9500 } = {}) {
  currentFps = fps;
  currentPort = port;

  if (wss) {
    console.log(`⚙️ Screen stream already running → FPS ${fps}`);
    return;
  }

  wss = new WebSocketServer({ port });
  console.log(`📺 WS Screen Stream → ws://localhost:${port}`);

  wss.on("connection", (ws) => {
    console.log("🔗 Client connected");

    if (!capturing) startCaptureLoop();

    ws.on("close", () => {
      console.log("❌ Client disconnected");
      if (wss.clients.size === 0) stopCaptureLoop();
    });
  });
}

export function shutdownScreenStream() {
  stopCaptureLoop();

  if (wss) {
    wss.close();
    wss = null;
    console.log("🛑 Screen stream stopped");
  }
}

/* ---------------- CAPTURE LOOP ---------------- */

function startCaptureLoop() {
  if (intervalId) return;

  capturing = true;
  console.log(`▶️ Capturing @ ${currentFps} FPS`);

  intervalId = setInterval(captureTick, 1000 / currentFps);
}

function stopCaptureLoop() {
  if (!intervalId) return;

  clearInterval(intervalId);
  intervalId = null;
  capturing = false;
  capturingFrame = false;

  console.log("⏸️ Capture paused (no clients)");
}

/* ---------------- FRAME CAPTURE ---------------- */

async function captureTick() {
  if (!wss || wss.clients.size === 0) return;
  if (capturingFrame) return;

  capturingFrame = true;

  try {
    const buffer = await captureFrame();
    if (!buffer) return;

    // recorder / other consumers
    frameBus.emit("frame", { buffer });

    // WS broadcast
    for (const client of wss.clients) {
      if (client.readyState === 1) {
        client.send(buffer);
      }
    }
  } catch (err) {
    console.error("❌ Capture error:", err.message);
  } finally {
    capturingFrame = false;
  }
}

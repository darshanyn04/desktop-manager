import os from 'os';
import { WebSocketServer } from 'ws';
import { getLatestFrame, setLatestFrame } from '../recording/screenshotState.js';


import {
  startMacCapture,
  macCaptureEmitter
} from './macCapture.js';

import {
  startLinuxCapture,
  linuxCaptureEmitter
} from './linuxCapture.js';

import {
  startWindowsCapture,
  stopWindowsCapture,
  windowsCaptureEmitter
} from './windowsCapture.js';

let wss = null;
let frameEmitter = null;
let activeClients = 0;
let captureStarted = false;

export function startScreenStream({ port = 9500 } = {}) {
  if (wss) return;

  const platform = os.platform();

  wss = new WebSocketServer({ port });
  console.log(`📺 WS server listening on ws://localhost:${port}`);

  // 🔌 Client connected
  wss.on('connection', (ws) => {
    activeClients++;
    console.log(`🔌 WS client connected (${activeClients} total)`);

    // 🚀 Start capture ONLY on first client
    if (!captureStarted) {
      console.log('▶️ Starting screen capture');

      if (platform === 'darwin') {
        startMacCapture();
        frameEmitter = macCaptureEmitter;
      }
      else if (platform === 'linux') {
        startLinuxCapture();
        frameEmitter = linuxCaptureEmitter;
      }
      else if (platform === 'win32') {
        startWindowsCapture();
        frameEmitter = windowsCaptureEmitter;
      }
      else {
        console.warn(`⚠️ Unsupported platform: ${platform}`);
        return;
      }

      // 📤 Broadcast frames
      frameEmitter.on('frame', broadcastFrame);
      captureStarted = true;
    }

    // 🔌 Client disconnected
    ws.on('close', () => {
      activeClients--;
      console.log(`❌ WS client disconnected (${activeClients} remaining)`);

      // 🛑 Stop capture when no clients left
      if (activeClients === 0 && captureStarted) {
        console.log('⏹️ Stopping screen capture (no clients)');
        stopCapture(platform);
        captureStarted = false;
      }
    });
  });
}

function broadcastFrame(frame) {
  setLatestFrame(frame);
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(frame, { binary: true });
    }
  }
}

function stopCapture(platform) {
  if (platform === 'win32') stopWindowsCapture();
}

export function takeScreenshot() {
  const frame = getLatestFrame();

  if (!frame) {
    throw new Error('No frame available yet (stream not started)');
  }

  return frame;
}


// import os from 'os';
// import { WebSocketServer } from 'ws';
// import { startMacCapture, macCaptureEmitter } from './macCapture.js';

// let wss = null;

// export function startScreenStream({ port = 9500 } = {}) {
//   if (wss) return;

//   const platform = os.platform();

//   if (platform === 'darwin') {
//     console.warn(`Screen streaming not supported on ${platform}. macOS only.`);
//     startMacCapture();

//     return;
//   }
//   else if (platform === 'linux') {
//     console.warn('Screen streaming already started.');
//     return;
//   }

//   wss = new WebSocketServer({ port });
//   console.log(`📺 WS stream on ws://localhost:${port}`);

//   macCaptureEmitter.on('frame', (frame) => {
//     for (const client of wss.clients) {
//       if (client.readyState === 1) {
//         client.send(frame, { binary: true });
//       }
//     }
//   });
// }
import os from 'os';
import { WebSocketServer } from 'ws';

import {
  startMacCapture,
  macCaptureEmitter
} from './macCapture.js';

import {
  startLinuxCapture,
  linuxCaptureEmitter
} from './linuxCapture.js';

// import {
//   startWindowsCapture
// } from './windowsCapture.js';

let wss = null;

export function startScreenStream({ port = 9500 } = {}) {
  if (wss) return;

  const platform = os.platform();

  // WS is platform-agnostic
  wss = new WebSocketServer({ port });
  console.log(`📺 WS stream on ws://localhost:${port}`);

  let frameEmitter = null;

  if (platform === 'darwin') {
    startMacCapture();
    frameEmitter = macCaptureEmitter;

  } else if (platform === 'linux') {
    startLinuxCapture();
    frameEmitter = linuxCaptureEmitter;
  }
  // } else if (platform === 'win32') {
  //   startWindowsCapture();
  //   return;
  // } 
  else {
    console.warn(`⚠️ Unsupported platform: ${platform}`);
    return;
  }

  // 🔁 Unified broadcast path
  frameEmitter.on('frame', (frame) => {
    for (const client of wss.clients) {
      if (client.readyState === 1) {
        client.send(frame, { binary: true });
      }
    }
  });
}

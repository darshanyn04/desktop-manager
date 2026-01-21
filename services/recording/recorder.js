import os from 'os';

import {
  startMacRecording,
  stopMacRecording,
  macStatus
} from './recorder.mac.js';

import {
  startLinuxRecording,
  stopLinuxRecording,
  linuxStatus
} from './recorder.linux.js';

import {
  startWindowsRecording,
  stopWindowsRecording,
  windowsStatus
} from './recorder.windows.js';

export function startRecording() {
  const platform = os.platform();

  if (platform === 'darwin') return startMacRecording();
  if (platform === 'linux') return startLinuxRecording();
  if (platform === 'win32') return startWindowsRecording();

  throw new Error(`Unsupported platform: ${platform}`);
}

export function stopRecording() {
  const platform = os.platform();

  if (platform === 'darwin') return stopMacRecording();
  if (platform === 'linux') return stopLinuxRecording();
  if (platform === 'win32') return stopWindowsRecording();
}

export function status() {
  const platform = os.platform();

  if (platform === 'darwin') return macStatus();
  if (platform === 'linux') return linuxStatus();
  if (platform === 'win32') return windowsStatus();

  return { recording: false };
}



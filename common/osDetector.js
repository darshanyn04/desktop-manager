import os from 'os';

export const isMac = () => os.platform() === 'darwin';
export const isWindows = () => os.platform() === 'win32';
export const platform = os.platform();

import os from 'os';
import { execSync } from 'child_process';

const platform = os.platform();

console.log(`📦 postinstall on ${platform}`);

if (platform === 'darwin') {
  console.log('🍎 macOS detected → building mac-capture');
  execSync('npm run build:native', { stdio: 'inherit' });
} else {
  console.log('⏭️ Skipping native build (not macOS)');
}

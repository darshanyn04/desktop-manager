import os from 'os';
import { execSync } from 'child_process';

const platform = os.platform();

if (platform === 'darwin') {
  execSync('bash scripts/build-mac-capture.sh', {
    stdio: 'inherit'
  });
} else {
  console.log(`⚠️ No native build defined for ${platform}`);
}

const { execSync } = require('child_process');
const path = require('path');
const process = require('process');

const isWindows = process.platform === 'win32';

try {
  console.log("Setting up backend...");

  const backendDir = path.join(__dirname, 'api');
  if (isWindows) {
    execSync('python -m venv venv', { cwd: backendDir, stdio: 'inherit', shell: true });
    execSync('venv\\Scripts\\pip install -r requirements.txt', { cwd: backendDir, stdio: 'inherit', shell: true });
  } else {
    // Use your setup.sh which creates a venv and installs dependencies
    execSync('bash setup.sh', { cwd: backendDir, stdio: 'inherit', shell: true });
  }

  console.log("Setting up frontend...");
  const frontendDir = path.join(__dirname, 'studyfront');
  execSync('npm install', { cwd: frontendDir, stdio: 'inherit', shell: true });

  console.log("Setup complete!");
} catch (err) {
  console.error("Error during setup:", err);
  process.exit(1);
}
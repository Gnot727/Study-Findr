const { spawn } = require('child_process');
const path = require('path');
const process = require('process');

const isWindows = process.platform === 'win32';

function startBackend() {
  console.log("Starting backend...");
  const backendDir = path.join(__dirname, 'api');
  let cmd, args;

  // Adjust 'app.py' to your actual backend entry point if needed.
  if (isWindows) {
    cmd = 'venv\\Scripts\\python.exe';
    args = ['studyfindr.py'];
  } else {
    cmd = './venv/bin/python';
    args = ['studyfindr.py'];
  }

  const backend = spawn(cmd, args, { cwd: backendDir, stdio: 'inherit', shell: true });
  backend.on('close', code => console.log(`Backend exited with code ${code}`));
}

function startFrontend() {
  console.log("Starting frontend...");
  const frontendDir = path.join(__dirname, 'studyfront');
  const frontend = spawn('npm', ['run', 'start'], { cwd: frontendDir, stdio: 'inherit', shell: true });
  frontend.on('close', code => console.log(`Frontend exited with code ${code}`));
}

// Start both concurrently
startBackend();
startFrontend();
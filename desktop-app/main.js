const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');

let mainWindow;
let backendProcess;
let startupStartTime = Date.now();

function getBackendPath() {
  const binaryName = process.platform === 'win32' ? 'shop-backend.exe' : 'shop-backend';
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'backend', binaryName);
  }
  return path.join(__dirname, 'resources', 'backend', binaryName);
}

function getFrontendPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'frontend', 'index.html');
  }
  return path.join(__dirname, 'frontend', 'index.html');
}

const logDir = path.join(os.homedir(), "Documents", "Alone-app", "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.join(logDir, "backend.log");
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function startBackend() {
  const backendPath = getBackendPath();
  console.log('Starting backend at:', backendPath);
  logStream.write(`\n\n--- App Start: ${new Date().toISOString()} ---\n`);
  logStream.write(`Backend Path: ${backendPath}\n`);

  // Ensure the binary is executable
  try {
    fs.chmodSync(backendPath, '755');
  } catch (e) {
    logStream.write(`chmod error: ${e.message}\n`);
  }

  backendProcess = spawn(backendPath, [], {
    env: {
      ...process.env,
      PORT: '8000'
    },
    cwd: path.dirname(backendPath)
  });

  backendProcess.stdout.on('data', (data) => {
    logStream.write(`STDOUT: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    logStream.write(`STDERR: ${data}`);
  });

  backendProcess.on('error', (err) => {
    logStream.write(`Process Error: ${err.message}\n`);
  });

  backendProcess.on('exit', (code) => {
    logStream.write(`Backend exited with code: ${code}\n`);
  });
}

function showLoadingScreen() {
  if (!mainWindow) return;
  mainWindow.loadURL(`data:text/html,
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: #0f172a;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: white;
          }
          .spinner {
            width: 60px; height: 60px;
            border: 4px solid rgba(99,102,241,0.2);
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 24px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          h2 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
          p { font-size: 14px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="spinner"></div>
        <h2>Alone-app</h2>
        <p>Starting services, please wait...</p>
      </body>
    </html>
  `);
  mainWindow.show();
}

function showError(message) {
  if (!mainWindow) return;
  mainWindow.loadURL(`data:text/html,
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: #0f172a;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: white;
            padding: 40px;
            text-align: center;
          }
          .icon { font-size: 60px; margin-bottom: 20px; }
          h2 { font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #f87171; }
          p { font-size: 14px; color: #94a3b8; max-width: 500px; line-height: 1.6; }
          .log-hint { font-size: 12px; color: #64748b; margin-top: 20px; }
          button {
            margin-top: 24px;
            padding: 12px 28px;
            background: #6366f1;
            border: none; border-radius: 12px;
            color: white; font-size: 14px;
            font-weight: 700; cursor: pointer;
          }
          button:hover { background: #4f46e5; }
        </style>
      </head>
      <body>
        <div class="icon">⚠️</div>
        <h2>Connection Failed</h2>
        <p>${message}</p>
        <div class="log-hint">Log file: ~/Documents/Alone-app/logs/backend.log</div>
        <button onclick="location.reload()">Retry Launch</button>
      </body>
    </html>
  `);
}

function waitForBackend(onReady, onFail, retries = 240) {
  // Use 127.0.0.1 instead of localhost to avoid IPv6 resolution issues
  const req = http.get('http://127.0.0.1:8000/health', (res) => {
    if (res.statusCode === 200) {
      const duration = (Date.now() - startupStartTime) / 1000;
      logStream.write(`Backend ready after ${duration.toFixed(1)} seconds\n`);
      onReady();
    } else if (retries > 0) {
      setTimeout(() => waitForBackend(onReady, onFail, retries - 1), 500);
    } else {
      onFail(`Backend health check failed with status ${res.statusCode}.`);
    }
  });

  req.on('error', (err) => {
    if (retries > 0) {
      if (retries % 20 === 0) {
        logStream.write(`Waiting for backend... (${retries} retries left). Error: ${err.message}\n`);
      }
      setTimeout(() => waitForBackend(onReady, onFail, retries - 1), 500);
    } else {
      onFail(`Could not connect to the local server (127.0.0.1:8000). Error: ${err.message}`);
    }
  });

  req.setTimeout(500, () => {
    req.destroy();
    if (retries > 0) {
      setTimeout(() => waitForBackend(onReady, onFail, retries - 1), 500);
    } else {
      onFail('Connection to backend timed out.');
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Alone-app',
    backgroundColor: '#0f172a',
    show: false,
    titleBarStyle: 'default'
  });

  // Show loading screen immediately
  showLoadingScreen();

  // Wait for backend, then load the real app
  waitForBackend(
    () => {
      const frontendPath = getFrontendPath();
      logStream.write(`Loading frontend from: ${frontendPath}\n`);
      
      if (!fs.existsSync(frontendPath)) {
        logStream.write(`CRITICAL ERROR: Frontend file not found at ${frontendPath}\n`);
        showError(`Frontend assets missing.`);
        return;
      }

      mainWindow.loadFile(frontendPath).catch(err => {
        logStream.write(`Failed to load frontend file: ${err.message}\n`);
        showError(`Failed to load frontend: ${err.message}`);
      });
    },
    (errorMsg) => {
      logStream.write(`Backend failure: ${errorMsg}\n`);
      showError(errorMsg);
    }
  );

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.on('restart-app', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  app.relaunch();
  app.exit(0);
});

app.on('ready', () => {
  startBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

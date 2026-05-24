const { app, BrowserWindow, ipcMain, screen } = require('electron');
const dgram = require('dgram');
const fs = require('fs');
const path = require('path');

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); return; }

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 34598;
const ALLOWED_SETTING_KEYS = new Set(['autoHide', 'autoHideSec', 'bgTransparent']);
let SETTINGS_PATH;

let win;
let latestData = null;
let sendTimer = null;
let settings = { opacity: 0.82, alwaysOnTop: true, autoHide: false, autoHideSec: 3, bgTransparent: false, bounds: null, host: DEFAULT_HOST, port: DEFAULT_PORT };

function loadSettings() {
  try {
    const d = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    if (typeof d.opacity === 'number' && d.opacity >= 0 && d.opacity <= 1) settings.opacity = d.opacity;
    if (typeof d.alwaysOnTop === 'boolean') settings.alwaysOnTop = d.alwaysOnTop;
    if (typeof d.autoHide === 'boolean') settings.autoHide = d.autoHide;
    if (typeof d.autoHideSec === 'number' && d.autoHideSec >= 1 && d.autoHideSec <= 10) settings.autoHideSec = d.autoHideSec;
    if (typeof d.bgTransparent === 'boolean') settings.bgTransparent = d.bgTransparent;
    if (typeof d.host === 'string' && /^\d{1,3}(\.\d{1,3}){3}$/.test(d.host)) settings.host = d.host;
    if (Number.isInteger(d.port) && d.port >= 1 && d.port <= 65535) settings.port = d.port;
    if (d.bounds && typeof d.bounds === 'object' && typeof d.bounds.width === 'number') settings.bounds = d.bounds;
  } catch {}
}

function saveSettings() {
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  } catch {}
}

function saveBounds() {
  if (win && !win.isDestroyed() && !win.isMinimized()) {
    settings.bounds = win.getBounds();
    saveSettings();
  }
}

function createWindow() {
  const b = settings.bounds || { width: 300, height: 280 };
  if (b.x !== undefined && b.y !== undefined) {
    const visible = screen.getAllDisplays().some(d => {
      const { x, y, width, height } = d.bounds;
      return b.x < x + width && b.x + b.width > x && b.y < y + height && b.y + b.height > y;
    });
    if (!visible) { delete b.x; delete b.y; }
  }
  win = new BrowserWindow({
    width: b.width,
    height: b.height,
    x: b.x,
    y: b.y,
    minWidth: 160,
    minHeight: 120,
    alwaysOnTop: settings.alwaysOnTop,
    frame: false,
    transparent: true,
    resizable: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'widget-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, 'widget.html'));
  if (settings.alwaysOnTop) {
    win.setAlwaysOnTop(true, 'screen-saver');
  }

  let boundsTimer = null;
  const debounceSaveBounds = () => {
    clearTimeout(boundsTimer);
    boundsTimer = setTimeout(saveBounds, 500);
  };
  win.on('resize', debounceSaveBounds);
  win.on('move', debounceSaveBounds);
}

function isWinValid() {
  return win && !win.isDestroyed();
}

app.whenReady().then(() => {
  SETTINGS_PATH = path.join(app.getPath('userData'), 'widget-settings.json');
  loadSettings();
  createWindow();

  let udp = null;
  let bindGeneration = 0;

  function bindUdp() {
    const gen = ++bindGeneration;
    const oldUdp = udp;
    udp = null;

    function startNew() {
      if (gen !== bindGeneration) return;
      const newUdp = dgram.createSocket('udp4');
      newUdp.on('message', (msg) => {
        if (msg.length < 324) return;
        latestData = {
          isRaceOn:   msg.readInt32LE(0),
          accX:       msg.readFloatLE(20),
          accZ:       msg.readFloatLE(28),
          carClass:   msg.readInt32LE(216),
          carPI:      msg.readInt32LE(220),
          drivetrain: msg.readInt32LE(224),
          speed:      msg.readFloatLE(256),
          accel:      msg.readUInt8(315),
          brake:      msg.readUInt8(316),
          clutch:     msg.readUInt8(317),
          handBrake:  msg.readUInt8(318),
          steer:      msg.readInt8(320),
        };
      });
      newUdp.on('error', (err) => {
        console.error('UDP error:', err.message);
        try { newUdp.close(); } catch {}
        if (gen === bindGeneration) udp = null;
      });
      newUdp.bind(settings.port || DEFAULT_PORT, settings.host || DEFAULT_HOST);
      udp = newUdp;
    }

    if (oldUdp) {
      try { oldUdp.close(startNew); } catch { startNew(); }
    } else {
      startNew();
    }
  }
  bindUdp();

  function isValidHost(h) {
    return typeof h === 'string' && /^\d{1,3}(\.\d{1,3}){3}$/.test(h);
  }
  function isValidPort(p) {
    return Number.isInteger(p) && p >= 1 && p <= 65535;
  }

  ipcMain.on('win-rebind', (_, host, port) => {
    if (!isValidHost(host) || !isValidPort(port)) return;
    settings.host = host;
    settings.port = port;
    saveSettings();
    bindUdp();
  });

  sendTimer = setInterval(() => {
    if (latestData && isWinValid()) {
      win.webContents.send('telemetry', latestData);
    }
  }, 16);

  ipcMain.on('win-minimize', () => isWinValid() && win.minimize());
  ipcMain.on('win-close', () => isWinValid() && win.close());

  ipcMain.on('win-opacity', (_, v) => {
    if (typeof v !== 'number' || v < 0 || v > 1) return;
    settings.opacity = v;
    saveSettings();
  });

  ipcMain.on('win-aot', (_, v) => {
    settings.alwaysOnTop = v;
    if (isWinValid()) win.setAlwaysOnTop(v, v ? 'screen-saver' : 'normal');
    saveSettings();
  });

  ipcMain.on('win-setting', (_, key, val) => {
    if (!ALLOWED_SETTING_KEYS.has(key)) return;
    settings[key] = val;
    saveSettings();
  });

  ipcMain.handle('get-settings', () => settings);
});

app.on('second-instance', () => {
  if (isWinValid()) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('window-all-closed', () => {
  if (sendTimer) clearInterval(sendTimer);
  app.quit();
});

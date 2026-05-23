const { app, BrowserWindow, ipcMain } = require('electron');
const dgram = require('dgram');
const fs = require('fs');
const path = require('path');

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 34598;
let SETTINGS_PATH;

let win;
let latestData = null;
let settings = { opacity: 0.82, alwaysOnTop: true, autoHide: false, autoHideSec: 3, bounds: null, host: DEFAULT_HOST, port: DEFAULT_PORT };

function loadSettings() {
  try {
    const data = fs.readFileSync(SETTINGS_PATH, 'utf8');
    Object.assign(settings, JSON.parse(data));
  } catch {}
}

function saveSettings() {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

function saveBounds() {
  if (win && !win.isDestroyed() && !win.isMinimized()) {
    settings.bounds = win.getBounds();
    saveSettings();
  }
}

function createWindow() {
  const b = settings.bounds || { width: 300, height: 280 };
  win = new BrowserWindow({
    width: b.width,
    height: b.height,
    x: b.x,
    y: b.y,
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

app.whenReady().then(() => {
  SETTINGS_PATH = path.join(app.getPath('userData'), 'widget-settings.json');
  loadSettings();
  createWindow();

  let udp = null;

  function bindUdp() {
    if (udp) { try { udp.close(); } catch {} }
    udp = dgram.createSocket('udp4');
    udp.on('message', (msg) => {
      if (msg.length < 324) return;
      latestData = {
        isRaceOn:   msg.readInt32LE(0),
        carClass:   msg.readInt32LE(216),
        carPI:      msg.readInt32LE(220),
        drivetrain: msg.readInt32LE(224),
        accel:      msg.readUInt8(315),
        brake:      msg.readUInt8(316),
        clutch:     msg.readUInt8(317),
        handBrake:  msg.readUInt8(318),
        gear:       msg.readUInt8(319),
        steer:      msg.readInt8(320),
      };
    });
    udp.bind(settings.port || DEFAULT_PORT, settings.host || DEFAULT_HOST);
  }
  bindUdp();

  ipcMain.on('win-rebind', (_, host, port) => {
    settings.host = host;
    settings.port = port;
    saveSettings();
    bindUdp();
  });

  setInterval(() => {
    if (latestData && win && !win.isDestroyed()) {
      win.webContents.send('telemetry', latestData);
    }
  }, 16);

  ipcMain.on('win-minimize', () => win && win.minimize());
  ipcMain.on('win-close', () => win && win.close());

  ipcMain.on('win-opacity', (_, v) => {
    settings.opacity = v;
    win.webContents.send('settings-updated', settings);
    saveSettings();
  });

  ipcMain.on('win-aot', (_, v) => {
    settings.alwaysOnTop = v;
    win.setAlwaysOnTop(v, v ? 'screen-saver' : 'normal');
    saveSettings();
  });

  ipcMain.on('win-setting', (_, key, val) => {
    settings[key] = val;
    saveSettings();
  });

  ipcMain.handle('get-settings', () => settings);
});

app.on('window-all-closed', () => app.quit());

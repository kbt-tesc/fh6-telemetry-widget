const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  onTelemetry: (cb) => ipcRenderer.on('telemetry', (_, d) => cb(d)),
  minimize: () => ipcRenderer.send('win-minimize'),
  close: () => ipcRenderer.send('win-close'),
  setOpacity: (v) => ipcRenderer.send('win-opacity', v),
  setAlwaysOnTop: (v) => ipcRenderer.send('win-aot', v),
  setSetting: (key, val) => ipcRenderer.send('win-setting', key, val),
  rebind: (host, port) => ipcRenderer.send('win-rebind', host, port),
  getSettings: () => ipcRenderer.invoke('get-settings'),
});

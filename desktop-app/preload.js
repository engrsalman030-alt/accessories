const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  restartApp: () => ipcRenderer.send('restart-app')
});

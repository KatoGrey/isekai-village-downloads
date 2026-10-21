// Isekai Village for macOS: the one thing the page may ask of the app, whether a newer version is out (Settings → Town &
// Save, or the title screen's "v130 is out"). An app that isn't notarized can't replace itself, so this bridge only
// looks, and opens the downloads page; the player downloads the new app. Everything else stays a plain web page, sandboxed.
const { contextBridge, ipcRenderer } = require('electron');

const byHand = () => Promise.reject(new Error('the Mac app updates from the downloads page'));
contextBridge.exposeInMainWorld('isekaiUpdater', {
  platform: 'mac',
  info: () => ipcRenderer.invoke('update:info'),
  check: () => ipcRenderer.invoke('update:check'),
  download: byHand,
  install: byHand,
  openPage: (url) => ipcRenderer.invoke('update:open', url),
});

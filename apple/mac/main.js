// Isekai Village for macOS: the web build in its own window, as on Windows. It is served from a private app:// origin
// so its ES modules, fetches and save data (localStorage, kept in ~/Library/Application Support/Isekai Village) behave
// exactly as on the web. Outside the Voyage player the game runs on its own: sign-in, cloud saves and analytics stay off.
const { app, BrowserWindow, Menu, protocol, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);
const GAME = path.join(__dirname, 'game');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.webp': 'image/webp' };
// ISEKAI_TEST (automated checks only) keeps its save data in a temp folder of its own, so a test never touches a
// player's real towns.
const test = Boolean(process.env.ISEKAI_TEST);
if (test) app.setPath('userData', path.join(app.getPath('temp'), 'isekai-village-test'));

// One window at a time: two would fight over the same save data.
if (!app.requestSingleInstanceLock()) app.quit();

function createWindow(backup = '') {
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 960, minHeight: 600, title: 'Isekai Village', backgroundColor: '#2a2233', show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: !test },
  });
  win.once('ready-to-show', () => win.show());
  // ISEKAI_SHOT=<file.png> (the build's own check): a picture of the window after 40 seconds, then quit.
  if (test && process.env.ISEKAI_SHOT) {
    setTimeout(async () => {
      try { await fs.writeFile(process.env.ISEKAI_SHOT, (await win.webContents.capturePage()).toPNG()); } finally { app.quit(); }
    }, 40000);
  }
  // Links out of the game (credits, the downloads page) open in the player's own browser.
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => {
    if (url.startsWith('app://')) return;
    e.preventDefault();
    if (/^https?:/.test(url)) shell.openExternal(url);
  });
  // (After an update the game says once that the towns came across, or that the backup couldn't be made.)
  win.loadURL(`app://game/index.html${backup === 'backed' ? '?updated=1' : backup === 'failed' ? '?backup=failed' : ''}`);
  return win;
}

// The Mac menu bar: the app menu (About, Hide, Quit), Edit (so copy and paste work in the game's text fields), View
// (full screen) and Window.
function menu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: 'appMenu' },
    { role: 'editMenu' },
    { label: 'View', submenu: [{ role: 'togglefullscreen' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }] },
    { role: 'windowMenu' },
    { role: 'help', submenu: [{ label: 'Isekai Village downloads', click: () => shell.openExternal('https://github.com/KatoGrey/isekai-village-downloads/releases/latest') }] },
  ]));
}

app.on('second-instance', () => {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

// Updating is just opening the new app: saves live in Application Support under the same app:// origin whatever the
// version, and the game migrates old saves itself. As a safety net, the first time a new version starts, the save data
// is copied aside first (save-backups/<old version>-<date and time>), before the game has opened it. The version mark
// only moves on once that copy is safely made (or there was no save to copy), so a failed backup is tried again next
// launch, and the game tells the player. Returns 'backed', 'failed' or '' (nothing to do).
async function backUpOnUpdate() {
  const data = app.getPath('userData'), mark = path.join(data, 'last-version.txt'), now = app.getVersion();
  const was = await fs.readFile(mark, 'utf8').then((v) => v.trim(), () => '');
  if (was === now) return '';
  const store = path.join(data, 'Local Storage');
  const hasSave = await fs.stat(store).then(() => true, () => false);
  if (hasSave) {
    const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const dest = path.join(data, 'save-backups', `${was ? `v${was}` : 'earlier'}-${stamp}`), part = `${dest}.partial`;
    try {
      // Copied into a staging folder, then renamed: a half-made copy never looks like a good backup.
      await fs.rm(part, { recursive: true, force: true });
      await fs.cp(store, path.join(part, 'Local Storage'), { recursive: true });
      await fs.rename(part, dest);
    } catch {
      await fs.rm(part, { recursive: true, force: true }).catch(() => {});
      return 'failed';
    }
  }
  await fs.mkdir(data, { recursive: true });
  await fs.writeFile(mark, now);
  return hasSave ? 'backed' : '';
}

app.whenReady().then(async () => {
  menu();
  const backup = await backUpOnUpdate().catch(() => 'failed');
  // Files come straight off disk (the game loads ~2,800 sprites at boot; a network round-trip each is far too slow).
  protocol.handle('app', async (req) => {
    const file = path.normalize(path.join(GAME, decodeURIComponent(new URL(req.url).pathname)));
    if (!file.startsWith(GAME)) return new Response('Not found', { status: 404 });
    try {
      return new Response(await fs.readFile(file), { headers: { 'content-type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream' } });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
  createWindow(backup);
});
// (Closing the window ends the game, as on Windows: a town has nothing to do in the background.)
app.on('window-all-closed', () => app.quit());

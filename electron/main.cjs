const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Sistem Keasramaan Sekolah Rakyat - Kemensos RI',
    backgroundColor: '#0f172a',
    icon: path.join(__dirname, '../public/pwa-512x512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: true
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const startUrl = process.env.ELECTRON_START_URL || (isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../dist/index.html')}`);

  mainWindow.loadURL(startUrl);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Native Application Menu
  const template = [
    {
      label: 'Aplikasi',
      submenu: [
        { label: 'Muat Ulang (Reload)', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { label: 'Layar Penuh (Fullscreen)', accelerator: 'F11', click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) },
        { type: 'separator' },
        { label: 'Keluar', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Navigasi',
      submenu: [
        { label: 'Dashboard Utama', click: () => mainWindow.loadURL(startUrl) },
        { label: 'Presensi Asrama', click: () => mainWindow.loadURL(`${startUrl}?tab=prayer-attendance`) },
        { label: 'Live Monitor Terpadu', click: () => mainWindow.loadURL(`${startUrl}?tab=live-monitor`) },
        { label: 'Pencatatan Pelanggaran', click: () => mainWindow.loadURL(`${startUrl}?tab=violations`) },
        { label: 'Konseling BK', click: () => mainWindow.loadURL(`${startUrl}?tab=counseling`) }
      ]
    },
    {
      label: 'Bantuan & Alat',
      submenu: [
        { label: 'Alat Pengembang (DevTools)', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() },
        { type: 'separator' },
        {
          label: 'Tentang Aplikasi Keasramaan',
          click: () => {
            shell.openExternal('https://kemensos.go.id');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // IPC handlers for window control
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow?.close());
  ipcMain.on('window-fullscreen', () => {
    mainWindow?.setFullScreen(!mainWindow.isFullScreen());
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

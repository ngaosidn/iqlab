const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Admin Tahseena - Desktop App",
    icon: path.join(__dirname, 'public/favicon.ico'), // Opsional: pastikan ada favicon di public
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Hilangkan menu bar default untuk tampilan lebih clean
  win.setMenuBarVisibility(false);

  // Load URL local dev server Next.js
  win.loadURL('http://localhost:3000');

  // Buka DevTools secara otomatis jika sedang development (Opsional)
  // win.webContents.openDevTools();
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

import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerSettingsHandlers } from './ipc/settings';
import { registerGenerationHandlers } from './ipc/generation';
import { closeStorage, registerStorageHandlers } from './ipc/storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

const configurePortableUserData = (): boolean => {
  const portableDir = process.env.PORTABLE_EXECUTABLE_DIR;
  if (!portableDir) return true;

  const dataDir = path.join(portableDir, 'data');

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    app.setPath('userData', dataDir);
    return true;
  } catch (error) {
    const message =
      error instanceof Error
        ? `無法建立便攜資料目錄：${dataDir}\n${error.message}\n請將程式置於可寫入的資料夾後再執行。`
        : `無法建立便攜資料目錄：${dataDir}`;
    dialog.showErrorBox('便攜模式啟動失敗', message);
    app.quit();
    return false;
  }
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: '活動 SOP 與風險規劃生成器',
  });

  // 在開發模式載入 Vite 開發伺服器，生產模式載入打包後的檔案
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  if (!configurePortableUserData()) return;
  registerStorageHandlers();
  registerSettingsHandlers();
  registerGenerationHandlers();
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

app.on('before-quit', () => {
  closeStorage();
});

// IPC 處理器範例
ipcMain.handle('ping', () => 'pong');

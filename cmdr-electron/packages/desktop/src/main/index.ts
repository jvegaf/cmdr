/**
 * Electron Main Process
 *
 * AIDEV-NOTE: Entry point for the Electron main process.
 * Handles window creation, IPC, and native OS integration.
 *
 * Phase 18: Added application menu setup.
 * Phase 18.1: Added app close confirmation with dirty files.
 */

import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { join } from 'node:path';
import { registerIpcHandlers } from './ipc.js';
import { setupApplicationMenu } from './menu.js';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    // AIDEV-NOTE: Changed from autoHideMenuBar to show menu
    // Set to false to always show menu bar on Windows/Linux
    autoHideMenuBar: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  // AIDEV-NOTE: Intercept window close to check for unsaved changes
  // The 'close' event is cancellable, allowing us to prompt the user
  mainWindow.on('close', async (event) => {
    if (!mainWindow) return;
    
    // Ask renderer if there are dirty files
    // We use a synchronous pattern: send request, wait for response via IPC
    event.preventDefault();
    
    try {
      // Ask renderer to check for dirty files
      mainWindow.webContents.send('app:check-dirty-files');
    } catch {
      // If we can't communicate with renderer, just close
      mainWindow.destroy();
    }
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Load the app
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// AIDEV-NOTE: IPC handler for dirty files response from renderer
// Called when renderer responds to 'app:check-dirty-files'
function setupCloseHandlers(): void {
  // Renderer reports dirty file status
  ipcMain.on('app:dirty-files-response', async (_event, hasDirtyFiles: boolean) => {
    if (!mainWindow) return;
    
    if (!hasDirtyFiles) {
      // No dirty files, safe to close
      mainWindow.destroy();
      return;
    }
    
    // Has dirty files, show confirmation dialog
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to quit?',
      detail: 'Your changes will be lost if you don\'t save them.',
      buttons: ['Quit Without Saving', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
    });
    
    if (response === 0) {
      // User chose to quit without saving
      mainWindow.destroy();
    }
    // If response === 1 (Cancel), do nothing - window stays open
  });
  
  // Force close (used after user confirms they want to quit)
  ipcMain.on('app:force-close', () => {
    if (mainWindow) {
      mainWindow.destroy();
    }
  });
}

app.whenReady().then(() => {
  // Set up close handlers first
  setupCloseHandlers();
  
  // Set up application menu
  setupApplicationMenu();
  
  // Register IPC handlers
  registerIpcHandlers();
  
  // Create the main window
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

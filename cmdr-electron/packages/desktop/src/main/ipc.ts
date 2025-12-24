/**
 * IPC Handlers for Main Process
 *
 * AIDEV-NOTE: Handles communication between renderer and main process.
 * File operations (open/save TSI files) run here with full Node.js access.
 */

import { ipcMain, dialog } from 'electron';
import { readFile, writeFile } from 'node:fs/promises';

export function registerIpcHandlers(): void {
  // Open file dialog
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'TSI Files', extensions: ['tsi'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    if (!filePath) {
      return null;
    }

    const content = await readFile(filePath);
    return {
      filePath,
      content: content.toString('base64'),
    };
  });

  // Save file dialog
  ipcMain.handle('dialog:saveFile', async (_event, data: { content: string; defaultPath?: string }) => {
    const result = await dialog.showSaveDialog({
      defaultPath: data.defaultPath,
      filters: [
        { name: 'TSI Files', extensions: ['tsi'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    const buffer = Buffer.from(data.content, 'base64');
    await writeFile(result.filePath, buffer);
    return result.filePath;
  });

  // Read file directly (for recent files)
  ipcMain.handle('file:read', async (_event, filePath: string) => {
    const content = await readFile(filePath);
    return content.toString('base64');
  });

  // Write file directly (for auto-save)
  ipcMain.handle('file:write', async (_event, data: { filePath: string; content: string }) => {
    const buffer = Buffer.from(data.content, 'base64');
    await writeFile(data.filePath, buffer);
    return true;
  });
}

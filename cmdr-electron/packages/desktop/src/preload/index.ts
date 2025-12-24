/**
 * Preload Script
 *
 * AIDEV-NOTE: Bridge between main process and renderer.
 * Exposes safe IPC methods to the renderer via contextBridge.
 *
 * Phase 18: Added menu action listener for application menu integration.
 */

import { contextBridge, ipcRenderer } from 'electron';

export interface FileData {
  filePath: string;
  content: string; // Base64 encoded
}

// Menu action payload from main process
export interface MenuActionPayload {
  action: string;
  payload?: unknown;
}

export interface ElectronAPI {
  openFile: () => Promise<FileData | null>;
  saveFile: (content: string, defaultPath?: string) => Promise<string | null>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  // Phase 16: CSV export
  saveCsv: (content: string, defaultPath?: string) => Promise<string | null>;
  // Phase 18: Menu action listener
  onMenuAction: (callback: (payload: MenuActionPayload) => void) => () => void;
}

const electronAPI: ElectronAPI = {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (content, defaultPath) =>
    ipcRenderer.invoke('dialog:saveFile', { content, defaultPath }),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath, content) =>
    ipcRenderer.invoke('file:write', { filePath, content }),
  // Phase 16: CSV export
  saveCsv: (content, defaultPath) =>
    ipcRenderer.invoke('dialog:saveCsv', { content, defaultPath }),
  // Phase 18: Menu action listener
  // Returns an unsubscribe function
  onMenuAction: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: MenuActionPayload) => {
      callback(payload);
    };
    ipcRenderer.on('menu:action', handler);
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('menu:action', handler);
    };
  },
};

contextBridge.exposeInMainWorld('electron', electronAPI);


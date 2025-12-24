/**
 * Preload Script
 *
 * AIDEV-NOTE: Bridge between main process and renderer.
 * Exposes safe IPC methods to the renderer via contextBridge.
 */

import { contextBridge, ipcRenderer } from 'electron';

export interface FileData {
  filePath: string;
  content: string; // Base64 encoded
}

export interface ElectronAPI {
  openFile: () => Promise<FileData | null>;
  saveFile: (content: string, defaultPath?: string) => Promise<string | null>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  // Phase 16: CSV export
  saveCsv: (content: string, defaultPath?: string) => Promise<string | null>;
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
};

contextBridge.exposeInMainWorld('electron', electronAPI);

/**
 * Preload Script
 *
 * AIDEV-NOTE: Bridge between main process and renderer.
 * Exposes safe IPC methods to the renderer via contextBridge.
 *
 * Phase 18: Added menu action listener for application menu integration.
 * Phase 18.1: Added app close handlers for dirty file confirmation.
 * Phase 19: Added folder/file picker dialogs for settings.
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

// File filter for file picker
export interface FileFilter {
  name: string;
  extensions: string[];
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
  // Phase 18.1: App close handlers
  onCheckDirtyFiles: (callback: () => void) => () => void;
  respondDirtyFiles: (hasDirtyFiles: boolean) => void;
  forceClose: () => void;
  // Phase 19: Folder/File picker dialogs for settings
  selectFolder: (defaultPath?: string, title?: string) => Promise<string | null>;
  selectFile: (
    defaultPath?: string,
    title?: string,
    filters?: FileFilter[]
  ) => Promise<string | null>;
}

const electronAPI: ElectronAPI = {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (content, defaultPath) =>
    ipcRenderer.invoke('dialog:saveFile', { content, defaultPath }),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('file:write', { filePath, content }),
  // Phase 16: CSV export
  saveCsv: (content, defaultPath) => ipcRenderer.invoke('dialog:saveCsv', { content, defaultPath }),
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
  // Phase 18.1: App close handlers
  onCheckDirtyFiles: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('app:check-dirty-files', handler);
    return () => {
      ipcRenderer.removeListener('app:check-dirty-files', handler);
    };
  },
  respondDirtyFiles: (hasDirtyFiles) => {
    ipcRenderer.send('app:dirty-files-response', hasDirtyFiles);
  },
  forceClose: () => {
    ipcRenderer.send('app:force-close');
  },
  // Phase 19: Folder/File picker dialogs for settings
  selectFolder: (defaultPath, title) =>
    ipcRenderer.invoke('dialog:selectFolder', { defaultPath, title }),
  selectFile: (defaultPath, title, filters) =>
    ipcRenderer.invoke('dialog:selectFile', { defaultPath, title, filters }),
};

contextBridge.exposeInMainWorld('electron', electronAPI);

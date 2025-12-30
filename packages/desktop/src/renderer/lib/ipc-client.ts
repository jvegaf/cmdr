/**
 * IPC Client - Type-safe wrapper for Electron IPC
 *
 * AIDEV-NOTE: Provides type-safe methods for communicating with the main process.
 * Integrates with @cmdr/core for TSI file operations.
 *
 * The electron API is exposed via contextBridge in preload/index.ts.
 *
 * Phase 18: Added menu action listener support.
 * Phase 18.1: Added app close handlers for dirty file confirmation.
 * Phase 19: Added folder/file picker dialogs for settings.
 */

import { TsiFile } from '@cmdr/core';

// ============================================================================
// Types (from preload)
// ============================================================================

interface FileData {
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

interface ElectronAPI {
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

// ============================================================================
// Helpers
// ============================================================================

function getElectronAPI(): ElectronAPI {
  const api = (window as unknown as { electron?: ElectronAPI }).electron;
  if (!api) {
    throw new Error('Electron API not available. Are you running in Electron?');
  }
  return api;
}

/**
 * Decode base64 string to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encode Uint8Array to base64 string
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

/**
 * Decode base64 to UTF-8 string (for XML content)
 */
function base64ToUtf8(base64: string): string {
  const bytes = base64ToBytes(base64);
  return new TextDecoder('utf-8').decode(bytes);
}

/**
 * Encode UTF-8 string to base64
 */
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  return bytesToBase64(bytes);
}

// ============================================================================
// Result Types
// ============================================================================

export interface OpenFileResult {
  filePath: string;
  tsiFile: TsiFile;
}

// ============================================================================
// IPC Client
// ============================================================================

/**
 * IPC Client for file operations
 *
 * @example
 * ```typescript
 * // Open a file
 * const result = await ipcClient.openTsiFile();
 * if (result) {
 *   console.log('Opened:', result.filePath);
 *   console.log('Devices:', result.tsiFile.devices.length);
 * }
 *
 * // Save a file
 * await ipcClient.saveTsiFile(tsiFile, '/path/to/file.tsi');
 * ```
 */
export const ipcClient = {
  /**
   * Check if running in Electron environment
   */
  isElectron(): boolean {
    return typeof window !== 'undefined' && !!window.electron;
  },

  /**
   * Open a TSI file using the system file dialog
   * @returns The file path and parsed TsiFile, or null if cancelled
   */
  async openTsiFile(): Promise<OpenFileResult | null> {
    const api = getElectronAPI();
    const result = await api.openFile();

    if (!result) {
      return null;
    }

    // Decode base64 to XML string
    const xmlContent = base64ToUtf8(result.content);

    // Parse the TSI file
    const tsiFile = TsiFile.fromXml(xmlContent);

    return {
      filePath: result.filePath,
      tsiFile,
    };
  },

  /**
   * Read a TSI file from a known path
   * @param filePath Path to the TSI file
   * @returns Parsed TsiFile
   */
  async readTsiFile(filePath: string): Promise<TsiFile> {
    const api = getElectronAPI();
    const content = await api.readFile(filePath);

    // Decode base64 to XML string
    const xmlContent = base64ToUtf8(content);

    // Parse the TSI file
    return TsiFile.fromXml(xmlContent);
  },

  /**
   * Save a TSI file using the system save dialog
   * @param tsiFile The TsiFile to save
   * @param defaultPath Optional default path for the save dialog
   * @returns The saved file path, or null if cancelled
   */
  async saveTsiFile(tsiFile: TsiFile, defaultPath?: string): Promise<string | null> {
    const api = getElectronAPI();

    // Serialize to XML
    const xmlContent = tsiFile.toXml();

    // Encode to base64
    const base64Content = utf8ToBase64(xmlContent);

    // Save via dialog
    return api.saveFile(base64Content, defaultPath);
  },

  /**
   * Write a TSI file to a known path (no dialog)
   * @param tsiFile The TsiFile to save
   * @param filePath Path to write to
   */
  async writeTsiFile(tsiFile: TsiFile, filePath: string): Promise<void> {
    const api = getElectronAPI();

    // Serialize to XML
    const xmlContent = tsiFile.toXml();

    // Encode to base64
    const base64Content = utf8ToBase64(xmlContent);

    // Write directly
    await api.writeFile(filePath, base64Content);
  },

  /**
   * Save CSV content using the system save dialog
   * @param csvContent The CSV content to save (UTF-8 string with BOM)
   * @param defaultPath Optional default path for the save dialog
   * @returns The saved file path, or null if cancelled
   */
  async saveCsvFile(csvContent: string, defaultPath?: string): Promise<string | null> {
    const api = getElectronAPI();
    return api.saveCsv(csvContent, defaultPath);
  },

  /**
   * Select a folder using the system folder picker dialog
   * @param defaultPath Optional default path to start from
   * @param title Optional dialog title
   * @returns The selected folder path, or null if cancelled
   */
  async selectFolder(defaultPath?: string, title?: string): Promise<string | null> {
    const api = getElectronAPI();
    return api.selectFolder(defaultPath, title);
  },

  /**
   * Select a file using the system file picker dialog
   * @param defaultPath Optional default path to start from
   * @param title Optional dialog title
   * @param filters Optional file filters
   * @returns The selected file path, or null if cancelled
   */
  async selectFile(
    defaultPath?: string,
    title?: string,
    filters?: FileFilter[]
  ): Promise<string | null> {
    const api = getElectronAPI();
    return api.selectFile(defaultPath, title, filters);
  },
};

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook to check if running in Electron
 */
export function useIsElectron(): boolean {
  return ipcClient.isElectron();
}

/**
 * Subscribe to menu actions from the application menu
 * @param callback Function to call when a menu action is triggered
 * @returns Unsubscribe function
 */
export function subscribeToMenuActions(callback: (payload: MenuActionPayload) => void): () => void {
  try {
    const api = getElectronAPI();
    return api.onMenuAction(callback);
  } catch {
    // Not running in Electron, return no-op unsubscribe
    return () => {};
  }
}

/**
 * Subscribe to app close dirty file check requests
 * @param callback Function to call when main process asks about dirty files
 * @returns Unsubscribe function
 */
export function subscribeToCheckDirtyFiles(callback: () => void): () => void {
  try {
    const api = getElectronAPI();
    return api.onCheckDirtyFiles(callback);
  } catch {
    // Not running in Electron, return no-op unsubscribe
    return () => {};
  }
}

/**
 * Respond to the main process about dirty files status
 * @param hasDirtyFiles Whether there are unsaved changes
 */
export function respondDirtyFiles(hasDirtyFiles: boolean): void {
  try {
    const api = getElectronAPI();
    api.respondDirtyFiles(hasDirtyFiles);
  } catch {
    // Not running in Electron, ignore
  }
}

/**
 * Force close the app (used after user confirms quit without saving)
 */
export function forceCloseApp(): void {
  try {
    const api = getElectronAPI();
    api.forceClose();
  } catch {
    // Not running in Electron, ignore
  }
}

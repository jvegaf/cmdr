/**
 * Type declarations for Electron API exposed via preload
 */

import type { ElectronAPI } from '../preload/index';

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};

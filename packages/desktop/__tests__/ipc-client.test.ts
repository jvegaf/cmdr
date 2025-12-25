/**
 * Tests for ipc-client.ts - Electron IPC wrapper
 *
 * AIDEV-NOTE: Tests the IPC client by mocking window.electron API.
 * Covers base64 encoding/decoding, file operations, and subscription functions.
 */

import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock @cmdr/core TsiFile
const mockTsiFile = {
  toXml: vi.fn(() => '<xml>test content</xml>'),
  devices: [],
};

vi.mock('@cmdr/core', () => ({
  TsiFile: {
    fromXml: vi.fn(() => mockTsiFile),
  },
}));

// Import after mock
import {
  ipcClient,
  subscribeToMenuActions,
  subscribeToCheckDirtyFiles,
  respondDirtyFiles,
  forceCloseApp,
  useIsElectron,
} from '../src/renderer/lib/ipc-client';
import { TsiFile } from '@cmdr/core';

// ============================================================================
// Test Helpers
// ============================================================================

interface MockElectronAPI {
  openFile: Mock;
  saveFile: Mock;
  readFile: Mock;
  writeFile: Mock;
  saveCsv: Mock;
  onMenuAction: Mock;
  onCheckDirtyFiles: Mock;
  respondDirtyFiles: Mock;
  forceClose: Mock;
}

function createMockElectronAPI(): MockElectronAPI {
  return {
    openFile: vi.fn(),
    saveFile: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    saveCsv: vi.fn(),
    onMenuAction: vi.fn().mockReturnValue(vi.fn()),
    onCheckDirtyFiles: vi.fn().mockReturnValue(vi.fn()),
    respondDirtyFiles: vi.fn(),
    forceClose: vi.fn(),
  };
}

function setElectronAPI(api: MockElectronAPI | undefined): void {
  const win = window as unknown as { electron?: MockElectronAPI };
  if (api) {
    win.electron = api;
  } else {
    delete win.electron;
  }
}

// Helper to encode string to base64 (matching the IPC encoding)
function stringToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

// ============================================================================
// Tests
// ============================================================================

describe('ipc-client', () => {
  let mockAPI: MockElectronAPI;

  beforeEach(() => {
    mockAPI = createMockElectronAPI();
    setElectronAPI(mockAPI);
    vi.clearAllMocks();
  });

  afterEach(() => {
    setElectronAPI(undefined);
  });

  // ==========================================================================
  // isElectron
  // ==========================================================================
  describe('isElectron', () => {
    it('should return true when electron API is available', () => {
      expect(ipcClient.isElectron()).toBe(true);
    });

    it('should return false when electron API is not available', () => {
      setElectronAPI(undefined);
      expect(ipcClient.isElectron()).toBe(false);
    });

    it('should work via useIsElectron hook', () => {
      expect(useIsElectron()).toBe(true);
      setElectronAPI(undefined);
      expect(useIsElectron()).toBe(false);
    });
  });

  // ==========================================================================
  // openTsiFile
  // ==========================================================================
  describe('openTsiFile', () => {
    it('should return null when dialog is cancelled', async () => {
      mockAPI.openFile.mockResolvedValue(null);

      const result = await ipcClient.openTsiFile();

      expect(result).toBeNull();
      expect(mockAPI.openFile).toHaveBeenCalledOnce();
    });

    it('should decode base64 content and parse TSI file', async () => {
      const xmlContent = '<?xml version="1.0"?><TSI>test</TSI>';
      const base64Content = stringToBase64(xmlContent);

      mockAPI.openFile.mockResolvedValue({
        filePath: '/path/to/file.tsi',
        content: base64Content,
      });

      const result = await ipcClient.openTsiFile();

      expect(result).not.toBeNull();
      expect(result?.filePath).toBe('/path/to/file.tsi');
      expect(TsiFile.fromXml).toHaveBeenCalledWith(xmlContent);
      expect(result?.tsiFile).toBe(mockTsiFile);
    });

    it('should throw when electron API is not available', async () => {
      setElectronAPI(undefined);

      await expect(ipcClient.openTsiFile()).rejects.toThrow(
        'Electron API not available. Are you running in Electron?'
      );
    });
  });

  // ==========================================================================
  // readTsiFile
  // ==========================================================================
  describe('readTsiFile', () => {
    it('should read and parse TSI file from path', async () => {
      const xmlContent = '<?xml version="1.0"?><TSI>content</TSI>';
      const base64Content = stringToBase64(xmlContent);

      mockAPI.readFile.mockResolvedValue(base64Content);

      const result = await ipcClient.readTsiFile('/path/to/file.tsi');

      expect(mockAPI.readFile).toHaveBeenCalledWith('/path/to/file.tsi');
      expect(TsiFile.fromXml).toHaveBeenCalledWith(xmlContent);
      expect(result).toBe(mockTsiFile);
    });
  });

  // ==========================================================================
  // saveTsiFile
  // ==========================================================================
  describe('saveTsiFile', () => {
    it('should serialize and save TSI file via dialog', async () => {
      mockAPI.saveFile.mockResolvedValue('/saved/path.tsi');

      const result = await ipcClient.saveTsiFile(mockTsiFile as unknown as TsiFile);

      expect(mockTsiFile.toXml).toHaveBeenCalled();
      expect(mockAPI.saveFile).toHaveBeenCalledWith(expect.any(String), undefined);
      expect(result).toBe('/saved/path.tsi');
    });

    it('should pass default path to save dialog', async () => {
      mockAPI.saveFile.mockResolvedValue('/default/path.tsi');

      await ipcClient.saveTsiFile(mockTsiFile as unknown as TsiFile, '/default/path.tsi');

      expect(mockAPI.saveFile).toHaveBeenCalledWith(expect.any(String), '/default/path.tsi');
    });

    it('should return null when dialog is cancelled', async () => {
      mockAPI.saveFile.mockResolvedValue(null);

      const result = await ipcClient.saveTsiFile(mockTsiFile as unknown as TsiFile);

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // writeTsiFile
  // ==========================================================================
  describe('writeTsiFile', () => {
    it('should serialize and write TSI file directly to path', async () => {
      mockAPI.writeFile.mockResolvedValue(true);

      await ipcClient.writeTsiFile(mockTsiFile as unknown as TsiFile, '/direct/path.tsi');

      expect(mockTsiFile.toXml).toHaveBeenCalled();
      expect(mockAPI.writeFile).toHaveBeenCalledWith('/direct/path.tsi', expect.any(String));
    });
  });

  // ==========================================================================
  // saveCsvFile
  // ==========================================================================
  describe('saveCsvFile', () => {
    it('should save CSV content via dialog', async () => {
      mockAPI.saveCsv.mockResolvedValue('/saved/export.csv');

      const csvContent = 'col1,col2\nval1,val2';
      const result = await ipcClient.saveCsvFile(csvContent);

      expect(mockAPI.saveCsv).toHaveBeenCalledWith(csvContent, undefined);
      expect(result).toBe('/saved/export.csv');
    });

    it('should pass default path to save dialog', async () => {
      mockAPI.saveCsv.mockResolvedValue('/default/export.csv');

      await ipcClient.saveCsvFile('csv content', '/default/export.csv');

      expect(mockAPI.saveCsv).toHaveBeenCalledWith('csv content', '/default/export.csv');
    });

    it('should return null when cancelled', async () => {
      mockAPI.saveCsv.mockResolvedValue(null);

      const result = await ipcClient.saveCsvFile('csv content');

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // subscribeToMenuActions
  // ==========================================================================
  describe('subscribeToMenuActions', () => {
    it('should subscribe to menu actions', () => {
      const unsubscribe = vi.fn();
      mockAPI.onMenuAction.mockReturnValue(unsubscribe);

      const callback = vi.fn();
      const result = subscribeToMenuActions(callback);

      expect(mockAPI.onMenuAction).toHaveBeenCalledWith(callback);
      expect(result).toBe(unsubscribe);
    });

    it('should return no-op when electron API is not available', () => {
      setElectronAPI(undefined);

      const callback = vi.fn();
      const unsubscribe = subscribeToMenuActions(callback);

      // Should not throw, just return a no-op function
      expect(typeof unsubscribe).toBe('function');
      unsubscribe(); // Should not throw
    });
  });

  // ==========================================================================
  // subscribeToCheckDirtyFiles
  // ==========================================================================
  describe('subscribeToCheckDirtyFiles', () => {
    it('should subscribe to dirty files check', () => {
      const unsubscribe = vi.fn();
      mockAPI.onCheckDirtyFiles.mockReturnValue(unsubscribe);

      const callback = vi.fn();
      const result = subscribeToCheckDirtyFiles(callback);

      expect(mockAPI.onCheckDirtyFiles).toHaveBeenCalledWith(callback);
      expect(result).toBe(unsubscribe);
    });

    it('should return no-op when electron API is not available', () => {
      setElectronAPI(undefined);

      const callback = vi.fn();
      const unsubscribe = subscribeToCheckDirtyFiles(callback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  // ==========================================================================
  // respondDirtyFiles
  // ==========================================================================
  describe('respondDirtyFiles', () => {
    it('should send dirty files response', () => {
      respondDirtyFiles(true);
      expect(mockAPI.respondDirtyFiles).toHaveBeenCalledWith(true);

      respondDirtyFiles(false);
      expect(mockAPI.respondDirtyFiles).toHaveBeenCalledWith(false);
    });

    it('should not throw when electron API is not available', () => {
      setElectronAPI(undefined);

      expect(() => respondDirtyFiles(true)).not.toThrow();
    });
  });

  // ==========================================================================
  // forceCloseApp
  // ==========================================================================
  describe('forceCloseApp', () => {
    it('should call forceClose', () => {
      forceCloseApp();
      expect(mockAPI.forceClose).toHaveBeenCalled();
    });

    it('should not throw when electron API is not available', () => {
      setElectronAPI(undefined);

      expect(() => forceCloseApp()).not.toThrow();
    });
  });

  // ==========================================================================
  // Base64 encoding edge cases
  // ==========================================================================
  describe('Base64 encoding', () => {
    it('should handle UTF-8 content with special characters', async () => {
      const xmlContent = '<?xml version="1.0"?><TSI>Ümlauts: äöü ñ 中文</TSI>';
      const base64Content = stringToBase64(xmlContent);

      mockAPI.openFile.mockResolvedValue({
        filePath: '/path/to/unicode.tsi',
        content: base64Content,
      });

      await ipcClient.openTsiFile();

      expect(TsiFile.fromXml).toHaveBeenCalledWith(xmlContent);
    });

    it('should handle empty content', async () => {
      const base64Content = stringToBase64('');

      mockAPI.openFile.mockResolvedValue({
        filePath: '/path/to/empty.tsi',
        content: base64Content,
      });

      await ipcClient.openTsiFile();

      expect(TsiFile.fromXml).toHaveBeenCalledWith('');
    });
  });
});

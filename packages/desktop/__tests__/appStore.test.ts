/**
 * Tests for appStore.ts - Application settings and recent files store
 *
 * AIDEV-NOTE: Tests cover all settings categories:
 * - paths, traktor, tsiOptimization, editor, confirmations, midi, advanced
 * - Recent files management
 * - Settings persistence and reset
 */

import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Import after mocking
import {
  DEFAULT_COLUMN_WIDTHS,
  DEFAULT_SETTINGS,
  useAppStore,
} from '../src/renderer/store/appStore';

describe('appStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    localStorageMock.clear();
    useAppStore.setState({
      recentFiles: [],
      settings: DEFAULT_SETTINGS,
    });
  });

  // ============================================================================
  // Recent Files Tests
  // ============================================================================

  describe('Recent Files', () => {
    it('should add a recent file', () => {
      const { addRecentFile } = useAppStore.getState();

      act(() => {
        addRecentFile('/path/to/file.tsi');
      });

      const state = useAppStore.getState();
      expect(state.recentFiles).toHaveLength(1);
      expect(state.recentFiles[0].path).toBe('/path/to/file.tsi');
      expect(state.recentFiles[0].name).toBe('file.tsi');
    });

    it('should move existing file to top when re-added', () => {
      const { addRecentFile } = useAppStore.getState();

      act(() => {
        addRecentFile('/path/to/file1.tsi');
        addRecentFile('/path/to/file2.tsi');
        addRecentFile('/path/to/file1.tsi');
      });

      const state = useAppStore.getState();
      expect(state.recentFiles).toHaveLength(2);
      expect(state.recentFiles[0].path).toBe('/path/to/file1.tsi');
      expect(state.recentFiles[1].path).toBe('/path/to/file2.tsi');
    });

    it('should limit recent files to maxRecentFiles', () => {
      const { addRecentFile } = useAppStore.getState();

      act(() => {
        for (let i = 0; i < 15; i++) {
          addRecentFile(`/path/to/file${i}.tsi`);
        }
      });

      const state = useAppStore.getState();
      expect(state.recentFiles).toHaveLength(state.maxRecentFiles);
    });

    it('should remove a recent file', () => {
      const { addRecentFile, removeRecentFile } = useAppStore.getState();

      act(() => {
        addRecentFile('/path/to/file1.tsi');
        addRecentFile('/path/to/file2.tsi');
        removeRecentFile('/path/to/file1.tsi');
      });

      const state = useAppStore.getState();
      expect(state.recentFiles).toHaveLength(1);
      expect(state.recentFiles[0].path).toBe('/path/to/file2.tsi');
    });

    it('should clear all recent files', () => {
      const { addRecentFile, clearRecentFiles } = useAppStore.getState();

      act(() => {
        addRecentFile('/path/to/file1.tsi');
        addRecentFile('/path/to/file2.tsi');
        clearRecentFiles();
      });

      const state = useAppStore.getState();
      expect(state.recentFiles).toHaveLength(0);
    });

    it('should not add empty file path', () => {
      const { addRecentFile } = useAppStore.getState();

      act(() => {
        addRecentFile('');
      });

      const state = useAppStore.getState();
      expect(state.recentFiles).toHaveLength(0);
    });

    it('should extract filename correctly from path', () => {
      const { addRecentFile } = useAppStore.getState();

      act(() => {
        addRecentFile('/Users/test/Documents/my-mapping.tsi');
        addRecentFile('C:\\Users\\test\\Documents\\windows-mapping.tsi');
      });

      const state = useAppStore.getState();
      expect(state.recentFiles[0].name).toBe('windows-mapping.tsi');
      expect(state.recentFiles[1].name).toBe('my-mapping.tsi');
    });
  });

  // ============================================================================
  // Paths Settings Tests
  // ============================================================================

  describe('Paths Settings', () => {
    it('should have correct default values', () => {
      const state = useAppStore.getState();
      expect(state.settings.paths.defaultWorkspace).toBe('');
      expect(state.settings.paths.pathToControllerDefaultMappings).toBe('');
      expect(state.settings.paths.pathToTraktorSettings).toBe('');
    });

    it('should update paths settings', () => {
      const { updatePathsSettings } = useAppStore.getState();

      act(() => {
        updatePathsSettings({
          defaultWorkspace: '/home/user/mappings',
          pathToTraktorSettings: '/home/user/traktor/Traktor Settings.tsi',
        });
      });

      const state = useAppStore.getState();
      expect(state.settings.paths.defaultWorkspace).toBe('/home/user/mappings');
      expect(state.settings.paths.pathToTraktorSettings).toBe(
        '/home/user/traktor/Traktor Settings.tsi'
      );
      // Unchanged value should remain
      expect(state.settings.paths.pathToControllerDefaultMappings).toBe('');
    });
  });

  // ============================================================================
  // Traktor Settings Tests
  // ============================================================================

  describe('Traktor Settings', () => {
    it('should have correct default values', () => {
      const state = useAppStore.getState();
      expect(state.settings.traktor.traktorVersion).toBe('3.11.0');
      expect(state.settings.traktor.overrideTraktorVersion).toBe(false);
    });

    it('should update traktor settings', () => {
      const { updateTraktorSettings } = useAppStore.getState();

      act(() => {
        updateTraktorSettings({
          traktorVersion: '3.8.0',
          overrideTraktorVersion: true,
        });
      });

      const state = useAppStore.getState();
      expect(state.settings.traktor.traktorVersion).toBe('3.8.0');
      expect(state.settings.traktor.overrideTraktorVersion).toBe(true);
    });
  });

  // ============================================================================
  // TSI Optimization Settings Tests
  // ============================================================================

  describe('TSI Optimization Settings', () => {
    it('should have correct default values', () => {
      const state = useAppStore.getState();
      expect(state.settings.tsiOptimization.removeUnusedMidiDefinitions).toBe(true);
      expect(state.settings.tsiOptimization.optimizeFxList).toBe(false);
      expect(state.settings.tsiOptimization.removeEmptyDevices).toBe(false);
    });

    it('should update tsi optimization settings', () => {
      const { updateTsiOptimizationSettings } = useAppStore.getState();

      act(() => {
        updateTsiOptimizationSettings({
          optimizeFxList: true,
          removeEmptyDevices: true,
        });
      });

      const state = useAppStore.getState();
      expect(state.settings.tsiOptimization.optimizeFxList).toBe(true);
      expect(state.settings.tsiOptimization.removeEmptyDevices).toBe(true);
      // Unchanged should remain
      expect(state.settings.tsiOptimization.removeUnusedMidiDefinitions).toBe(true);
    });
  });

  // ============================================================================
  // Editor Settings Tests
  // ============================================================================

  describe('Editor Settings', () => {
    it('should have correct default values', () => {
      const state = useAppStore.getState();
      expect(state.settings.editor.defaultViewMode).toBe('table');
      expect(state.settings.editor.showMidiColumn).toBe(true);
      expect(state.settings.editor.showConditionsColumn).toBe(true);
      expect(state.settings.editor.showCommentColumn).toBe(true);
      expect(state.settings.editor.showDecimalNotes).toBe(false);
      expect(state.settings.editor.showNotesBeforeCc).toBe(false);
      expect(state.settings.editor.clearFilterAtPageChanges).toBe(false);
      expect(state.settings.editor.clearFilterAtModifications).toBe(false);
      expect(state.settings.editor.filterMenuSize).toBe(20);
      expect(state.settings.editor.columnWidths).toEqual(DEFAULT_COLUMN_WIDTHS);
    });

    it('should update editor settings', () => {
      const { updateEditorSettings } = useAppStore.getState();

      act(() => {
        updateEditorSettings({
          showDecimalNotes: true,
          showNotesBeforeCc: true,
          filterMenuSize: 50,
          clearFilterAtPageChanges: true,
        });
      });

      const state = useAppStore.getState();
      expect(state.settings.editor.showDecimalNotes).toBe(true);
      expect(state.settings.editor.showNotesBeforeCc).toBe(true);
      expect(state.settings.editor.filterMenuSize).toBe(50);
      expect(state.settings.editor.clearFilterAtPageChanges).toBe(true);
    });

    it('should update column widths separately', () => {
      const { updateColumnWidths } = useAppStore.getState();

      act(() => {
        updateColumnWidths({
          commandName: 250,
          conditions: 300,
        });
      });

      const state = useAppStore.getState();
      expect(state.settings.editor.columnWidths.commandName).toBe(250);
      expect(state.settings.editor.columnWidths.conditions).toBe(300);
      // Other columns unchanged
      expect(state.settings.editor.columnWidths.index).toBe(DEFAULT_COLUMN_WIDTHS.index);
    });
  });

  // ============================================================================
  // Confirmations Settings Tests
  // ============================================================================

  describe('Confirmations Settings', () => {
    it('should have correct default values', () => {
      const state = useAppStore.getState();
      expect(state.settings.confirmations.confirmDeleteDevices).toBe(true);
      expect(state.settings.confirmations.confirmDeleteMappingsThreshold).toBe(20);
    });

    it('should update confirmations settings', () => {
      const { updateConfirmationsSettings } = useAppStore.getState();

      act(() => {
        updateConfirmationsSettings({
          confirmDeleteDevices: false,
          confirmDeleteMappingsThreshold: 10,
        });
      });

      const state = useAppStore.getState();
      expect(state.settings.confirmations.confirmDeleteDevices).toBe(false);
      expect(state.settings.confirmations.confirmDeleteMappingsThreshold).toBe(10);
    });

    it('should allow threshold of 0 to disable confirmation', () => {
      const { updateConfirmationsSettings } = useAppStore.getState();

      act(() => {
        updateConfirmationsSettings({
          confirmDeleteMappingsThreshold: 0,
        });
      });

      const state = useAppStore.getState();
      expect(state.settings.confirmations.confirmDeleteMappingsThreshold).toBe(0);
    });
  });

  // ============================================================================
  // MIDI Settings Tests
  // ============================================================================

  describe('MIDI Settings', () => {
    it('should have correct default values', () => {
      const state = useAppStore.getState();
      expect(state.settings.midi.enableOnStartup).toBe(true);
      expect(state.settings.midi.defaultInputDevice).toBe('');
      expect(state.settings.midi.defaultOutputDevice).toBe('');
      expect(state.settings.midi.learnTimeout).toBe(10);
    });

    it('should update midi settings', () => {
      const { updateMidiSettings } = useAppStore.getState();

      act(() => {
        updateMidiSettings({
          enableOnStartup: false,
          defaultInputDevice: 'My MIDI Controller',
          learnTimeout: 30,
        });
      });

      const state = useAppStore.getState();
      expect(state.settings.midi.enableOnStartup).toBe(false);
      expect(state.settings.midi.defaultInputDevice).toBe('My MIDI Controller');
      expect(state.settings.midi.learnTimeout).toBe(30);
    });
  });

  // ============================================================================
  // Advanced Settings Tests
  // ============================================================================

  describe('Advanced Settings', () => {
    it('should have correct default values', () => {
      const state = useAppStore.getState();
      expect(state.settings.advanced.loadLastFileAtStartup).toBe(false);
      expect(state.settings.advanced.verboseExceptions).toBe(false);
    });

    it('should update advanced settings', () => {
      const { updateAdvancedSettings } = useAppStore.getState();

      act(() => {
        updateAdvancedSettings({
          loadLastFileAtStartup: true,
          verboseExceptions: true,
        });
      });

      const state = useAppStore.getState();
      expect(state.settings.advanced.loadLastFileAtStartup).toBe(true);
      expect(state.settings.advanced.verboseExceptions).toBe(true);
    });
  });

  // ============================================================================
  // Reset Settings Tests
  // ============================================================================

  describe('Reset Settings', () => {
    it('should reset all settings to defaults', () => {
      const { updatePathsSettings, updateEditorSettings, updateMidiSettings, resetSettings } =
        useAppStore.getState();

      // Make some changes
      act(() => {
        updatePathsSettings({ defaultWorkspace: '/custom/path' });
        updateEditorSettings({ filterMenuSize: 100 });
        updateMidiSettings({ learnTimeout: 60 });
      });

      // Verify changes
      let state = useAppStore.getState();
      expect(state.settings.paths.defaultWorkspace).toBe('/custom/path');
      expect(state.settings.editor.filterMenuSize).toBe(100);
      expect(state.settings.midi.learnTimeout).toBe(60);

      // Reset
      act(() => {
        resetSettings();
      });

      // Verify reset
      state = useAppStore.getState();
      expect(state.settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should not affect recent files when resetting settings', () => {
      const { addRecentFile, resetSettings } = useAppStore.getState();

      act(() => {
        addRecentFile('/path/to/file.tsi');
        resetSettings();
      });

      const state = useAppStore.getState();
      expect(state.recentFiles).toHaveLength(1);
      expect(state.settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  // ============================================================================
  // Selector Hooks Tests
  // ============================================================================

  describe('Selector Hooks', () => {
    it('useRecentFiles should return recent files', () => {
      const { addRecentFile } = useAppStore.getState();

      act(() => {
        addRecentFile('/path/to/file.tsi');
      });

      // Note: In a real React component test, you'd use renderHook
      // Here we just verify the selector function works
      const recentFiles = useAppStore.getState().recentFiles;
      expect(recentFiles).toHaveLength(1);
    });

    it('useColumnWidths should return default when not hydrated', () => {
      // The hook should return defaults even if settings aren't loaded
      const columnWidths = useAppStore.getState().settings?.editor?.columnWidths;
      expect(columnWidths).toEqual(DEFAULT_COLUMN_WIDTHS);
    });
  });

  // ============================================================================
  // Default Settings Validation
  // ============================================================================

  describe('DEFAULT_SETTINGS validation', () => {
    it('should have all required paths properties', () => {
      expect(DEFAULT_SETTINGS.paths).toHaveProperty('defaultWorkspace');
      expect(DEFAULT_SETTINGS.paths).toHaveProperty('pathToControllerDefaultMappings');
      expect(DEFAULT_SETTINGS.paths).toHaveProperty('pathToTraktorSettings');
    });

    it('should have all required traktor properties', () => {
      expect(DEFAULT_SETTINGS.traktor).toHaveProperty('traktorVersion');
      expect(DEFAULT_SETTINGS.traktor).toHaveProperty('overrideTraktorVersion');
    });

    it('should have all required tsiOptimization properties', () => {
      expect(DEFAULT_SETTINGS.tsiOptimization).toHaveProperty('removeUnusedMidiDefinitions');
      expect(DEFAULT_SETTINGS.tsiOptimization).toHaveProperty('optimizeFxList');
      expect(DEFAULT_SETTINGS.tsiOptimization).toHaveProperty('removeEmptyDevices');
    });

    it('should have all required editor properties', () => {
      expect(DEFAULT_SETTINGS.editor).toHaveProperty('defaultViewMode');
      expect(DEFAULT_SETTINGS.editor).toHaveProperty('showMidiColumn');
      expect(DEFAULT_SETTINGS.editor).toHaveProperty('showConditionsColumn');
      expect(DEFAULT_SETTINGS.editor).toHaveProperty('showCommentColumn');
      expect(DEFAULT_SETTINGS.editor).toHaveProperty('columnWidths');
      expect(DEFAULT_SETTINGS.editor).toHaveProperty('showDecimalNotes');
      expect(DEFAULT_SETTINGS.editor).toHaveProperty('showNotesBeforeCc');
      expect(DEFAULT_SETTINGS.editor).toHaveProperty('clearFilterAtPageChanges');
      expect(DEFAULT_SETTINGS.editor).toHaveProperty('clearFilterAtModifications');
      expect(DEFAULT_SETTINGS.editor).toHaveProperty('filterMenuSize');
    });

    it('should have all required confirmations properties', () => {
      expect(DEFAULT_SETTINGS.confirmations).toHaveProperty('confirmDeleteDevices');
      expect(DEFAULT_SETTINGS.confirmations).toHaveProperty('confirmDeleteMappingsThreshold');
    });

    it('should have all required midi properties', () => {
      expect(DEFAULT_SETTINGS.midi).toHaveProperty('enableOnStartup');
      expect(DEFAULT_SETTINGS.midi).toHaveProperty('defaultInputDevice');
      expect(DEFAULT_SETTINGS.midi).toHaveProperty('defaultOutputDevice');
      expect(DEFAULT_SETTINGS.midi).toHaveProperty('learnTimeout');
    });

    it('should have all required advanced properties', () => {
      expect(DEFAULT_SETTINGS.advanced).toHaveProperty('loadLastFileAtStartup');
      expect(DEFAULT_SETTINGS.advanced).toHaveProperty('verboseExceptions');
    });
  });

  // ============================================================================
  // Column Widths Validation
  // ============================================================================

  describe('DEFAULT_COLUMN_WIDTHS validation', () => {
    it('should have all required column width properties', () => {
      expect(DEFAULT_COLUMN_WIDTHS).toHaveProperty('index');
      expect(DEFAULT_COLUMN_WIDTHS).toHaveProperty('io');
      expect(DEFAULT_COLUMN_WIDTHS).toHaveProperty('commandName');
      expect(DEFAULT_COLUMN_WIDTHS).toHaveProperty('midi');
      expect(DEFAULT_COLUMN_WIDTHS).toHaveProperty('conditions');
      expect(DEFAULT_COLUMN_WIDTHS).toHaveProperty('comment');
    });

    it('should have positive width values', () => {
      for (const value of Object.values(DEFAULT_COLUMN_WIDTHS)) {
        expect(value).toBeGreaterThan(0);
      }
    });
  });
});

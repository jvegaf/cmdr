/**
 * Tests for useKeyboardShortcuts hook
 *
 * AIDEV-NOTE: Tests keyboard shortcuts by mocking stores and simulating keyboard events.
 * Tests both default store behavior and custom handlers.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ============================================================================
// Mocks
// ============================================================================

// Mock active file state
let mockActiveFile: {
  id: string;
  selectedDeviceIndex: number | null;
  selectedMappingIds: Set<number>;
  devices: Array<{ mappings: Array<{ id: number }> }>;
} | null = null;

// Mock store functions
const mockCopyMappings = vi.fn();
const mockCutMappings = vi.fn();
const mockPasteMappings = vi.fn();
const mockDuplicateMappings = vi.fn();
const mockDeleteMappings = vi.fn();
const mockSelectMappings = vi.fn();
const mockClearMappingSelection = vi.fn();
const mockCanPaste = vi.fn(() => false);
const mockUndo = vi.fn();
const mockRedo = vi.fn();
const mockCanUndo = vi.fn(() => false);
const mockCanRedo = vi.fn(() => false);

vi.mock('../src/renderer/store/tsiStore', () => ({
  useActiveFile: () => mockActiveFile,
  useTsiStore: () => ({
    copyMappings: mockCopyMappings,
    cutMappings: mockCutMappings,
    pasteMappings: mockPasteMappings,
    duplicateMappings: mockDuplicateMappings,
    deleteMappings: mockDeleteMappings,
    selectMappings: mockSelectMappings,
    clearMappingSelection: mockClearMappingSelection,
    canPaste: mockCanPaste,
    undo: mockUndo,
    redo: mockRedo,
  }),
}));

vi.mock('../src/renderer/store/historyStore', () => ({
  useHistoryStore: () => ({
    canUndo: mockCanUndo,
    canRedo: mockCanRedo,
  }),
}));

// Import after mocks
import {
  useKeyboardShortcuts,
  getShortcutDisplay,
  SHORTCUTS,
  type KeyboardShortcutHandlers,
} from '../src/renderer/hooks/useKeyboardShortcuts';

// ============================================================================
// Test Helpers
// ============================================================================

function createKeyboardEvent(
  key: string,
  options: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {}
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    ctrlKey: options.ctrlKey ?? false,
    metaKey: options.metaKey ?? false,
    shiftKey: options.shiftKey ?? false,
    bubbles: true,
  });
}

function dispatchKey(
  key: string,
  options: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {}
) {
  const event = createKeyboardEvent(key, options);
  window.dispatchEvent(event);
}

function setupActiveFile(
  overrides: Partial<typeof mockActiveFile> = {}
): NonNullable<typeof mockActiveFile> {
  mockActiveFile = {
    id: 'test-file-id',
    selectedDeviceIndex: 0,
    selectedMappingIds: new Set([1, 2]),
    devices: [{ mappings: [{ id: 1 }, { id: 2 }, { id: 3 }] }],
    ...overrides,
  };
  return mockActiveFile;
}

// ============================================================================
// Tests
// ============================================================================

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveFile = null;
    mockCanPaste.mockReturnValue(false);
    mockCanUndo.mockReturnValue(false);
    mockCanRedo.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Basic Functionality
  // ==========================================================================
  describe('Basic Functionality', () => {
    it('should add keydown event listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useKeyboardShortcuts());

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      addEventListenerSpy.mockRestore();
    });

    it('should remove keydown event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useKeyboardShortcuts());
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });

    it('should not respond to shortcuts when disabled', () => {
      setupActiveFile();
      const handlers: KeyboardShortcutHandlers = { onCopy: vi.fn() };

      renderHook(() => useKeyboardShortcuts(handlers, false));

      act(() => dispatchKey('c', { ctrlKey: true }));

      expect(handlers.onCopy).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // File Operations (always available)
  // ==========================================================================
  describe('File Operations', () => {
    it('should call onNew for Ctrl+N', () => {
      const handlers: KeyboardShortcutHandlers = { onNew: vi.fn() };
      renderHook(() => useKeyboardShortcuts(handlers));

      act(() => dispatchKey('n', { ctrlKey: true }));

      expect(handlers.onNew).toHaveBeenCalledOnce();
    });

    it('should call onOpen for Ctrl+O', () => {
      const handlers: KeyboardShortcutHandlers = { onOpen: vi.fn() };
      renderHook(() => useKeyboardShortcuts(handlers));

      act(() => dispatchKey('o', { ctrlKey: true }));

      expect(handlers.onOpen).toHaveBeenCalledOnce();
    });

    it('should call onSave for Ctrl+S', () => {
      const handlers: KeyboardShortcutHandlers = { onSave: vi.fn() };
      renderHook(() => useKeyboardShortcuts(handlers));

      act(() => dispatchKey('s', { ctrlKey: true }));

      expect(handlers.onSave).toHaveBeenCalledOnce();
    });

    it('should call onSaveAs for Ctrl+Shift+S', () => {
      const handlers: KeyboardShortcutHandlers = { onSaveAs: vi.fn() };
      renderHook(() => useKeyboardShortcuts(handlers));

      act(() => dispatchKey('s', { ctrlKey: true, shiftKey: true }));

      expect(handlers.onSaveAs).toHaveBeenCalledOnce();
    });

    it('should call onSearch for Ctrl+F', () => {
      const handlers: KeyboardShortcutHandlers = { onSearch: vi.fn() };
      renderHook(() => useKeyboardShortcuts(handlers));

      act(() => dispatchKey('f', { ctrlKey: true }));

      expect(handlers.onSearch).toHaveBeenCalledOnce();
    });
  });

  // ==========================================================================
  // Undo/Redo
  // ==========================================================================
  describe('Undo/Redo', () => {
    it('should call custom onUndo for Ctrl+Z', () => {
      const handlers: KeyboardShortcutHandlers = { onUndo: vi.fn() };
      renderHook(() => useKeyboardShortcuts(handlers));

      act(() => dispatchKey('z', { ctrlKey: true }));

      expect(handlers.onUndo).toHaveBeenCalledOnce();
    });

    it('should call store undo when no custom handler and canUndo', () => {
      setupActiveFile();
      mockCanUndo.mockReturnValue(true);

      renderHook(() => useKeyboardShortcuts());

      act(() => dispatchKey('z', { ctrlKey: true }));

      expect(mockUndo).toHaveBeenCalledWith('test-file-id');
    });

    it('should not call store undo when canUndo is false', () => {
      setupActiveFile();
      mockCanUndo.mockReturnValue(false);

      renderHook(() => useKeyboardShortcuts());

      act(() => dispatchKey('z', { ctrlKey: true }));

      expect(mockUndo).not.toHaveBeenCalled();
    });

    it('should call custom onRedo for Ctrl+Y', () => {
      const handlers: KeyboardShortcutHandlers = { onRedo: vi.fn() };
      renderHook(() => useKeyboardShortcuts(handlers));

      act(() => dispatchKey('y', { ctrlKey: true }));

      expect(handlers.onRedo).toHaveBeenCalledOnce();
    });

    it('should call custom onRedo for Ctrl+Shift+Z', () => {
      const handlers: KeyboardShortcutHandlers = { onRedo: vi.fn() };
      renderHook(() => useKeyboardShortcuts(handlers));

      act(() => dispatchKey('z', { ctrlKey: true, shiftKey: true }));

      expect(handlers.onRedo).toHaveBeenCalledOnce();
    });

    it('should call store redo when no custom handler and canRedo', () => {
      setupActiveFile();
      mockCanRedo.mockReturnValue(true);

      renderHook(() => useKeyboardShortcuts());

      act(() => dispatchKey('y', { ctrlKey: true }));

      expect(mockRedo).toHaveBeenCalledWith('test-file-id');
    });
  });

  // ==========================================================================
  // Mapping Operations (require active file with device)
  // ==========================================================================
  describe('Mapping Operations', () => {
    it('should not execute mapping operations without active file', () => {
      mockActiveFile = null;
      renderHook(() => useKeyboardShortcuts());

      act(() => dispatchKey('c', { ctrlKey: true }));

      expect(mockCopyMappings).not.toHaveBeenCalled();
    });

    it('should not execute mapping operations without selected device', () => {
      setupActiveFile({ selectedDeviceIndex: null });
      renderHook(() => useKeyboardShortcuts());

      act(() => dispatchKey('c', { ctrlKey: true }));

      expect(mockCopyMappings).not.toHaveBeenCalled();
    });

    describe('Copy (Ctrl+C)', () => {
      it('should call custom onCopy handler', () => {
        setupActiveFile();
        const handlers: KeyboardShortcutHandlers = { onCopy: vi.fn() };
        renderHook(() => useKeyboardShortcuts(handlers));

        act(() => dispatchKey('c', { ctrlKey: true }));

        expect(handlers.onCopy).toHaveBeenCalledOnce();
        expect(mockCopyMappings).not.toHaveBeenCalled();
      });

      it('should call store copyMappings when no custom handler', () => {
        setupActiveFile();
        renderHook(() => useKeyboardShortcuts());

        act(() => dispatchKey('c', { ctrlKey: true }));

        expect(mockCopyMappings).toHaveBeenCalledWith('test-file-id');
      });

      it('should not copy when no mappings selected', () => {
        setupActiveFile({ selectedMappingIds: new Set() });
        renderHook(() => useKeyboardShortcuts());

        act(() => dispatchKey('c', { ctrlKey: true }));

        expect(mockCopyMappings).not.toHaveBeenCalled();
      });
    });

    describe('Cut (Ctrl+X)', () => {
      it('should call store cutMappings', () => {
        setupActiveFile();
        renderHook(() => useKeyboardShortcuts());

        act(() => dispatchKey('x', { ctrlKey: true }));

        expect(mockCutMappings).toHaveBeenCalledWith('test-file-id');
      });
    });

    describe('Paste (Ctrl+V)', () => {
      it('should call store pasteMappings when canPaste', () => {
        setupActiveFile();
        mockCanPaste.mockReturnValue(true);
        renderHook(() => useKeyboardShortcuts());

        act(() => dispatchKey('v', { ctrlKey: true }));

        expect(mockPasteMappings).toHaveBeenCalledWith('test-file-id');
      });

      it('should not paste when canPaste is false', () => {
        setupActiveFile();
        mockCanPaste.mockReturnValue(false);
        renderHook(() => useKeyboardShortcuts());

        act(() => dispatchKey('v', { ctrlKey: true }));

        expect(mockPasteMappings).not.toHaveBeenCalled();
      });
    });

    describe('Duplicate (Ctrl+D)', () => {
      it('should call store duplicateMappings', () => {
        setupActiveFile();
        renderHook(() => useKeyboardShortcuts());

        act(() => dispatchKey('d', { ctrlKey: true }));

        expect(mockDuplicateMappings).toHaveBeenCalledWith('test-file-id');
      });
    });

    describe('Delete', () => {
      it('should call store deleteMappings on Delete key', () => {
        setupActiveFile();
        renderHook(() => useKeyboardShortcuts());

        act(() => dispatchKey('Delete'));

        expect(mockDeleteMappings).toHaveBeenCalledWith('test-file-id');
      });

      it('should call store deleteMappings on Backspace key', () => {
        setupActiveFile();
        renderHook(() => useKeyboardShortcuts());

        act(() => dispatchKey('Backspace'));

        expect(mockDeleteMappings).toHaveBeenCalledWith('test-file-id');
      });

      it('should not delete when no mappings selected', () => {
        setupActiveFile({ selectedMappingIds: new Set() });
        renderHook(() => useKeyboardShortcuts());

        act(() => dispatchKey('Delete'));

        expect(mockDeleteMappings).not.toHaveBeenCalled();
      });
    });

    describe('Select All (Ctrl+A)', () => {
      it('should select all mappings in device', () => {
        setupActiveFile();
        renderHook(() => useKeyboardShortcuts());

        act(() => dispatchKey('a', { ctrlKey: true }));

        expect(mockSelectMappings).toHaveBeenCalledWith('test-file-id', [1, 2, 3]);
      });
    });

    describe('Escape', () => {
      it('should clear mapping selection', () => {
        setupActiveFile();
        renderHook(() => useKeyboardShortcuts());

        act(() => dispatchKey('Escape'));

        expect(mockClearMappingSelection).toHaveBeenCalledWith('test-file-id');
      });
    });
  });

  // ==========================================================================
  // Input Field Handling
  // ==========================================================================
  describe('Input Field Handling', () => {
    it('should ignore most shortcuts in input fields', () => {
      setupActiveFile();
      const handlers: KeyboardShortcutHandlers = { onCopy: vi.fn() };
      renderHook(() => useKeyboardShortcuts(handlers));

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        bubbles: true,
      });
      input.dispatchEvent(event);

      expect(handlers.onCopy).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });

    it('should allow Escape in input fields', () => {
      setupActiveFile();
      renderHook(() => useKeyboardShortcuts());

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      input.dispatchEvent(event);

      expect(mockClearMappingSelection).toHaveBeenCalled();
      document.body.removeChild(input);
    });
  });

  // ==========================================================================
  // Meta Key Support (Mac)
  // ==========================================================================
  describe('Meta Key Support', () => {
    it('should respond to Cmd+C on Mac', () => {
      setupActiveFile();
      renderHook(() => useKeyboardShortcuts());

      act(() => dispatchKey('c', { metaKey: true }));

      expect(mockCopyMappings).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// getShortcutDisplay Tests
// ============================================================================
describe('getShortcutDisplay', () => {
  it('should format single key', () => {
    expect(getShortcutDisplay('a')).toBe('A');
    expect(getShortcutDisplay('Delete')).toBe('Delete');
  });

  it('should format with Ctrl modifier', () => {
    // Note: Result depends on navigator.platform
    const result = getShortcutDisplay('c', { ctrl: true });
    expect(result).toMatch(/Ctrl\+C|⌘C/);
  });

  it('should format with Shift modifier', () => {
    const result = getShortcutDisplay('s', { ctrl: true, shift: true });
    expect(result).toMatch(/Ctrl\+Shift\+S|⌘⇧S/);
  });

  it('should format with Alt modifier', () => {
    const result = getShortcutDisplay('a', { alt: true });
    expect(result).toMatch(/Alt\+A|⌥A/);
  });
});

// ============================================================================
// SHORTCUTS Constant Tests
// ============================================================================
describe('SHORTCUTS', () => {
  it('should have all expected shortcuts defined', () => {
    expect(SHORTCUTS.copy).toBeDefined();
    expect(SHORTCUTS.cut).toBeDefined();
    expect(SHORTCUTS.paste).toBeDefined();
    expect(SHORTCUTS.duplicate).toBeDefined();
    expect(SHORTCUTS.delete).toBe('Delete');
    expect(SHORTCUTS.selectAll).toBeDefined();
    expect(SHORTCUTS.save).toBeDefined();
    expect(SHORTCUTS.saveAs).toBeDefined();
    expect(SHORTCUTS.open).toBeDefined();
    expect(SHORTCUTS.new).toBeDefined();
    expect(SHORTCUTS.undo).toBeDefined();
    expect(SHORTCUTS.redo).toBeDefined();
    expect(SHORTCUTS.search).toBeDefined();
  });
});

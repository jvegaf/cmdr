/**
 * Tests for useMenuActions hook
 *
 * AIDEV-NOTE: Tests the menu actions hook by mocking ipc-client and simulating menu events.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// Track callbacks for testing
let capturedMenuCallback: ((payload: { action: string; payload?: unknown }) => void) | null = null;
const mockUnsubscribe = vi.fn();

vi.mock('../src/renderer/lib/ipc-client', () => ({
  subscribeToMenuActions: vi.fn((callback) => {
    capturedMenuCallback = callback;
    return mockUnsubscribe;
  }),
}));

// Import after mock
import { useMenuActions, type MenuActionHandlers } from '../src/renderer/hooks/useMenuActions';
import { subscribeToMenuActions } from '../src/renderer/lib/ipc-client';

// Helper to trigger a menu action
function triggerMenuAction(action: string, payload?: unknown) {
  capturedMenuCallback?.({ action, payload });
}

describe('useMenuActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedMenuCallback = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should subscribe to menu actions on mount', () => {
    renderHook(() => useMenuActions({}));

    expect(subscribeToMenuActions).toHaveBeenCalledOnce();
    expect(subscribeToMenuActions).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useMenuActions({}));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });

  // ==========================================================================
  // File Menu Actions
  // ==========================================================================
  describe('File Menu', () => {
    it('should call onNew for "new" action', () => {
      const handlers: MenuActionHandlers = { onNew: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('new');

      expect(handlers.onNew).toHaveBeenCalledOnce();
    });

    it('should call onOpen for "open" action', () => {
      const handlers: MenuActionHandlers = { onOpen: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('open');

      expect(handlers.onOpen).toHaveBeenCalledOnce();
    });

    it('should call onSave for "save" action', () => {
      const handlers: MenuActionHandlers = { onSave: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('save');

      expect(handlers.onSave).toHaveBeenCalledOnce();
    });

    it('should call onSaveAs for "saveAs" action', () => {
      const handlers: MenuActionHandlers = { onSaveAs: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('saveAs');

      expect(handlers.onSaveAs).toHaveBeenCalledOnce();
    });

    it('should call onClose for "close" action', () => {
      const handlers: MenuActionHandlers = { onClose: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('close');

      expect(handlers.onClose).toHaveBeenCalledOnce();
    });

    it('should call onExportCsv for "exportCsv" action', () => {
      const handlers: MenuActionHandlers = { onExportCsv: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('exportCsv');

      expect(handlers.onExportCsv).toHaveBeenCalledOnce();
    });

    it('should call onSettings for "settings" action', () => {
      const handlers: MenuActionHandlers = { onSettings: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('settings');

      expect(handlers.onSettings).toHaveBeenCalledOnce();
    });
  });

  // ==========================================================================
  // Edit Menu Actions
  // ==========================================================================
  describe('Edit Menu', () => {
    it('should call onUndo for "undo" action', () => {
      const handlers: MenuActionHandlers = { onUndo: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('undo');

      expect(handlers.onUndo).toHaveBeenCalledOnce();
    });

    it('should call onRedo for "redo" action', () => {
      const handlers: MenuActionHandlers = { onRedo: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('redo');

      expect(handlers.onRedo).toHaveBeenCalledOnce();
    });

    it('should call onCut for "cut" action', () => {
      const handlers: MenuActionHandlers = { onCut: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('cut');

      expect(handlers.onCut).toHaveBeenCalledOnce();
    });

    it('should call onCopy for "copy" action', () => {
      const handlers: MenuActionHandlers = { onCopy: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('copy');

      expect(handlers.onCopy).toHaveBeenCalledOnce();
    });

    it('should call onPaste for "paste" action', () => {
      const handlers: MenuActionHandlers = { onPaste: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('paste');

      expect(handlers.onPaste).toHaveBeenCalledOnce();
    });

    it('should call onDuplicate for "duplicate" action', () => {
      const handlers: MenuActionHandlers = { onDuplicate: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('duplicate');

      expect(handlers.onDuplicate).toHaveBeenCalledOnce();
    });

    it('should call onDelete for "delete" action', () => {
      const handlers: MenuActionHandlers = { onDelete: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('delete');

      expect(handlers.onDelete).toHaveBeenCalledOnce();
    });

    it('should call onSelectAll for "selectAll" action', () => {
      const handlers: MenuActionHandlers = { onSelectAll: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('selectAll');

      expect(handlers.onSelectAll).toHaveBeenCalledOnce();
    });
  });

  // ==========================================================================
  // View Menu Actions
  // ==========================================================================
  describe('View Menu', () => {
    it('should call onTheme with "light" for theme action', () => {
      const handlers: MenuActionHandlers = { onTheme: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('theme', 'light');

      expect(handlers.onTheme).toHaveBeenCalledWith('light');
    });

    it('should call onTheme with "dark" for theme action', () => {
      const handlers: MenuActionHandlers = { onTheme: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('theme', 'dark');

      expect(handlers.onTheme).toHaveBeenCalledWith('dark');
    });

    it('should call onTheme with "system" for theme action', () => {
      const handlers: MenuActionHandlers = { onTheme: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('theme', 'system');

      expect(handlers.onTheme).toHaveBeenCalledWith('system');
    });

    it('should not call onTheme for invalid theme value', () => {
      const handlers: MenuActionHandlers = { onTheme: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('theme', 'invalid');

      expect(handlers.onTheme).not.toHaveBeenCalled();
    });

    it('should call onShowCommandsReport for "showCommandsReport" action', () => {
      const handlers: MenuActionHandlers = { onShowCommandsReport: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('showCommandsReport');

      expect(handlers.onShowCommandsReport).toHaveBeenCalledOnce();
    });

    it('should call onShowConditionsSummary for "showConditionsSummary" action', () => {
      const handlers: MenuActionHandlers = { onShowConditionsSummary: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('showConditionsSummary');

      expect(handlers.onShowConditionsSummary).toHaveBeenCalledOnce();
    });
  });

  // ==========================================================================
  // Help Menu Actions
  // ==========================================================================
  describe('Help Menu', () => {
    it('should call onShortcuts for "shortcuts" action', () => {
      const handlers: MenuActionHandlers = { onShortcuts: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('shortcuts');

      expect(handlers.onShortcuts).toHaveBeenCalledOnce();
    });

    it('should call onAbout for "about" action', () => {
      const handlers: MenuActionHandlers = { onAbout: vi.fn() };
      renderHook(() => useMenuActions(handlers));

      triggerMenuAction('about');

      expect(handlers.onAbout).toHaveBeenCalledOnce();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle unknown action without crashing', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      renderHook(() => useMenuActions({}));

      expect(() => triggerMenuAction('unknownAction')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Unknown menu action: unknownAction');

      consoleSpy.mockRestore();
    });

    it('should not crash when handler is not provided', () => {
      renderHook(() => useMenuActions({}));

      // Should not throw even without handlers
      expect(() => {
        triggerMenuAction('new');
        triggerMenuAction('open');
        triggerMenuAction('save');
      }).not.toThrow();
    });

    it('should update handlers when they change', () => {
      const handlers1: MenuActionHandlers = { onNew: vi.fn() };
      const handlers2: MenuActionHandlers = { onNew: vi.fn() };

      const { rerender } = renderHook(({ handlers }) => useMenuActions(handlers), {
        initialProps: { handlers: handlers1 },
      });

      triggerMenuAction('new');
      expect(handlers1.onNew).toHaveBeenCalledOnce();

      rerender({ handlers: handlers2 });

      triggerMenuAction('new');
      expect(handlers2.onNew).toHaveBeenCalledOnce();
      expect(handlers1.onNew).toHaveBeenCalledOnce(); // Should not be called again
    });
  });
});

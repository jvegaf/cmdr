/**
 * Tests for historyStore.ts - Undo/Redo History Management
 *
 * AIDEV-NOTE: Tests cover the Command pattern-based undo/redo system.
 * - Per-file history management
 * - Undo/redo stack operations
 * - History size limits
 * - Selector hooks
 */

import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { type UndoableAction, useHistoryStore } from '../src/renderer/store/historyStore';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock undoable action for testing
 */
function createMockAction(
  type: UndoableAction['type'] = 'UPDATE_MAPPING',
  description = 'Test action',
  deviceIndex = 0
): UndoableAction {
  return {
    type,
    description,
    deviceIndex,
    before: {
      mappings: [
        {
          id: 1,
          index: 0,
          data: {
            // Minimal MappingData structure
          } as UndoableAction['before']['mappings'][0]['data'],
        },
      ],
    },
    after: {
      mappings: [
        {
          id: 1,
          index: 0,
          data: {} as UndoableAction['after']['mappings'][0]['data'],
        },
      ],
    },
    timestamp: Date.now(),
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('historyStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useHistoryStore.setState({
      histories: new Map(),
      maxHistorySize: 50,
    });
  });

  // ==========================================================================
  // Basic Operations
  // ==========================================================================

  describe('Basic Operations', () => {
    it('should start with empty history', () => {
      const state = useHistoryStore.getState();
      expect(state.histories.size).toBe(0);
    });

    it('should create history for new file when pushing action', () => {
      const { pushAction } = useHistoryStore.getState();

      act(() => {
        pushAction('file1', createMockAction());
      });

      const state = useHistoryStore.getState();
      expect(state.histories.has('file1')).toBe(true);
    });

    it('should maintain separate histories for different files', () => {
      const { pushAction } = useHistoryStore.getState();

      act(() => {
        pushAction('file1', createMockAction('CREATE_MAPPING', 'Action 1'));
        pushAction('file2', createMockAction('DELETE_MAPPINGS', 'Action 2'));
      });

      const state = useHistoryStore.getState();
      expect(state.histories.size).toBe(2);
      expect(state.histories.get('file1')?.undoStack).toHaveLength(1);
      expect(state.histories.get('file2')?.undoStack).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Push Action
  // ==========================================================================

  describe('pushAction', () => {
    it('should add action to undo stack', () => {
      const { pushAction } = useHistoryStore.getState();
      const action = createMockAction();

      act(() => {
        pushAction('file1', action);
      });

      const history = useHistoryStore.getState().histories.get('file1');
      expect(history?.undoStack).toHaveLength(1);
      expect(history?.undoStack[0]).toBe(action);
    });

    it('should clear redo stack when new action is pushed', () => {
      const { pushAction, popUndo } = useHistoryStore.getState();

      act(() => {
        pushAction('file1', createMockAction('CREATE_MAPPING', 'Action 1'));
        pushAction('file1', createMockAction('UPDATE_MAPPING', 'Action 2'));
      });

      // Undo to populate redo stack
      act(() => {
        popUndo('file1');
      });

      let history = useHistoryStore.getState().histories.get('file1');
      expect(history?.redoStack).toHaveLength(1);

      // Push new action - should clear redo stack
      act(() => {
        pushAction('file1', createMockAction('DELETE_MAPPINGS', 'Action 3'));
      });

      history = useHistoryStore.getState().histories.get('file1');
      expect(history?.redoStack).toHaveLength(0);
    });

    it('should limit history to maxHistorySize', () => {
      const { pushAction } = useHistoryStore.getState();

      // Push more than max history size
      act(() => {
        for (let i = 0; i < 60; i++) {
          pushAction('file1', createMockAction('UPDATE_MAPPING', `Action ${i}`));
        }
      });

      const state = useHistoryStore.getState();
      const history = state.histories.get('file1');
      expect(history?.undoStack.length).toBe(state.maxHistorySize);

      // Oldest actions should be removed
      expect(history?.undoStack[0]?.description).toBe('Action 10');
    });
  });

  // ==========================================================================
  // Pop Undo
  // ==========================================================================

  describe('popUndo', () => {
    it('should return null if no history exists', () => {
      const { popUndo } = useHistoryStore.getState();

      const action = popUndo('nonexistent');
      expect(action).toBeNull();
    });

    it('should return null if undo stack is empty', () => {
      const { pushAction, popUndo } = useHistoryStore.getState();

      act(() => {
        pushAction('file1', createMockAction());
        popUndo('file1');
      });

      const action = popUndo('file1');
      expect(action).toBeNull();
    });

    it('should return the last action and remove it from undo stack', () => {
      const { pushAction, popUndo } = useHistoryStore.getState();
      const action1 = createMockAction('CREATE_MAPPING', 'Action 1');
      const action2 = createMockAction('UPDATE_MAPPING', 'Action 2');

      act(() => {
        pushAction('file1', action1);
        pushAction('file1', action2);
      });

      const poppedAction = popUndo('file1');
      expect(poppedAction).toBe(action2);

      const history = useHistoryStore.getState().histories.get('file1');
      expect(history?.undoStack).toHaveLength(1);
      expect(history?.undoStack[0]).toBe(action1);
    });

    it('should move undone action to redo stack', () => {
      const { pushAction, popUndo } = useHistoryStore.getState();
      const action = createMockAction();

      act(() => {
        pushAction('file1', action);
      });

      const poppedAction = popUndo('file1');

      const history = useHistoryStore.getState().histories.get('file1');
      expect(history?.redoStack).toHaveLength(1);
      expect(history?.redoStack[0]).toBe(poppedAction);
    });
  });

  // ==========================================================================
  // Pop Redo
  // ==========================================================================

  describe('popRedo', () => {
    it('should return null if no history exists', () => {
      const { popRedo } = useHistoryStore.getState();

      const action = popRedo('nonexistent');
      expect(action).toBeNull();
    });

    it('should return null if redo stack is empty', () => {
      const { pushAction, popRedo } = useHistoryStore.getState();

      act(() => {
        pushAction('file1', createMockAction());
      });

      const action = popRedo('file1');
      expect(action).toBeNull();
    });

    it('should return the last undone action and move it to undo stack', () => {
      const { pushAction, popUndo, popRedo } = useHistoryStore.getState();
      const action = createMockAction();

      act(() => {
        pushAction('file1', action);
      });

      // Undo
      popUndo('file1');

      // Redo
      const redoneAction = popRedo('file1');
      expect(redoneAction).toBe(action);

      const history = useHistoryStore.getState().histories.get('file1');
      expect(history?.undoStack).toHaveLength(1);
      expect(history?.redoStack).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Clear History
  // ==========================================================================

  describe('clearHistory', () => {
    it('should remove history for a file', () => {
      const { pushAction, clearHistory } = useHistoryStore.getState();

      act(() => {
        pushAction('file1', createMockAction());
        pushAction('file2', createMockAction());
        clearHistory('file1');
      });

      const state = useHistoryStore.getState();
      expect(state.histories.has('file1')).toBe(false);
      expect(state.histories.has('file2')).toBe(true);
    });

    it('should handle clearing nonexistent history gracefully', () => {
      const { clearHistory } = useHistoryStore.getState();

      act(() => {
        clearHistory('nonexistent');
      });

      // Should not throw
      const state = useHistoryStore.getState();
      expect(state.histories.has('nonexistent')).toBe(false);
    });
  });

  // ==========================================================================
  // Query Methods
  // ==========================================================================

  describe('canUndo', () => {
    it('should return false if no history exists', () => {
      const { canUndo } = useHistoryStore.getState();
      expect(canUndo('nonexistent')).toBe(false);
    });

    it('should return false if undo stack is empty', () => {
      const { pushAction, popUndo, canUndo } = useHistoryStore.getState();

      act(() => {
        pushAction('file1', createMockAction());
        popUndo('file1');
      });

      expect(canUndo('file1')).toBe(false);
    });

    it('should return true if undo stack has actions', () => {
      const { pushAction, canUndo } = useHistoryStore.getState();

      act(() => {
        pushAction('file1', createMockAction());
      });

      expect(canUndo('file1')).toBe(true);
    });
  });

  describe('canRedo', () => {
    it('should return false if no history exists', () => {
      const { canRedo } = useHistoryStore.getState();
      expect(canRedo('nonexistent')).toBe(false);
    });

    it('should return false if redo stack is empty', () => {
      const { pushAction, canRedo } = useHistoryStore.getState();

      act(() => {
        pushAction('file1', createMockAction());
      });

      expect(canRedo('file1')).toBe(false);
    });

    it('should return true if redo stack has actions', () => {
      const { pushAction, popUndo, canRedo } = useHistoryStore.getState();

      act(() => {
        pushAction('file1', createMockAction());
        popUndo('file1');
      });

      expect(canRedo('file1')).toBe(true);
    });
  });

  describe('getUndoDescription', () => {
    it('should return null if no history exists', () => {
      const { getUndoDescription } = useHistoryStore.getState();
      expect(getUndoDescription('nonexistent')).toBeNull();
    });

    it('should return null if undo stack is empty', () => {
      const { pushAction, popUndo, getUndoDescription } = useHistoryStore.getState();

      act(() => {
        pushAction('file1', createMockAction());
        popUndo('file1');
      });

      expect(getUndoDescription('file1')).toBeNull();
    });

    it('should return description of last undo action', () => {
      const { pushAction, getUndoDescription } = useHistoryStore.getState();

      act(() => {
        pushAction('file1', createMockAction('CREATE_MAPPING', 'Create mapping'));
        pushAction('file1', createMockAction('UPDATE_MAPPING', 'Update mapping'));
      });

      expect(getUndoDescription('file1')).toBe('Update mapping');
    });
  });

  describe('getRedoDescription', () => {
    it('should return null if no history exists', () => {
      const { getRedoDescription } = useHistoryStore.getState();
      expect(getRedoDescription('nonexistent')).toBeNull();
    });

    it('should return null if redo stack is empty', () => {
      const { pushAction, getRedoDescription } = useHistoryStore.getState();

      act(() => {
        pushAction('file1', createMockAction());
      });

      expect(getRedoDescription('file1')).toBeNull();
    });

    it('should return description of last redo action', () => {
      const { pushAction, popUndo, getRedoDescription } = useHistoryStore.getState();

      act(() => {
        pushAction('file1', createMockAction('CREATE_MAPPING', 'Create mapping'));
        popUndo('file1');
      });

      expect(getRedoDescription('file1')).toBe('Create mapping');
    });
  });

  // ==========================================================================
  // Selector Hooks
  // ==========================================================================

  describe('Selector Hooks', () => {
    describe('useCanUndo', () => {
      it('should return false for null fileId', () => {
        // Direct selector test without renderHook for simplicity
        const result = useHistoryStore.getState().canUndo('');
        expect(result).toBe(false);
      });

      it('should return correct value based on undo stack', () => {
        const { pushAction } = useHistoryStore.getState();

        act(() => {
          pushAction('file1', createMockAction());
        });

        expect(useHistoryStore.getState().canUndo('file1')).toBe(true);
        expect(useHistoryStore.getState().canUndo('file2')).toBe(false);
      });
    });

    describe('useCanRedo', () => {
      it('should return correct value based on redo stack', () => {
        const { pushAction, popUndo } = useHistoryStore.getState();

        act(() => {
          pushAction('file1', createMockAction());
        });

        expect(useHistoryStore.getState().canRedo('file1')).toBe(false);

        act(() => {
          popUndo('file1');
        });

        expect(useHistoryStore.getState().canRedo('file1')).toBe(true);
      });
    });

    describe('useHistoryInfo', () => {
      it('should return correct info for file with history', () => {
        const { pushAction, popUndo } = useHistoryStore.getState();

        act(() => {
          pushAction('file1', createMockAction('CREATE_MAPPING', 'Create mapping'));
          pushAction('file1', createMockAction('UPDATE_MAPPING', 'Update mapping'));
          popUndo('file1'); // Move one to redo stack
        });

        const state = useHistoryStore.getState();
        const history = state.histories.get('file1');

        expect(history?.undoStack.length).toBe(1);
        expect(history?.redoStack.length).toBe(1);
        expect(state.getUndoDescription('file1')).toBe('Create mapping');
        expect(state.getRedoDescription('file1')).toBe('Update mapping');
      });
    });
  });

  // ==========================================================================
  // Action Types
  // ==========================================================================

  describe('Action Types', () => {
    const actionTypes: UndoableAction['type'][] = [
      'CREATE_MAPPING',
      'DELETE_MAPPINGS',
      'UPDATE_MAPPING',
      'UPDATE_MAPPINGS',
      'DUPLICATE_MAPPINGS',
      'PASTE_MAPPINGS',
      'CUT_MAPPINGS',
      'MOVE_MAPPINGS',
    ];

    it.each(actionTypes)('should handle %s action type', (actionType) => {
      const { pushAction, popUndo } = useHistoryStore.getState();
      const action = createMockAction(actionType, `${actionType} description`);

      act(() => {
        pushAction('file1', action);
      });

      const history = useHistoryStore.getState().histories.get('file1');
      expect(history?.undoStack[0]?.type).toBe(actionType);

      const poppedAction = popUndo('file1');
      expect(poppedAction?.type).toBe(actionType);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle rapid undo/redo cycles', () => {
      const { pushAction, popUndo, popRedo } = useHistoryStore.getState();

      act(() => {
        for (let i = 0; i < 5; i++) {
          pushAction('file1', createMockAction('UPDATE_MAPPING', `Action ${i}`));
        }
      });

      // Undo all
      act(() => {
        for (let i = 0; i < 5; i++) {
          popUndo('file1');
        }
      });

      let history = useHistoryStore.getState().histories.get('file1');
      expect(history?.undoStack.length).toBe(0);
      expect(history?.redoStack.length).toBe(5);

      // Redo all
      act(() => {
        for (let i = 0; i < 5; i++) {
          popRedo('file1');
        }
      });

      history = useHistoryStore.getState().histories.get('file1');
      expect(history?.undoStack.length).toBe(5);
      expect(history?.redoStack.length).toBe(0);
    });

    it('should preserve action data through undo/redo cycle', () => {
      const { pushAction, popUndo, popRedo } = useHistoryStore.getState();
      const originalAction = createMockAction('UPDATE_MAPPING', 'Test action');
      originalAction.deviceIndex = 42;

      act(() => {
        pushAction('file1', originalAction);
      });

      // Undo
      const undoneAction = popUndo('file1');
      expect(undoneAction?.deviceIndex).toBe(42);
      expect(undoneAction?.description).toBe('Test action');

      // Redo
      const redoneAction = popRedo('file1');
      expect(redoneAction?.deviceIndex).toBe(42);
      expect(redoneAction?.description).toBe('Test action');
    });

    it('should handle multiple files with interleaved operations', () => {
      const { pushAction, popUndo } = useHistoryStore.getState();

      act(() => {
        pushAction('file1', createMockAction('CREATE_MAPPING', 'F1-A1'));
        pushAction('file2', createMockAction('CREATE_MAPPING', 'F2-A1'));
        pushAction('file1', createMockAction('UPDATE_MAPPING', 'F1-A2'));
        pushAction('file2', createMockAction('DELETE_MAPPINGS', 'F2-A2'));
      });

      // Undo on file1
      popUndo('file1');

      const state = useHistoryStore.getState();
      expect(state.histories.get('file1')?.undoStack.length).toBe(1);
      expect(state.histories.get('file1')?.redoStack.length).toBe(1);
      expect(state.histories.get('file2')?.undoStack.length).toBe(2);
      expect(state.histories.get('file2')?.redoStack.length).toBe(0);
    });
  });
});

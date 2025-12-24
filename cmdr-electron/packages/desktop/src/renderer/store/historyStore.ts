/**
 * History Store for Undo/Redo
 *
 * AIDEV-NOTE: Manages undo/redo history using Command pattern.
 * Each undoable action creates a snapshot of affected state before mutation.
 *
 * Key design decisions:
 * - Per-file history (each file has its own undo stack)
 * - Fixed history limit (50 actions) to prevent memory bloat
 * - Redo stack clears on new action (standard behavior)
 * - History cleared on file close
 *
 * AIDEV-NOTE: We store the full affected mapping data snapshots, not the entire state.
 * This is more memory efficient for large files.
 */

import type { MappingData } from "@cmdr/core";
import { create } from "zustand";

// ============================================================================
// Types
// ============================================================================

/**
 * Types of undoable actions
 */
export type UndoActionType =
	| "CREATE_MAPPING"
	| "DELETE_MAPPINGS"
	| "UPDATE_MAPPING"
	| "UPDATE_MAPPINGS"
	| "DUPLICATE_MAPPINGS"
	| "PASTE_MAPPINGS"
	| "CUT_MAPPINGS"
	| "MOVE_MAPPINGS";

/**
 * Snapshot of a mapping for undo/redo
 * AIDEV-NOTE: Using raw MappingData for easy serialization/deserialization
 */
export interface MappingSnapshot {
	/** The mapping's binding ID at time of snapshot */
	id: number;
	/** Index in the device's mapping array */
	index: number;
	/** Deep copy of raw data */
	data: MappingData;
}

/**
 * Represents an undoable action
 */
export interface UndoableAction {
	/** Type of action */
	type: UndoActionType;
	/** Human-readable description */
	description: string;
	/** Device index affected */
	deviceIndex: number;
	/** State before the action (for undo) */
	before: {
		mappings: MappingSnapshot[];
		/** For actions that change selection */
		selectedMappingIds?: number[];
	};
	/** State after the action (for redo) */
	after: {
		mappings: MappingSnapshot[];
		/** New mapping IDs created by action */
		createdIds?: number[];
		/** Mapping IDs deleted by action */
		deletedIds?: number[];
		selectedMappingIds?: number[];
	};
	/** Timestamp of action */
	timestamp: number;
}

/**
 * History for a single file
 */
export interface FileHistory {
	/** Stack of actions that can be undone */
	undoStack: UndoableAction[];
	/** Stack of actions that can be redone */
	redoStack: UndoableAction[];
}

interface HistoryState {
	/** History per file (keyed by file ID) */
	histories: Map<string, FileHistory>;

	/** Maximum history size per file */
	maxHistorySize: number;

	// Actions
	pushAction: (fileId: string, action: UndoableAction) => void;
	popUndo: (fileId: string) => UndoableAction | null;
	popRedo: (fileId: string) => UndoableAction | null;
	clearHistory: (fileId: string) => void;
	canUndo: (fileId: string) => boolean;
	canRedo: (fileId: string) => boolean;
	getUndoDescription: (fileId: string) => string | null;
	getRedoDescription: (fileId: string) => string | null;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_HISTORY_SIZE = 50;

// ============================================================================
// Helpers
// ============================================================================

function createEmptyHistory(): FileHistory {
	return {
		undoStack: [],
		redoStack: [],
	};
}

function getOrCreateHistory(
	histories: Map<string, FileHistory>,
	fileId: string,
): FileHistory {
	let history = histories.get(fileId);
	if (!history) {
		history = createEmptyHistory();
		histories.set(fileId, history);
	}
	return history;
}

// ============================================================================
// Store
// ============================================================================

export const useHistoryStore = create<HistoryState>()((set, get) => ({
	histories: new Map(),
	maxHistorySize: DEFAULT_MAX_HISTORY_SIZE,

	/**
	 * Push a new undoable action onto the history
	 * Clears redo stack (standard behavior)
	 */
	pushAction: (fileId, action) => {
		set((state) => {
			const newHistories = new Map(state.histories);
			const history = getOrCreateHistory(newHistories, fileId);

			// Add to undo stack
			const newUndoStack = [...history.undoStack, action];

			// Trim if exceeds max size
			if (newUndoStack.length > state.maxHistorySize) {
				newUndoStack.shift();
			}

			// Clear redo stack on new action
			newHistories.set(fileId, {
				undoStack: newUndoStack,
				redoStack: [],
			});

			return { histories: newHistories };
		});
	},

	/**
	 * Pop an action from the undo stack
	 * Returns the action to be undone (or null if stack is empty)
	 * Moves the action to the redo stack
	 */
	popUndo: (fileId) => {
		const state = get();
		const history = state.histories.get(fileId);
		if (!history || history.undoStack.length === 0) return null;

		const action = history.undoStack[history.undoStack.length - 1];
		if (!action) return null;

		set((currentState) => {
			const newHistories = new Map(currentState.histories);
			const currentHistory = newHistories.get(fileId);
			if (!currentHistory) return currentState;

			newHistories.set(fileId, {
				undoStack: currentHistory.undoStack.slice(0, -1),
				redoStack: [...currentHistory.redoStack, action],
			});

			return { histories: newHistories };
		});

		return action;
	},

	/**
	 * Pop an action from the redo stack
	 * Returns the action to be redone (or null if stack is empty)
	 * Moves the action to the undo stack
	 */
	popRedo: (fileId) => {
		const state = get();
		const history = state.histories.get(fileId);
		if (!history || history.redoStack.length === 0) return null;

		const action = history.redoStack[history.redoStack.length - 1];
		if (!action) return null;

		set((currentState) => {
			const newHistories = new Map(currentState.histories);
			const currentHistory = newHistories.get(fileId);
			if (!currentHistory) return currentState;

			newHistories.set(fileId, {
				undoStack: [...currentHistory.undoStack, action],
				redoStack: currentHistory.redoStack.slice(0, -1),
			});

			return { histories: newHistories };
		});

		return action;
	},

	/**
	 * Clear all history for a file (called on file close)
	 */
	clearHistory: (fileId) => {
		set((state) => {
			const newHistories = new Map(state.histories);
			newHistories.delete(fileId);
			return { histories: newHistories };
		});
	},

	/**
	 * Check if undo is available
	 */
	canUndo: (fileId) => {
		const history = get().histories.get(fileId);
		return history !== undefined && history.undoStack.length > 0;
	},

	/**
	 * Check if redo is available
	 */
	canRedo: (fileId) => {
		const history = get().histories.get(fileId);
		return history !== undefined && history.redoStack.length > 0;
	},

	/**
	 * Get description of next undo action
	 */
	getUndoDescription: (fileId) => {
		const history = get().histories.get(fileId);
		if (!history || history.undoStack.length === 0) return null;
		const action = history.undoStack[history.undoStack.length - 1];
		return action?.description ?? null;
	},

	/**
	 * Get description of next redo action
	 */
	getRedoDescription: (fileId) => {
		const history = get().histories.get(fileId);
		if (!history || history.redoStack.length === 0) return null;
		const action = history.redoStack[history.redoStack.length - 1];
		return action?.description ?? null;
	},
}));

// ============================================================================
// Selector hooks
// ============================================================================

/**
 * Hook to check if undo is available for a file
 */
export function useCanUndo(fileId: string | null): boolean {
	return useHistoryStore((state) => {
		if (!fileId) return false;
		const history = state.histories.get(fileId);
		return history !== undefined && history.undoStack.length > 0;
	});
}

/**
 * Hook to check if redo is available for a file
 */
export function useCanRedo(fileId: string | null): boolean {
	return useHistoryStore((state) => {
		if (!fileId) return false;
		const history = state.histories.get(fileId);
		return history !== undefined && history.redoStack.length > 0;
	});
}

/**
 * Hook to get undo/redo descriptions
 */
export function useHistoryInfo(fileId: string | null): {
	canUndo: boolean;
	canRedo: boolean;
	undoDescription: string | null;
	redoDescription: string | null;
	undoCount: number;
	redoCount: number;
} {
	return useHistoryStore((state) => {
		if (!fileId) {
			return {
				canUndo: false,
				canRedo: false,
				undoDescription: null,
				redoDescription: null,
				undoCount: 0,
				redoCount: 0,
			};
		}
		const history = state.histories.get(fileId);
		if (!history) {
			return {
				canUndo: false,
				canRedo: false,
				undoDescription: null,
				redoDescription: null,
				undoCount: 0,
				redoCount: 0,
			};
		}
		return {
			canUndo: history.undoStack.length > 0,
			canRedo: history.redoStack.length > 0,
			undoDescription:
				history.undoStack.length > 0
					? (history.undoStack[history.undoStack.length - 1]?.description ??
						null)
					: null,
			redoDescription:
				history.redoStack.length > 0
					? (history.redoStack[history.redoStack.length - 1]?.description ??
						null)
					: null,
			undoCount: history.undoStack.length,
			redoCount: history.redoStack.length,
		};
	});
}

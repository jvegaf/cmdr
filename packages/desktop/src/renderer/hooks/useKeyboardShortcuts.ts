/**
 * Keyboard Shortcuts Hook
 *
 * AIDEV-NOTE: Provides global keyboard shortcuts for the editor.
 * Uses native keyboard events with modifier detection.
 *
 * Supported shortcuts (Phase 14):
 * - Ctrl+C: Copy selected mappings
 * - Ctrl+X: Cut selected mappings
 * - Ctrl+V: Paste mappings
 * - Ctrl+D: Duplicate selected mappings
 * - Delete/Backspace: Delete selected mappings
 * - Ctrl+A: Select all mappings
 * - Escape: Clear selection
 *
 * Phase 14.5 additions:
 * - Ctrl+Z: Undo
 * - Ctrl+Y / Ctrl+Shift+Z: Redo
 *
 * Phase 15 additions:
 * - Ctrl+F: Focus search input
 */

import { useCallback, useEffect, useRef } from "react";
import { useHistoryStore } from "../store/historyStore";
import { useActiveFile, useTsiStore } from "../store/tsiStore";

export interface KeyboardShortcutHandlers {
	onCopy?: () => void;
	onCut?: () => void;
	onPaste?: () => void;
	onDuplicate?: () => void;
	onDelete?: () => void;
	onSelectAll?: () => void;
	onEscape?: () => void;
	onSave?: () => void;
	onSaveAs?: () => void;
	onOpen?: () => void;
	onNew?: () => void;
	onUndo?: () => void;
	onRedo?: () => void;
	onSearch?: () => void;
}

/**
 * Hook to handle keyboard shortcuts
 *
 * @param handlers Custom handlers for specific shortcuts (override default behavior)
 * @param enabled Whether shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(
	handlers: KeyboardShortcutHandlers = {},
	enabled = true,
): void {
	const activeFile = useActiveFile();
	const handlersRef = useRef(handlers);

	// Update handlers ref on each render to avoid stale closures
	handlersRef.current = handlers;

	const {
		copyMappings,
		cutMappings,
		pasteMappings,
		duplicateMappings,
		deleteMappings,
		selectMappings,
		clearMappingSelection,
		canPaste,
		undo,
		redo,
	} = useTsiStore();

	const { canUndo, canRedo } = useHistoryStore();

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (!enabled) return;

			// Skip if user is typing in an input/textarea
			const target = event.target as HTMLElement;
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable
			) {
				// Only allow Escape in inputs
				if (event.key !== "Escape") return;
			}

			const isCtrlOrMeta = event.ctrlKey || event.metaKey;
			const isShift = event.shiftKey;

			// ====================================================================
			// File Operations
			// ====================================================================

			// Ctrl+N: New file
			if (isCtrlOrMeta && event.key === "n") {
				event.preventDefault();
				handlersRef.current.onNew?.();
				return;
			}

			// Ctrl+O: Open file
			if (isCtrlOrMeta && event.key === "o") {
				event.preventDefault();
				handlersRef.current.onOpen?.();
				return;
			}

			// Ctrl+S: Save (Shift for Save As)
			if (isCtrlOrMeta && event.key === "s") {
				event.preventDefault();
				if (isShift) {
					handlersRef.current.onSaveAs?.();
				} else {
					handlersRef.current.onSave?.();
				}
				return;
			}

			// ====================================================================
			// Undo/Redo (Phase 14.5)
			// ====================================================================

			// Ctrl+Z: Undo
			if (isCtrlOrMeta && event.key === "z" && !isShift) {
				event.preventDefault();
				if (handlersRef.current.onUndo) {
					handlersRef.current.onUndo();
				} else if (activeFile && canUndo(activeFile.id)) {
					undo(activeFile.id);
				}
				return;
			}

			// Ctrl+Y or Ctrl+Shift+Z: Redo
			if (
				isCtrlOrMeta &&
				(event.key === "y" || (event.key === "z" && isShift))
			) {
				event.preventDefault();
				if (handlersRef.current.onRedo) {
					handlersRef.current.onRedo();
				} else if (activeFile && canRedo(activeFile.id)) {
					redo(activeFile.id);
				}
				return;
			}

			// ====================================================================
			// Search (Phase 15)
			// ====================================================================

			// Ctrl+F: Focus search input
			if (isCtrlOrMeta && event.key === "f") {
				event.preventDefault();
				handlersRef.current.onSearch?.();
				return;
			}

			// ====================================================================
			// Mapping Operations (require active file with device)
			// ====================================================================

			if (!activeFile || activeFile.selectedDeviceIndex === null) {
				return;
			}

			const fileId = activeFile.id;
			const device = activeFile.devices[activeFile.selectedDeviceIndex];
			if (!device) return;

			// Ctrl+C: Copy
			if (isCtrlOrMeta && event.key === "c") {
				event.preventDefault();
				if (handlersRef.current.onCopy) {
					handlersRef.current.onCopy();
				} else if (activeFile.selectedMappingIds.size > 0) {
					copyMappings(fileId);
				}
				return;
			}

			// Ctrl+X: Cut
			if (isCtrlOrMeta && event.key === "x") {
				event.preventDefault();
				if (handlersRef.current.onCut) {
					handlersRef.current.onCut();
				} else if (activeFile.selectedMappingIds.size > 0) {
					cutMappings(fileId);
				}
				return;
			}

			// Ctrl+V: Paste
			if (isCtrlOrMeta && event.key === "v") {
				event.preventDefault();
				if (handlersRef.current.onPaste) {
					handlersRef.current.onPaste();
				} else if (canPaste()) {
					pasteMappings(fileId);
				}
				return;
			}

			// Ctrl+D: Duplicate
			if (isCtrlOrMeta && event.key === "d") {
				event.preventDefault();
				if (handlersRef.current.onDuplicate) {
					handlersRef.current.onDuplicate();
				} else if (activeFile.selectedMappingIds.size > 0) {
					duplicateMappings(fileId);
				}
				return;
			}

			// Delete or Backspace: Delete selected mappings
			if (event.key === "Delete" || event.key === "Backspace") {
				// Don't interfere with text editing
				if (
					target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.isContentEditable
				) {
					return;
				}
				event.preventDefault();
				if (handlersRef.current.onDelete) {
					handlersRef.current.onDelete();
				} else if (activeFile.selectedMappingIds.size > 0) {
					deleteMappings(fileId);
				}
				return;
			}

			// Ctrl+A: Select all mappings
			if (isCtrlOrMeta && event.key === "a") {
				event.preventDefault();
				if (handlersRef.current.onSelectAll) {
					handlersRef.current.onSelectAll();
				} else {
					const allIds = device.mappings.map((m) => m.id);
					selectMappings(fileId, allIds);
				}
				return;
			}

			// Escape: Clear selection
			if (event.key === "Escape") {
				event.preventDefault();
				if (handlersRef.current.onEscape) {
					handlersRef.current.onEscape();
				} else {
					clearMappingSelection(fileId);
				}
				return;
			}
		},
		[
			enabled,
			activeFile,
			copyMappings,
			cutMappings,
			pasteMappings,
			duplicateMappings,
			deleteMappings,
			selectMappings,
			clearMappingSelection,
			canPaste,
			undo,
			redo,
			canUndo,
			canRedo,
		],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleKeyDown]);
}

/**
 * Get display string for a keyboard shortcut
 * Handles Mac vs Windows/Linux differences
 */
export function getShortcutDisplay(
	key: string,
	modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {},
): string {
	const isMac =
		typeof navigator !== "undefined" &&
		navigator.platform.toUpperCase().indexOf("MAC") >= 0;

	const parts: string[] = [];

	if (modifiers.ctrl) {
		parts.push(isMac ? "⌘" : "Ctrl");
	}
	if (modifiers.alt) {
		parts.push(isMac ? "⌥" : "Alt");
	}
	if (modifiers.shift) {
		parts.push(isMac ? "⇧" : "Shift");
	}

	// Format key
	const formattedKey = key.length === 1 ? key.toUpperCase() : key;
	parts.push(formattedKey);

	return parts.join(isMac ? "" : "+");
}

/**
 * Common shortcut display strings
 */
export const SHORTCUTS = {
	copy: getShortcutDisplay("c", { ctrl: true }),
	cut: getShortcutDisplay("x", { ctrl: true }),
	paste: getShortcutDisplay("v", { ctrl: true }),
	duplicate: getShortcutDisplay("d", { ctrl: true }),
	delete: "Delete",
	selectAll: getShortcutDisplay("a", { ctrl: true }),
	save: getShortcutDisplay("s", { ctrl: true }),
	saveAs: getShortcutDisplay("s", { ctrl: true, shift: true }),
	open: getShortcutDisplay("o", { ctrl: true }),
	new: getShortcutDisplay("n", { ctrl: true }),
	undo: getShortcutDisplay("z", { ctrl: true }),
	redo: getShortcutDisplay("y", { ctrl: true }),
	search: getShortcutDisplay("f", { ctrl: true }),
} as const;

/**
 * Menu Actions Hook
 *
 * AIDEV-NOTE: React hook for handling application menu actions.
 * Subscribes to IPC events from the main process menu and dispatches
 * them to the appropriate handlers.
 *
 * Phase 18: Application Menu integration.
 */

import { useEffect } from "react";

import {
	type MenuActionPayload,
	subscribeToMenuActions,
} from "../lib/ipc-client";

// ============================================================================
// Types
// ============================================================================

export interface MenuActionHandlers {
	// File menu
	onNew?: () => void;
	onOpen?: () => void;
	onSave?: () => void;
	onSaveAs?: () => void;
	onClose?: () => void;
	onExportCsv?: () => void;
	onSettings?: () => void;

	// Edit menu
	onUndo?: () => void;
	onRedo?: () => void;
	onCut?: () => void;
	onCopy?: () => void;
	onPaste?: () => void;
	onDuplicate?: () => void;
	onDelete?: () => void;
	onSelectAll?: () => void;

	// View menu
	onTheme?: (theme: "light" | "dark" | "system") => void;
	onShowCommandsReport?: () => void;
	onShowConditionsSummary?: () => void;

	// Help menu
	onShortcuts?: () => void;
	onAbout?: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to handle application menu actions
 *
 * @example
 * ```tsx
 * useMenuActions({
 *   onNew: handleNewFile,
 *   onOpen: handleOpenFile,
 *   onSave: handleSaveFile,
 *   // ...
 * });
 * ```
 */
export function useMenuActions(handlers: MenuActionHandlers): void {
	useEffect(() => {
		const handleMenuAction = (payload: MenuActionPayload) => {
			const { action, payload: data } = payload;

			switch (action) {
				// File menu
				case "new":
					handlers.onNew?.();
					break;
				case "open":
					handlers.onOpen?.();
					break;
				case "save":
					handlers.onSave?.();
					break;
				case "saveAs":
					handlers.onSaveAs?.();
					break;
				case "close":
					handlers.onClose?.();
					break;
				case "exportCsv":
					handlers.onExportCsv?.();
					break;
				case "settings":
					handlers.onSettings?.();
					break;

				// Edit menu
				case "undo":
					handlers.onUndo?.();
					break;
				case "redo":
					handlers.onRedo?.();
					break;
				case "cut":
					handlers.onCut?.();
					break;
				case "copy":
					handlers.onCopy?.();
					break;
				case "paste":
					handlers.onPaste?.();
					break;
				case "duplicate":
					handlers.onDuplicate?.();
					break;
				case "delete":
					handlers.onDelete?.();
					break;
				case "selectAll":
					handlers.onSelectAll?.();
					break;

				// View menu
				case "theme":
					if (
						data === "light" ||
						data === "dark" ||
						data === "system"
					) {
						handlers.onTheme?.(data);
					}
					break;
				case "showCommandsReport":
					handlers.onShowCommandsReport?.();
					break;
				case "showConditionsSummary":
					handlers.onShowConditionsSummary?.();
					break;

				// Help menu
				case "shortcuts":
					handlers.onShortcuts?.();
					break;
				case "about":
					handlers.onAbout?.();
					break;

				default:
					console.warn(`Unknown menu action: ${action}`);
			}
		};

		// Subscribe to menu actions
		const unsubscribe = subscribeToMenuActions(handleMenuAction);

		// Cleanup on unmount
		return unsubscribe;
	}, [handlers]);
}

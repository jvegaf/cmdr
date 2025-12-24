/**
 * Application State Store (Zustand)
 *
 * AIDEV-NOTE: Global application state using Zustand.
 * Manages recent files and general app settings.
 *
 * Recent files are persisted to localStorage for simplicity.
 * TODO: Consider migrating to electron-store via IPC for cross-platform reliability.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================================
// Types
// ============================================================================

export interface RecentFile {
	/** Full file path */
	path: string;
	/** Display name (filename without path) */
	name: string;
	/** Last opened timestamp */
	lastOpened: number;
}

interface AppState {
	// Recent files
	recentFiles: RecentFile[];
	maxRecentFiles: number;
	addRecentFile: (filePath: string) => void;
	removeRecentFile: (filePath: string) => void;
	clearRecentFiles: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function getFileName(filePath: string): string {
	const parts = filePath.split(/[/\\]/);
	return parts[parts.length - 1] ?? "Untitled";
}

// ============================================================================
// Store
// ============================================================================

export const useAppStore = create<AppState>()(
	persist(
		(set, _get) => ({
			// Recent files state
			recentFiles: [],
			maxRecentFiles: 10,

			addRecentFile: (filePath: string) => {
				if (!filePath) return;

				set((state) => {
					// Remove existing entry for this path (if any)
					const filtered = state.recentFiles.filter(
						(f) => f.path !== filePath,
					);

					// Add new entry at the beginning
					const newEntry: RecentFile = {
						path: filePath,
						name: getFileName(filePath),
						lastOpened: Date.now(),
					};

					// Keep only maxRecentFiles
					const updated = [newEntry, ...filtered].slice(
						0,
						state.maxRecentFiles,
					);

					return { recentFiles: updated };
				});
			},

			removeRecentFile: (filePath: string) => {
				set((state) => ({
					recentFiles: state.recentFiles.filter((f) => f.path !== filePath),
				}));
			},

			clearRecentFiles: () => {
				set({ recentFiles: [] });
			},
		}),
		{
			name: "cmdr-app-storage",
			partialize: (state) => ({
				recentFiles: state.recentFiles,
			}),
		},
	),
);

// ============================================================================
// Selector hooks
// ============================================================================

/**
 * Hook to get recent files
 */
export function useRecentFiles(): RecentFile[] {
	return useAppStore((state) => state.recentFiles);
}

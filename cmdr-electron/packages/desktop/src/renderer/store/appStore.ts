/**
 * Application State Store (Zustand)
 *
 * AIDEV-NOTE: Global application state using Zustand.
 * Manages recent files, app settings, and user preferences.
 *
 * Data is persisted to localStorage for simplicity.
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

/**
 * Application settings
 */
export interface AppSettings {
	/** General settings */
	general: {
		/** Show welcome screen on startup */
		showWelcome: boolean;
		/** Confirm before deleting mappings */
		confirmDelete: boolean;
		/** Auto-save interval in minutes (0 = disabled) */
		autoSaveInterval: number;
	};
	/** Editor settings */
	editor: {
		/** Default view mode for mappings */
		defaultViewMode: "table" | "grid";
		/** Show MIDI binding column */
		showMidiColumn: boolean;
		/** Show conditions column */
		showConditionsColumn: boolean;
		/** Show comment column */
		showCommentColumn: boolean;
	};
	/** MIDI settings */
	midi: {
		/** Enable MIDI on startup */
		enableOnStartup: boolean;
		/** Default input device name */
		defaultInputDevice: string;
		/** Default output device name */
		defaultOutputDevice: string;
		/** MIDI Learn timeout in seconds */
		learnTimeout: number;
	};
}

/** Default settings values */
const DEFAULT_SETTINGS: AppSettings = {
	general: {
		showWelcome: true,
		confirmDelete: false,
		autoSaveInterval: 0,
	},
	editor: {
		defaultViewMode: "table",
		showMidiColumn: true,
		showConditionsColumn: true,
		showCommentColumn: true,
	},
	midi: {
		enableOnStartup: true,
		defaultInputDevice: "",
		defaultOutputDevice: "",
		learnTimeout: 10,
	},
};

interface AppState {
	// Recent files
	recentFiles: RecentFile[];
	maxRecentFiles: number;
	addRecentFile: (filePath: string) => void;
	removeRecentFile: (filePath: string) => void;
	clearRecentFiles: () => void;

	// Settings
	settings: AppSettings;
	updateSettings: (updates: Partial<AppSettings>) => void;
	updateGeneralSettings: (updates: Partial<AppSettings["general"]>) => void;
	updateEditorSettings: (updates: Partial<AppSettings["editor"]>) => void;
	updateMidiSettings: (updates: Partial<AppSettings["midi"]>) => void;
	resetSettings: () => void;
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

			// Settings state
			settings: DEFAULT_SETTINGS,

			updateSettings: (updates: Partial<AppSettings>) => {
				set((state) => ({
					settings: { ...state.settings, ...updates },
				}));
			},

			updateGeneralSettings: (updates: Partial<AppSettings["general"]>) => {
				set((state) => ({
					settings: {
						...state.settings,
						general: { ...state.settings.general, ...updates },
					},
				}));
			},

			updateEditorSettings: (updates: Partial<AppSettings["editor"]>) => {
				set((state) => ({
					settings: {
						...state.settings,
						editor: { ...state.settings.editor, ...updates },
					},
				}));
			},

			updateMidiSettings: (updates: Partial<AppSettings["midi"]>) => {
				set((state) => ({
					settings: {
						...state.settings,
						midi: { ...state.settings.midi, ...updates },
					},
				}));
			},

			resetSettings: () => {
				set({ settings: DEFAULT_SETTINGS });
			},
		}),
		{
			name: "cmdr-app-storage",
			partialize: (state) => ({
				recentFiles: state.recentFiles,
				settings: state.settings,
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

/**
 * Hook to get app settings
 */
export function useSettings(): AppSettings {
	return useAppStore((state) => state.settings);
}

/**
 * Hook to get general settings
 */
export function useGeneralSettings(): AppSettings["general"] {
	return useAppStore((state) => state.settings.general);
}

/**
 * Hook to get editor settings
 */
export function useEditorSettings(): AppSettings["editor"] {
	return useAppStore((state) => state.settings.editor);
}

/**
 * Hook to get MIDI settings
 */
export function useMidiSettings(): AppSettings["midi"] {
	return useAppStore((state) => state.settings.midi);
}

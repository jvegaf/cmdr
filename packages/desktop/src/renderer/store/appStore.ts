/**
 * Application State Store (Zustand)
 *
 * AIDEV-NOTE: Global application state using Zustand.
 * Manages recent files, app settings, and user preferences.
 *
 * Settings are organized to match the legacy cmdr application for feature parity.
 * See: legacy/cmdr/cmdr.Editor/AppSettings/CmdrSettings.cs
 *
 * Data is persisted to localStorage for simplicity.
 * TODO: Consider migrating to electron-store via IPC for cross-platform reliability.
 *
 * AIDEV-NOTE: The persist middleware uses a custom merge function to handle
 * schema migrations when new settings fields are added. This ensures old
 * persisted state is properly merged with new defaults.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
 * Column width configuration for MappingList
 * AIDEV-NOTE: Keys match column IDs in MappingList.tsx createColumns()
 */
export interface ColumnWidths {
  index: number;
  io: number;
  commandName: number;
  midi: number;
  conditions: number;
  comment: number;
}

/** Default column widths (in pixels) */
export const DEFAULT_COLUMN_WIDTHS: ColumnWidths = {
  index: 40,
  io: 40,
  commandName: 180,
  midi: 90,
  conditions: 220,
  comment: 120,
};

/**
 * Application settings - organized by category
 *
 * AIDEV-NOTE: Settings structure mirrors the legacy cmdr application.
 * Categories: paths, traktor, tsiOptimization, editor, confirmations, midi, advanced
 */
export interface AppSettings {
  /**
   * Path settings - file system locations
   */
  paths: {
    /** Default workspace directory for TSI files */
    defaultWorkspace: string;
    /** Path to Traktor's default controller mappings folder */
    pathToControllerDefaultMappings: string;
    /** Path to Traktor Settings.tsi file */
    pathToTraktorSettings: string;
  };

  /**
   * Traktor integration settings
   */
  traktor: {
    /** Traktor version string (written to TSI for compatibility) */
    traktorVersion: string;
    /** Whether to override auto-detected Traktor version */
    overrideTraktorVersion: boolean;
  };

  /**
   * TSI file optimization settings
   */
  tsiOptimization: {
    /** Remove unused MIDI definitions when loading (faster load, smaller save) */
    removeUnusedMidiDefinitions: boolean;
    /** Reduce FX list to only used FX when saving */
    optimizeFxList: boolean;
    /** Remove empty devices when saving */
    removeEmptyDevices: boolean;
  };

  /**
   * Editor display and behavior settings
   */
  editor: {
    /** Default view mode for mappings */
    defaultViewMode: 'table' | 'grid';
    /** Show MIDI binding column */
    showMidiColumn: boolean;
    /** Show conditions column */
    showConditionsColumn: boolean;
    /** Show comment column */
    showCommentColumn: boolean;
    /** Column widths for the mapping list table */
    columnWidths: ColumnWidths;
    /** Show decimal MIDI note values alongside note names (e.g., "C4 (60)") */
    showDecimalNotes: boolean;
    /** In MIDI value menus, show Notes before CCs */
    showNotesBeforeCc: boolean;
    /** Clear search/filter when changing device/page */
    clearFilterAtPageChanges: boolean;
    /** Clear search/filter when modifying mappings */
    clearFilterAtModifications: boolean;
    /** Maximum number of items in filter dropdown menus */
    filterMenuSize: number;
  };

  /**
   * Confirmation dialog settings
   */
  confirmations: {
    /** Confirm before deleting devices */
    confirmDeleteDevices: boolean;
    /** Minimum number of mappings to trigger delete confirmation (0 = always confirm) */
    confirmDeleteMappingsThreshold: number;
  };

  /**
   * MIDI device settings
   */
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

  /**
   * Advanced/debug settings
   */
  advanced: {
    /** Load last opened file at startup */
    loadLastFileAtStartup: boolean;
    /** Show verbose exception details on errors */
    verboseExceptions: boolean;
  };
}

/** Default settings values */
export const DEFAULT_SETTINGS: AppSettings = {
  paths: {
    defaultWorkspace: '',
    pathToControllerDefaultMappings: '',
    pathToTraktorSettings: '',
  },
  traktor: {
    traktorVersion: '3.11.0', // Fallback version
    overrideTraktorVersion: false,
  },
  tsiOptimization: {
    removeUnusedMidiDefinitions: true,
    optimizeFxList: false,
    removeEmptyDevices: false,
  },
  editor: {
    defaultViewMode: 'table',
    showMidiColumn: true,
    showConditionsColumn: true,
    showCommentColumn: true,
    columnWidths: DEFAULT_COLUMN_WIDTHS,
    showDecimalNotes: false,
    showNotesBeforeCc: false,
    clearFilterAtPageChanges: false,
    clearFilterAtModifications: false,
    filterMenuSize: 20,
  },
  confirmations: {
    confirmDeleteDevices: true,
    confirmDeleteMappingsThreshold: 20,
  },
  midi: {
    enableOnStartup: true,
    defaultInputDevice: '',
    defaultOutputDevice: '',
    learnTimeout: 10,
  },
  advanced: {
    loadLastFileAtStartup: false,
    verboseExceptions: false,
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
  updatePathsSettings: (updates: Partial<AppSettings['paths']>) => void;
  updateTraktorSettings: (updates: Partial<AppSettings['traktor']>) => void;
  updateTsiOptimizationSettings: (updates: Partial<AppSettings['tsiOptimization']>) => void;
  updateEditorSettings: (updates: Partial<AppSettings['editor']>) => void;
  updateConfirmationsSettings: (updates: Partial<AppSettings['confirmations']>) => void;
  updateMidiSettings: (updates: Partial<AppSettings['midi']>) => void;
  updateAdvancedSettings: (updates: Partial<AppSettings['advanced']>) => void;
  updateColumnWidths: (updates: Partial<ColumnWidths>) => void;
  resetSettings: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function getFileName(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] ?? 'Untitled';
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
          const filtered = state.recentFiles.filter((f) => f.path !== filePath);

          // Add new entry at the beginning
          const newEntry: RecentFile = {
            path: filePath,
            name: getFileName(filePath),
            lastOpened: Date.now(),
          };

          // Keep only maxRecentFiles
          const updated = [newEntry, ...filtered].slice(0, state.maxRecentFiles);

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

      updatePathsSettings: (updates: Partial<AppSettings['paths']>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            paths: { ...state.settings.paths, ...updates },
          },
        }));
      },

      updateTraktorSettings: (updates: Partial<AppSettings['traktor']>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            traktor: { ...state.settings.traktor, ...updates },
          },
        }));
      },

      updateTsiOptimizationSettings: (updates: Partial<AppSettings['tsiOptimization']>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            tsiOptimization: { ...state.settings.tsiOptimization, ...updates },
          },
        }));
      },

      updateEditorSettings: (updates: Partial<AppSettings['editor']>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            editor: { ...state.settings.editor, ...updates },
          },
        }));
      },

      updateConfirmationsSettings: (updates: Partial<AppSettings['confirmations']>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            confirmations: { ...state.settings.confirmations, ...updates },
          },
        }));
      },

      updateMidiSettings: (updates: Partial<AppSettings['midi']>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            midi: { ...state.settings.midi, ...updates },
          },
        }));
      },

      updateAdvancedSettings: (updates: Partial<AppSettings['advanced']>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            advanced: { ...state.settings.advanced, ...updates },
          },
        }));
      },

      updateColumnWidths: (updates: Partial<ColumnWidths>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            editor: {
              ...state.settings.editor,
              columnWidths: {
                ...state.settings.editor.columnWidths,
                ...updates,
              },
            },
          },
        }));
      },

      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
      },
    }),
    {
      name: 'cmdr-app-storage',
      partialize: (state) => ({
        recentFiles: state.recentFiles,
        settings: state.settings,
      }),
      // AIDEV-NOTE: Custom merge handles schema migrations when new fields are added.
      // Without this, persisted state missing new fields would cause undefined errors.
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState> | undefined;
        if (!persisted) {
          return currentState;
        }

        // Deep merge settings with defaults to handle new fields
        const mergedSettings: AppSettings = {
          paths: {
            ...DEFAULT_SETTINGS.paths,
            ...persisted.settings?.paths,
          },
          traktor: {
            ...DEFAULT_SETTINGS.traktor,
            ...persisted.settings?.traktor,
          },
          tsiOptimization: {
            ...DEFAULT_SETTINGS.tsiOptimization,
            ...persisted.settings?.tsiOptimization,
          },
          editor: {
            ...DEFAULT_SETTINGS.editor,
            ...persisted.settings?.editor,
            columnWidths: {
              ...DEFAULT_SETTINGS.editor.columnWidths,
              ...persisted.settings?.editor?.columnWidths,
            },
          },
          confirmations: {
            ...DEFAULT_SETTINGS.confirmations,
            ...persisted.settings?.confirmations,
          },
          midi: {
            ...DEFAULT_SETTINGS.midi,
            ...persisted.settings?.midi,
          },
          advanced: {
            ...DEFAULT_SETTINGS.advanced,
            ...persisted.settings?.advanced,
          },
        };

        return {
          ...currentState,
          recentFiles: persisted.recentFiles ?? currentState.recentFiles,
          settings: mergedSettings,
        };
      },
    }
  )
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
 * Hook to get paths settings
 */
export function usePathsSettings(): AppSettings['paths'] {
  return useAppStore((state) => state.settings.paths);
}

/**
 * Hook to get Traktor settings
 */
export function useTraktorSettings(): AppSettings['traktor'] {
  return useAppStore((state) => state.settings.traktor);
}

/**
 * Hook to get TSI optimization settings
 */
export function useTsiOptimizationSettings(): AppSettings['tsiOptimization'] {
  return useAppStore((state) => state.settings.tsiOptimization);
}

/**
 * Hook to get editor settings
 */
export function useEditorSettings(): AppSettings['editor'] {
  return useAppStore((state) => state.settings.editor);
}

/**
 * Hook to get confirmation settings
 */
export function useConfirmationsSettings(): AppSettings['confirmations'] {
  return useAppStore((state) => state.settings.confirmations);
}

/**
 * Hook to get MIDI settings
 */
export function useMidiSettings(): AppSettings['midi'] {
  return useAppStore((state) => state.settings.midi);
}

/**
 * Hook to get advanced settings
 */
export function useAdvancedSettings(): AppSettings['advanced'] {
  return useAppStore((state) => state.settings.advanced);
}

/**
 * Hook to get column widths for MappingList
 * AIDEV-NOTE: Returns DEFAULT_COLUMN_WIDTHS if store isn't hydrated yet
 */
export function useColumnWidths(): ColumnWidths {
  return useAppStore((state) => state.settings?.editor?.columnWidths ?? DEFAULT_COLUMN_WIDTHS);
}

/**
 * Hook to get updateColumnWidths function
 */
export function useUpdateColumnWidths(): (updates: Partial<ColumnWidths>) => void {
  return useAppStore((state) => state.updateColumnWidths);
}

// ============================================================================
// Non-hook getters (for use outside React components)
// ============================================================================

/**
 * Get MIDI settings without React hook (for use in stores)
 * AIDEV-NOTE: Use this when you need settings in Zustand stores or other non-React code
 */
export function getMidiSettings(): AppSettings['midi'] {
  return useAppStore.getState().settings.midi;
}

/**
 * Get editor settings without React hook (for use in stores)
 */
export function getEditorSettings(): AppSettings['editor'] {
  return useAppStore.getState().settings.editor;
}

/**
 * Get confirmations settings without React hook (for use in stores)
 */
export function getConfirmationsSettings(): AppSettings['confirmations'] {
  return useAppStore.getState().settings.confirmations;
}

/**
 * Get advanced settings without React hook (for use in stores)
 */
export function getAdvancedSettings(): AppSettings['advanced'] {
  return useAppStore.getState().settings.advanced;
}

/**
 * Get TSI optimization settings without React hook (for use in stores)
 */
export function getTsiOptimizationSettings(): AppSettings['tsiOptimization'] {
  return useAppStore.getState().settings.tsiOptimization;
}

/**
 * Get Traktor settings without React hook (for use in stores)
 */
export function getTraktorSettings(): AppSettings['traktor'] {
  return useAppStore.getState().settings.traktor;
}

/**
 * Get paths settings without React hook (for use in stores)
 */
export function getPathsSettings(): AppSettings['paths'] {
  return useAppStore.getState().settings.paths;
}

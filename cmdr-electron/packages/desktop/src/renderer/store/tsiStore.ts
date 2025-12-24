/**
 * TSI File Store (Zustand)
 *
 * AIDEV-NOTE: Manages state for open TSI files, device selection, and mapping selection.
 * This is the main data store for the editor.
 *
 * Key concepts:
 * - Multiple files can be open at once (tabs)
 * - One file is active at a time
 * - Within a file, one device can be selected
 * - Within a device, multiple mappings can be selected
 *
 * IMPORTANT: We store high-level Device models (not raw DeviceData) for easier UI access.
 * The original TsiFile is also kept for serialization.
 */

import { Device, type Mapping, type TsiFile } from '@cmdr/core';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

/**
 * Represents an open TSI file with its associated state
 */
export interface OpenFile {
  /** Unique identifier for this open file instance */
  id: string;
  /** File path on disk (null if new/unsaved) */
  filePath: string | null;
  /** Display name for tabs */
  displayName: string;
  /** The original parsed TSI file (for serialization) */
  tsiFile: TsiFile;
  /** High-level Device models wrapping raw data */
  devices: Device[];
  /** Whether the file has unsaved changes */
  isDirty: boolean;
  /** Currently selected device index (null if none) */
  selectedDeviceIndex: number | null;
  /** Currently selected mapping IDs within the selected device */
  selectedMappingIds: Set<number>;
}

interface TsiState {
  // Open files
  openFiles: Map<string, OpenFile>;
  activeFileId: string | null;

  // Actions - File operations
  openFile: (filePath: string, tsiFile: TsiFile) => string;
  createNewFile: (tsiFile: TsiFile) => string;
  closeFile: (fileId: string) => void;
  setActiveFile: (fileId: string) => void;
  markDirty: (fileId: string) => void;
  markClean: (fileId: string) => void;
  updateFilePath: (fileId: string, filePath: string) => void;
  updateTsiFile: (fileId: string, tsiFile: TsiFile) => void;

  // Actions - Selection
  selectDevice: (fileId: string, deviceIndex: number | null) => void;
  selectMapping: (fileId: string, mappingId: number, exclusive?: boolean) => void;
  selectMappings: (fileId: string, mappingIds: number[]) => void;
  toggleMappingSelection: (fileId: string, mappingId: number) => void;
  selectMappingRange: (fileId: string, fromId: number, toId: number) => void;
  clearMappingSelection: (fileId: string) => void;

  // Getters (computed from state)
  getActiveFile: () => OpenFile | null;
  getFile: (fileId: string) => OpenFile | null;
  getSelectedDevice: (fileId: string) => Device | null;
  getSelectedMappings: (fileId: string) => Mapping[];
}

// ============================================================================
// Helpers
// ============================================================================

let fileIdCounter = 0;

function generateFileId(): string {
  return `file-${++fileIdCounter}-${Date.now()}`;
}

function getDisplayName(filePath: string | null): string {
  if (!filePath) return 'Untitled';
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] ?? 'Untitled';
}

/**
 * Convert TsiFile to Device[] models
 */
function createDeviceModels(tsiFile: TsiFile): Device[] {
  return tsiFile.devices.map((deviceData) => Device.fromRawData(deviceData));
}

// ============================================================================
// Store
// ============================================================================

export const useTsiStore = create<TsiState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    openFiles: new Map(),
    activeFileId: null,

    // ========================================================================
    // File Operations
    // ========================================================================

    openFile: (filePath, tsiFile) => {
      const id = generateFileId();
      const devices = createDeviceModels(tsiFile);

      const openFile: OpenFile = {
        id,
        filePath,
        displayName: getDisplayName(filePath),
        tsiFile,
        devices,
        isDirty: false,
        selectedDeviceIndex: devices.length > 0 ? 0 : null,
        selectedMappingIds: new Set(),
      };

      set((state) => {
        const newFiles = new Map(state.openFiles);
        newFiles.set(id, openFile);
        return { openFiles: newFiles, activeFileId: id };
      });

      return id;
    },

    createNewFile: (tsiFile) => {
      return get().openFile('', tsiFile);
    },

    closeFile: (fileId) => {
      set((state) => {
        const newFiles = new Map(state.openFiles);
        newFiles.delete(fileId);

        // Update active file if we closed the active one
        let newActiveId = state.activeFileId;
        if (state.activeFileId === fileId) {
          const remaining = Array.from(newFiles.keys());
          newActiveId = remaining.length > 0 ? remaining[remaining.length - 1] ?? null : null;
        }

        return { openFiles: newFiles, activeFileId: newActiveId };
      });
    },

    setActiveFile: (fileId) => {
      if (get().openFiles.has(fileId)) {
        set({ activeFileId: fileId });
      }
    },

    markDirty: (fileId) => {
      set((state) => {
        const file = state.openFiles.get(fileId);
        if (!file) return state;

        const newFiles = new Map(state.openFiles);
        newFiles.set(fileId, { ...file, isDirty: true });
        return { openFiles: newFiles };
      });
    },

    markClean: (fileId) => {
      set((state) => {
        const file = state.openFiles.get(fileId);
        if (!file) return state;

        const newFiles = new Map(state.openFiles);
        newFiles.set(fileId, { ...file, isDirty: false });
        return { openFiles: newFiles };
      });
    },

    updateFilePath: (fileId, filePath) => {
      set((state) => {
        const file = state.openFiles.get(fileId);
        if (!file) return state;

        const newFiles = new Map(state.openFiles);
        newFiles.set(fileId, {
          ...file,
          filePath,
          displayName: getDisplayName(filePath),
        });
        return { openFiles: newFiles };
      });
    },

    updateTsiFile: (fileId, tsiFile) => {
      set((state) => {
        const file = state.openFiles.get(fileId);
        if (!file) return state;

        const devices = createDeviceModels(tsiFile);
        const newFiles = new Map(state.openFiles);
        newFiles.set(fileId, { ...file, tsiFile, devices });
        return { openFiles: newFiles };
      });
    },

    // ========================================================================
    // Selection
    // ========================================================================

    selectDevice: (fileId, deviceIndex) => {
      set((state) => {
        const file = state.openFiles.get(fileId);
        if (!file) return state;

        const newFiles = new Map(state.openFiles);
        newFiles.set(fileId, {
          ...file,
          selectedDeviceIndex: deviceIndex,
          selectedMappingIds: new Set(), // Clear mapping selection when changing device
        });
        return { openFiles: newFiles };
      });
    },

    selectMapping: (fileId, mappingId, exclusive = true) => {
      set((state) => {
        const file = state.openFiles.get(fileId);
        if (!file) return state;

        const newFiles = new Map(state.openFiles);
        const newSelection = exclusive ? new Set<number>() : new Set(file.selectedMappingIds);
        newSelection.add(mappingId);

        newFiles.set(fileId, { ...file, selectedMappingIds: newSelection });
        return { openFiles: newFiles };
      });
    },

    selectMappings: (fileId, mappingIds) => {
      set((state) => {
        const file = state.openFiles.get(fileId);
        if (!file) return state;

        const newFiles = new Map(state.openFiles);
        newFiles.set(fileId, {
          ...file,
          selectedMappingIds: new Set(mappingIds),
        });
        return { openFiles: newFiles };
      });
    },

    toggleMappingSelection: (fileId, mappingId) => {
      set((state) => {
        const file = state.openFiles.get(fileId);
        if (!file) return state;

        const newFiles = new Map(state.openFiles);
        const newSelection = new Set(file.selectedMappingIds);

        if (newSelection.has(mappingId)) {
          newSelection.delete(mappingId);
        } else {
          newSelection.add(mappingId);
        }

        newFiles.set(fileId, { ...file, selectedMappingIds: newSelection });
        return { openFiles: newFiles };
      });
    },

    selectMappingRange: (fileId, fromId, toId) => {
      set((state) => {
        const file = state.openFiles.get(fileId);
        if (!file || file.selectedDeviceIndex === null) return state;

        const device = file.devices[file.selectedDeviceIndex];
        if (!device) return state;

        // Find indices of the range bounds
        const mappings = device.mappings;
        let fromIndex = -1;
        let toIndex = -1;

        for (let i = 0; i < mappings.length; i++) {
          const m = mappings[i];
          if (m && m.id === fromId) fromIndex = i;
          if (m && m.id === toId) toIndex = i;
        }

        if (fromIndex === -1 || toIndex === -1) return state;

        // Select all mappings in range
        const start = Math.min(fromIndex, toIndex);
        const end = Math.max(fromIndex, toIndex);
        const newSelection = new Set<number>();

        for (let i = start; i <= end; i++) {
          const m = mappings[i];
          if (m) newSelection.add(m.id);
        }

        const newFiles = new Map(state.openFiles);
        newFiles.set(fileId, { ...file, selectedMappingIds: newSelection });
        return { openFiles: newFiles };
      });
    },

    clearMappingSelection: (fileId) => {
      set((state) => {
        const file = state.openFiles.get(fileId);
        if (!file) return state;

        const newFiles = new Map(state.openFiles);
        newFiles.set(fileId, { ...file, selectedMappingIds: new Set() });
        return { openFiles: newFiles };
      });
    },

    // ========================================================================
    // Getters
    // ========================================================================

    getActiveFile: () => {
      const state = get();
      if (!state.activeFileId) return null;
      return state.openFiles.get(state.activeFileId) ?? null;
    },

    getFile: (fileId) => {
      return get().openFiles.get(fileId) ?? null;
    },

    getSelectedDevice: (fileId) => {
      const file = get().openFiles.get(fileId);
      if (!file || file.selectedDeviceIndex === null) return null;
      return file.devices[file.selectedDeviceIndex] ?? null;
    },

    getSelectedMappings: (fileId) => {
      const file = get().openFiles.get(fileId);
      if (!file || file.selectedDeviceIndex === null) return [];

      const device = file.devices[file.selectedDeviceIndex];
      if (!device) return [];

      return device.mappings.filter((m: Mapping) => file.selectedMappingIds.has(m.id));
    },
  }))
);

// ============================================================================
// Selector hooks for common patterns
// ============================================================================

/**
 * Hook to get the active file
 */
export function useActiveFile(): OpenFile | null {
  return useTsiStore((state) => {
    if (!state.activeFileId) return null;
    return state.openFiles.get(state.activeFileId) ?? null;
  });
}

/**
 * Hook to get all open files as an array
 */
export function useOpenFiles(): OpenFile[] {
  return useTsiStore((state) => Array.from(state.openFiles.values()));
}

/**
 * Hook to check if there are any dirty files
 */
export function useHasDirtyFiles(): boolean {
  return useTsiStore((state) =>
    Array.from(state.openFiles.values()).some((f) => f.isDirty)
  );
}

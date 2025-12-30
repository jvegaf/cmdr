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
 *
 * Phase 14 additions:
 * - Clipboard operations (copy/paste mappings)
 * - Duplicate mappings
 * - Delete mappings
 * - Move mappings between devices
 *
 * Phase 14.5 additions:
 * - Undo/Redo system with history per file
 * - All mapping operations are undoable
 */

import {
  deepCopyMappingData,
  Device,
  Mapping,
  type MappingControlType,
  type MappingData,
  type MappingInteractionMode,
  type MappingTargetDeck,
  type TsiFile,
} from '@cmdr/core';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { getEditorSettings } from './appStore';
import { type MappingSnapshot, type UndoableAction, useHistoryStore } from './historyStore';

// ============================================================================
// Types
// ============================================================================

/**
 * Filter criteria for mappings (Phase 15)
 * AIDEV-NOTE: All filters are combined with AND logic
 */
export interface MappingFilters {
  /** Filter by command category (e.g., "Deck Common", "Mixer") */
  commandCategory?: string | null;
  /** Filter by control type (Button, Fader, Encoder, LED) */
  controlType?: string | null;
  /** Filter by whether mapping has conditions */
  hasConditions?: boolean | null;
  /** Filter by whether mapping has MIDI binding */
  hasMidiBinding?: boolean | null;
}

/**
 * Properties that can be updated on a mapping
 * AIDEV-NOTE: These map to the Mapping class setters
 */
export interface MappingUpdate {
  commandId?: number;
  target?: MappingTargetDeck;
  controlType?: MappingControlType;
  interactionMode?: MappingInteractionMode;
  comment?: string;
  autoRepeat?: boolean;
  invert?: boolean;
  softTakeover?: boolean;
  // Conditions
  condition1?: { id: number; target?: MappingTargetDeck } | null;
  condition2?: { id: number; target?: MappingTargetDeck } | null;
}

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
  /** Search query for filtering mappings (Phase 15) */
  searchQuery: string;
  /** Active filters for mappings (Phase 15) */
  filters: MappingFilters;
}

/**
 * Clipboard data for copy/paste operations
 * AIDEV-NOTE: We store raw MappingData for clipboard to preserve all settings
 */
export interface ClipboardData {
  /** Raw mapping data (deep copied) */
  mappings: MappingData[];
  /** Source file ID (for reference) */
  sourceFileId: string;
  /** Source device index */
  sourceDeviceIndex: number;
}

interface TsiState {
  // Open files
  openFiles: Map<string, OpenFile>;
  activeFileId: string | null;

  // Clipboard
  clipboard: ClipboardData | null;

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

  // Actions - Mapping editing
  updateMapping: (fileId: string, mappingId: number, updates: MappingUpdate) => void;
  updateMappings: (fileId: string, mappingIds: number[], updates: MappingUpdate) => void;

  // Actions - Clipboard operations (Phase 14)
  copyMappings: (fileId: string) => void;
  cutMappings: (fileId: string) => void;
  pasteMappings: (fileId: string, afterIndex?: number) => void;
  canPaste: () => boolean;

  // Actions - Mapping manipulation (Phase 14)
  duplicateMappings: (fileId: string) => void;
  deleteMappings: (fileId: string, mappingIds?: number[]) => void;
  moveMappingsToDevice: (fileId: string, targetDeviceIndex: number, mappingIds?: number[]) => void;

  // Actions - Device manipulation (Phase 19: Settings implementation)
  removeDevice: (fileId: string, deviceIndex: number) => void;
  duplicateDevice: (fileId: string, deviceIndex: number) => void;
  renameDevice: (fileId: string, deviceIndex: number, newName: string) => void;

  // Actions - Undo/Redo (Phase 14.5)
  undo: (fileId: string) => void;
  redo: (fileId: string) => void;

  // Actions - Search and Filters (Phase 15)
  setSearchQuery: (fileId: string, query: string) => void;
  setFilters: (fileId: string, filters: Partial<MappingFilters>) => void;
  clearFilters: (fileId: string) => void;

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

// AIDEV-NOTE: Deep copy functions moved to @cmdr/core/utils/deep-copy.ts
// Use deepCopyMappingData() for clipboard operations (resets binding ID)
// Use deepCopyMappingData(..., { preserveBindingId: true }) for undo/redo snapshots

/**
 * Create a snapshot of a mapping at a specific index
 */
function createMappingSnapshot(mapping: Mapping, index: number): MappingSnapshot {
  return {
    id: mapping.id,
    index,
    data: deepCopyMappingData(mapping.rawData, { preserveBindingId: true }),
  };
}

/**
 * Apply updates to a mapping using the Mapping class setters
 * AIDEV-NOTE: This mutates the mapping in place since Mapping wraps the raw data
 */
function applyMappingUpdates(mapping: Mapping, updates: MappingUpdate): void {
  if (updates.commandId !== undefined) {
    mapping.commandId = updates.commandId;
  }
  if (updates.target !== undefined) {
    mapping.target = updates.target;
  }
  if (updates.controlType !== undefined) {
    mapping.controlType = updates.controlType;
  }
  if (updates.interactionMode !== undefined) {
    mapping.interactionMode = updates.interactionMode;
  }
  if (updates.comment !== undefined) {
    mapping.comment = updates.comment;
  }
  if (updates.autoRepeat !== undefined) {
    mapping.autoRepeat = updates.autoRepeat;
  }
  if (updates.invert !== undefined) {
    mapping.invert = updates.invert;
  }
  if (updates.softTakeover !== undefined) {
    mapping.softTakeover = updates.softTakeover;
  }
  if (updates.condition1 !== undefined) {
    if (updates.condition1 === null) {
      mapping.clearCondition1();
    } else {
      mapping.setCondition1(updates.condition1.id, updates.condition1.target);
    }
  }
  if (updates.condition2 !== undefined) {
    if (updates.condition2 === null) {
      mapping.clearCondition2();
    } else {
      mapping.setCondition2(updates.condition2.id, updates.condition2.target);
    }
  }
}

/**
 * AIDEV-NOTE: Helper to get filter clearing state based on settings.
 * Returns partial OpenFile state to merge when filters should be cleared.
 */
function getFilterClearState(): { searchQuery: string; filters: MappingFilters } | null {
  const editorSettings = getEditorSettings();
  if (editorSettings.clearFilterAtModifications) {
    return { searchQuery: '', filters: {} };
  }
  return null;
}

// ============================================================================
// Store
// ============================================================================

export const useTsiStore = create<TsiState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    openFiles: new Map(),
    activeFileId: null,
    clipboard: null,

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
        searchQuery: '',
        filters: {},
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
      // Clear history for this file
      useHistoryStore.getState().clearHistory(fileId);

      set((state) => {
        const newFiles = new Map(state.openFiles);
        newFiles.delete(fileId);

        // Update active file if we closed the active one
        let newActiveId = state.activeFileId;
        if (state.activeFileId === fileId) {
          const remaining = Array.from(newFiles.keys());
          newActiveId = remaining.length > 0 ? (remaining[remaining.length - 1] ?? null) : null;
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

        // AIDEV-NOTE: Check if we should clear filters when changing device
        const editorSettings = getEditorSettings();
        const shouldClearFilters = editorSettings.clearFilterAtPageChanges;

        const newFiles = new Map(state.openFiles);
        newFiles.set(fileId, {
          ...file,
          selectedDeviceIndex: deviceIndex,
          selectedMappingIds: new Set(), // Clear mapping selection when changing device
          // Optionally clear filters based on settings
          ...(shouldClearFilters && {
            searchQuery: '',
            filters: {},
          }),
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
    // Mapping Editing
    // ========================================================================

    updateMapping: (fileId, mappingId, updates) => {
      const state = get();
      const file = state.openFiles.get(fileId);
      if (!file || file.selectedDeviceIndex === null) return;

      const device = file.devices[file.selectedDeviceIndex];
      if (!device) return;

      // Find the mapping and its index
      let mappingIndex = -1;
      const mapping = device.mappings.find((m, i) => {
        if (m.id === mappingId) {
          mappingIndex = i;
          return true;
        }
        return false;
      });
      if (!mapping || mappingIndex === -1) return;

      // Create snapshot before modification
      const beforeSnapshot = createMappingSnapshot(mapping, mappingIndex);

      // Apply updates using the Mapping setters
      applyMappingUpdates(mapping, updates);

      // Create snapshot after modification
      const afterSnapshot = createMappingSnapshot(mapping, mappingIndex);

      // Record action in history
      const action: UndoableAction = {
        type: 'UPDATE_MAPPING',
        description: 'Edit mapping',
        deviceIndex: file.selectedDeviceIndex,
        before: { mappings: [beforeSnapshot] },
        after: { mappings: [afterSnapshot] },
        timestamp: Date.now(),
      };
      useHistoryStore.getState().pushAction(fileId, action);

      // Mark file as dirty and trigger re-render
      // AIDEV-NOTE: Optionally clear filters based on clearFilterAtModifications setting
      const filterClear = getFilterClearState();
      set((currentState) => {
        const newFiles = new Map(currentState.openFiles);
        const currentFile = newFiles.get(fileId);
        if (currentFile) {
          newFiles.set(fileId, {
            ...currentFile,
            isDirty: true,
            ...(filterClear ?? {}),
          });
        }
        return { openFiles: newFiles };
      });
    },

    updateMappings: (fileId, mappingIds, updates) => {
      const state = get();
      const file = state.openFiles.get(fileId);
      if (!file || file.selectedDeviceIndex === null) return;

      const device = file.devices[file.selectedDeviceIndex];
      if (!device) return;

      // Find all mappings and create snapshots before modification
      const mappingIdSet = new Set(mappingIds);
      const beforeSnapshots: MappingSnapshot[] = [];
      const mappingsToUpdate: { mapping: Mapping; index: number }[] = [];

      device.mappings.forEach((mapping, index) => {
        if (mappingIdSet.has(mapping.id)) {
          beforeSnapshots.push(createMappingSnapshot(mapping, index));
          mappingsToUpdate.push({ mapping, index });
        }
      });

      if (mappingsToUpdate.length === 0) return;

      // Apply updates to all mappings
      for (const { mapping } of mappingsToUpdate) {
        applyMappingUpdates(mapping, updates);
      }

      // Create snapshots after modification
      const afterSnapshots: MappingSnapshot[] = mappingsToUpdate.map(({ mapping, index }) =>
        createMappingSnapshot(mapping, index)
      );

      // Record action in history
      const action: UndoableAction = {
        type: 'UPDATE_MAPPINGS',
        description: `Edit ${mappingsToUpdate.length} mappings`,
        deviceIndex: file.selectedDeviceIndex,
        before: { mappings: beforeSnapshots },
        after: { mappings: afterSnapshots },
        timestamp: Date.now(),
      };
      useHistoryStore.getState().pushAction(fileId, action);

      // Mark file as dirty and trigger re-render
      const filterClear = getFilterClearState();
      set((currentState) => {
        const newFiles = new Map(currentState.openFiles);
        const currentFile = newFiles.get(fileId);
        if (currentFile) {
          newFiles.set(fileId, {
            ...currentFile,
            isDirty: true,
            ...(filterClear ?? {}),
          });
        }
        return { openFiles: newFiles };
      });
    },

    // ========================================================================
    // Clipboard Operations (Phase 14)
    // ========================================================================

    copyMappings: (fileId) => {
      const state = get();
      const file = state.openFiles.get(fileId);
      if (!file || file.selectedDeviceIndex === null) return;

      const device = file.devices[file.selectedDeviceIndex];
      if (!device) return;

      // Get selected mappings in order
      const selectedMappings = device.mappings.filter((m) => file.selectedMappingIds.has(m.id));
      if (selectedMappings.length === 0) return;

      // Deep copy the raw mapping data
      const copiedMappings = selectedMappings.map((m) => deepCopyMappingData(m.rawData));

      set({
        clipboard: {
          mappings: copiedMappings,
          sourceFileId: fileId,
          sourceDeviceIndex: file.selectedDeviceIndex,
        },
      });
    },

    cutMappings: (fileId) => {
      // Copy first, then delete
      get().copyMappings(fileId);
      get().deleteMappings(fileId);
    },

    pasteMappings: (fileId, afterIndex) => {
      const state = get();
      const file = state.openFiles.get(fileId);
      if (!file || file.selectedDeviceIndex === null) return;
      if (!state.clipboard || state.clipboard.mappings.length === 0) return;

      const device = file.devices[file.selectedDeviceIndex];
      if (!device) return;

      // Determine insertion index
      let insertIndex: number;
      if (afterIndex !== undefined) {
        insertIndex = afterIndex + 1;
      } else if (file.selectedMappingIds.size > 0) {
        // Insert after last selected mapping
        const selectedIndices: number[] = [];
        device.mappings.forEach((m, i) => {
          if (file.selectedMappingIds.has(m.id)) {
            selectedIndices.push(i);
          }
        });
        insertIndex =
          selectedIndices.length > 0 ? Math.max(...selectedIndices) + 1 : device.mappingCount;
      } else {
        // Append at end
        insertIndex = device.mappingCount;
      }

      // Create new mappings from clipboard data and insert them
      const newMappingIds: number[] = [];
      const afterSnapshots: MappingSnapshot[] = [];

      for (let i = 0; i < state.clipboard.mappings.length; i++) {
        const clipData = state.clipboard.mappings[i];
        if (!clipData) continue;

        const copiedData = deepCopyMappingData(clipData);
        const newMapping = Mapping.fromRawData(copiedData);
        device.insertMapping(insertIndex + i, newMapping);
        newMappingIds.push(newMapping.id);

        // Snapshot after insertion
        afterSnapshots.push(createMappingSnapshot(newMapping, insertIndex + i));
      }

      // Record action in history
      const action: UndoableAction = {
        type: 'PASTE_MAPPINGS',
        description: `Paste ${newMappingIds.length} mapping${newMappingIds.length > 1 ? 's' : ''}`,
        deviceIndex: file.selectedDeviceIndex,
        before: {
          mappings: [],
          selectedMappingIds: Array.from(file.selectedMappingIds),
        },
        after: {
          mappings: afterSnapshots,
          createdIds: newMappingIds,
          selectedMappingIds: newMappingIds,
        },
        timestamp: Date.now(),
      };
      useHistoryStore.getState().pushAction(fileId, action);

      // Update state: mark dirty and select pasted mappings
      // AIDEV-NOTE: Optionally clear filters based on clearFilterAtModifications setting
      const filterClear = getFilterClearState();
      const newFiles = new Map(state.openFiles);
      newFiles.set(fileId, {
        ...file,
        isDirty: true,
        selectedMappingIds: new Set(newMappingIds),
        ...(filterClear ?? {}),
      });
      set({ openFiles: newFiles });
    },

    canPaste: () => {
      const state = get();
      return state.clipboard !== null && state.clipboard.mappings.length > 0;
    },

    // ========================================================================
    // Mapping Manipulation (Phase 14)
    // ========================================================================

    duplicateMappings: (fileId) => {
      const state = get();
      const file = state.openFiles.get(fileId);
      if (!file || file.selectedDeviceIndex === null) return;

      const device = file.devices[file.selectedDeviceIndex];
      if (!device) return;

      // Get selected mappings in order
      const selectedMappings: { mapping: Mapping; index: number }[] = [];
      device.mappings.forEach((m, i) => {
        if (file.selectedMappingIds.has(m.id)) {
          selectedMappings.push({ mapping: m, index: i });
        }
      });
      if (selectedMappings.length === 0) return;

      // Find insertion point (after last selected)
      const lastIndex = Math.max(...selectedMappings.map((s) => s.index));

      // Create copies and insert after selection
      const newMappingIds: number[] = [];
      const afterSnapshots: MappingSnapshot[] = [];

      for (let i = 0; i < selectedMappings.length; i++) {
        const { mapping } = selectedMappings[i] ?? {};
        if (!mapping) continue;

        const copy = mapping.copy(false); // Don't copy MIDI binding
        device.insertMapping(lastIndex + 1 + i, copy);
        newMappingIds.push(copy.id);

        // Snapshot after insertion
        afterSnapshots.push(createMappingSnapshot(copy, lastIndex + 1 + i));
      }

      // Record action in history
      const action: UndoableAction = {
        type: 'DUPLICATE_MAPPINGS',
        description: `Duplicate ${newMappingIds.length} mapping${newMappingIds.length > 1 ? 's' : ''}`,
        deviceIndex: file.selectedDeviceIndex,
        before: {
          mappings: [],
          selectedMappingIds: Array.from(file.selectedMappingIds),
        },
        after: {
          mappings: afterSnapshots,
          createdIds: newMappingIds,
          selectedMappingIds: newMappingIds,
        },
        timestamp: Date.now(),
      };
      useHistoryStore.getState().pushAction(fileId, action);

      // Update state: mark dirty and select duplicated mappings
      const filterClear = getFilterClearState();
      const newFiles = new Map(state.openFiles);
      newFiles.set(fileId, {
        ...file,
        isDirty: true,
        selectedMappingIds: new Set(newMappingIds),
        ...(filterClear ?? {}),
      });
      set({ openFiles: newFiles });
    },

    deleteMappings: (fileId, mappingIds) => {
      const state = get();
      const file = state.openFiles.get(fileId);
      if (!file || file.selectedDeviceIndex === null) return;

      const device = file.devices[file.selectedDeviceIndex];
      if (!device) return;

      // Use provided IDs or selected IDs
      const idsToDelete = mappingIds ? new Set(mappingIds) : file.selectedMappingIds;
      if (idsToDelete.size === 0) return;

      // Collect mappings to delete with their snapshots (for undo)
      const beforeSnapshots: MappingSnapshot[] = [];
      const indicesToRemove: number[] = [];
      const deletedIds: number[] = [];

      device.mappings.forEach((m, i) => {
        if (idsToDelete.has(m.id)) {
          beforeSnapshots.push(createMappingSnapshot(m, i));
          indicesToRemove.push(i);
          deletedIds.push(m.id);
        }
      });

      // Record action in history BEFORE deletion (need the data)
      const action: UndoableAction = {
        type: 'DELETE_MAPPINGS',
        description: `Delete ${deletedIds.length} mapping${deletedIds.length > 1 ? 's' : ''}`,
        deviceIndex: file.selectedDeviceIndex,
        before: {
          mappings: beforeSnapshots,
          selectedMappingIds: Array.from(file.selectedMappingIds),
        },
        after: {
          mappings: [],
          deletedIds,
          selectedMappingIds: [],
        },
        timestamp: Date.now(),
      };
      useHistoryStore.getState().pushAction(fileId, action);

      // Remove from highest index first
      indicesToRemove.sort((a, b) => b - a);
      for (const index of indicesToRemove) {
        device.removeMappingAt(index);
      }

      // Update state: mark dirty and clear selection
      const filterClear = getFilterClearState();
      const newFiles = new Map(state.openFiles);
      newFiles.set(fileId, {
        ...file,
        isDirty: true,
        selectedMappingIds: new Set(),
        ...(filterClear ?? {}),
      });
      set({ openFiles: newFiles });
    },

    moveMappingsToDevice: (fileId, targetDeviceIndex, mappingIds) => {
      const state = get();
      const file = state.openFiles.get(fileId);
      if (!file || file.selectedDeviceIndex === null) return;
      if (targetDeviceIndex === file.selectedDeviceIndex) return; // Same device

      const sourceDevice = file.devices[file.selectedDeviceIndex];
      const targetDevice = file.devices[targetDeviceIndex];
      if (!sourceDevice || !targetDevice) return;

      // Use provided IDs or selected IDs
      const idsToMove = mappingIds ? new Set(mappingIds) : file.selectedMappingIds;
      if (idsToMove.size === 0) return;

      // Collect mappings to move (in order)
      const mappingsToMove: { mapping: Mapping; index: number }[] = [];
      sourceDevice.mappings.forEach((m, i) => {
        if (idsToMove.has(m.id)) {
          mappingsToMove.push({ mapping: m, index: i });
        }
      });

      // Copy mappings to target device (without MIDI bindings)
      const newMappingIds: number[] = [];
      for (const { mapping } of mappingsToMove) {
        const copy = mapping.copy(false);
        targetDevice.addMapping(copy);
        newMappingIds.push(copy.id);
      }

      // Remove from source device (reverse order)
      const indicesToRemove = mappingsToMove.map((m) => m.index);
      indicesToRemove.sort((a, b) => b - a);
      for (const index of indicesToRemove) {
        sourceDevice.removeMappingAt(index);
      }

      // Update state: mark dirty, switch to target device, select moved mappings
      // AIDEV-NOTE: Moving mappings is a modification, so optionally clear filters
      const filterClear = getFilterClearState();
      const newFiles = new Map(state.openFiles);
      newFiles.set(fileId, {
        ...file,
        isDirty: true,
        selectedDeviceIndex: targetDeviceIndex,
        selectedMappingIds: new Set(newMappingIds),
        ...(filterClear ?? {}),
      });
      set({ openFiles: newFiles });
    },

    // ========================================================================
    // Undo/Redo (Phase 14.5)
    // ========================================================================

    undo: (fileId) => {
      const historyStore = useHistoryStore.getState();
      const action = historyStore.popUndo(fileId);
      if (!action) return;

      const state = get();
      const file = state.openFiles.get(fileId);
      if (!file) return;

      const device = file.devices[action.deviceIndex];
      if (!device) return;

      // AIDEV-NOTE: Undo logic depends on action type
      // For actions that created mappings (paste, duplicate): delete them
      // For actions that deleted mappings: restore them
      // For actions that modified mappings: restore previous state

      switch (action.type) {
        case 'UPDATE_MAPPING':
        case 'UPDATE_MAPPINGS': {
          // Restore mappings to their previous state
          for (const snapshot of action.before.mappings) {
            const mapping = device.mappings.find((m) => m.id === snapshot.id);
            if (mapping) {
              // Replace the raw data with the snapshot data
              Object.assign(
                mapping.rawData,
                deepCopyMappingData(snapshot.data, { preserveBindingId: true })
              );
            }
          }
          break;
        }

        case 'PASTE_MAPPINGS':
        case 'DUPLICATE_MAPPINGS': {
          // Remove the created mappings
          const createdIds = action.after.createdIds ?? [];
          if (createdIds.length > 0) {
            const indicesToRemove: number[] = [];
            device.mappings.forEach((m, i) => {
              if (createdIds.includes(m.id)) {
                indicesToRemove.push(i);
              }
            });
            // Remove from highest index first
            indicesToRemove.sort((a, b) => b - a);
            for (const index of indicesToRemove) {
              device.removeMappingAt(index);
            }
          }
          break;
        }

        case 'DELETE_MAPPINGS':
        case 'CUT_MAPPINGS': {
          // Restore the deleted mappings at their original positions
          // Sort by index to insert in correct order
          const sortedSnapshots = [...action.before.mappings].sort((a, b) => a.index - b.index);
          for (const snapshot of sortedSnapshots) {
            const restoredMapping = Mapping.fromRawData(
              deepCopyMappingData(snapshot.data, { preserveBindingId: true })
            );
            device.insertMapping(snapshot.index, restoredMapping);
          }
          break;
        }

        case 'MOVE_MAPPINGS': {
          // AIDEV-TODO: Implement move undo (complex - involves two devices)
          console.warn('Undo for MOVE_MAPPINGS not yet implemented');
          break;
        }
      }

      // Restore selection if available
      const newSelection = action.before.selectedMappingIds
        ? new Set(action.before.selectedMappingIds)
        : new Set<number>();

      // Update state
      const newFiles = new Map(state.openFiles);
      newFiles.set(fileId, {
        ...file,
        isDirty: true,
        selectedMappingIds: newSelection,
      });
      set({ openFiles: newFiles });
    },

    redo: (fileId) => {
      const historyStore = useHistoryStore.getState();
      const action = historyStore.popRedo(fileId);
      if (!action) return;

      const state = get();
      const file = state.openFiles.get(fileId);
      if (!file) return;

      const device = file.devices[action.deviceIndex];
      if (!device) return;

      // AIDEV-NOTE: Redo re-applies the action
      // For actions that created mappings: re-create them
      // For actions that deleted mappings: delete them again
      // For actions that modified mappings: apply the after state

      switch (action.type) {
        case 'UPDATE_MAPPING':
        case 'UPDATE_MAPPINGS': {
          // Apply the "after" state to mappings
          for (const snapshot of action.after.mappings) {
            const mapping = device.mappings.find((m) => m.id === snapshot.id);
            if (mapping) {
              Object.assign(
                mapping.rawData,
                deepCopyMappingData(snapshot.data, { preserveBindingId: true })
              );
            }
          }
          break;
        }

        case 'PASTE_MAPPINGS':
        case 'DUPLICATE_MAPPINGS': {
          // Re-create the mappings at their positions
          const sortedSnapshots = [...action.after.mappings].sort((a, b) => a.index - b.index);
          for (const snapshot of sortedSnapshots) {
            const newMapping = Mapping.fromRawData(
              deepCopyMappingData(snapshot.data, { preserveBindingId: true })
            );
            device.insertMapping(snapshot.index, newMapping);
          }
          break;
        }

        case 'DELETE_MAPPINGS':
        case 'CUT_MAPPINGS': {
          // Delete the mappings again
          const deletedIds = action.after.deletedIds ?? [];
          if (deletedIds.length > 0) {
            const indicesToRemove: number[] = [];
            device.mappings.forEach((m, i) => {
              if (deletedIds.includes(m.id)) {
                indicesToRemove.push(i);
              }
            });
            indicesToRemove.sort((a, b) => b - a);
            for (const index of indicesToRemove) {
              device.removeMappingAt(index);
            }
          }
          break;
        }

        case 'MOVE_MAPPINGS': {
          // AIDEV-TODO: Implement move redo
          console.warn('Redo for MOVE_MAPPINGS not yet implemented');
          break;
        }
      }

      // Restore selection if available
      const newSelection = action.after.selectedMappingIds
        ? new Set(action.after.selectedMappingIds)
        : new Set<number>();

      // Update state
      const newFiles = new Map(state.openFiles);
      newFiles.set(fileId, {
        ...file,
        isDirty: true,
        selectedMappingIds: newSelection,
      });
      set({ openFiles: newFiles });
    },

    // ========================================================================
    // Search and Filters (Phase 15)
    // ========================================================================

    setSearchQuery: (fileId, query) => {
      set((state) => {
        const file = state.openFiles.get(fileId);
        if (!file) return state;

        const newFiles = new Map(state.openFiles);
        newFiles.set(fileId, { ...file, searchQuery: query });
        return { openFiles: newFiles };
      });
    },

    setFilters: (fileId, filters) => {
      set((state) => {
        const file = state.openFiles.get(fileId);
        if (!file) return state;

        const newFiles = new Map(state.openFiles);
        newFiles.set(fileId, {
          ...file,
          filters: { ...file.filters, ...filters },
        });
        return { openFiles: newFiles };
      });
    },

    clearFilters: (fileId) => {
      set((state) => {
        const file = state.openFiles.get(fileId);
        if (!file) return state;

        const newFiles = new Map(state.openFiles);
        newFiles.set(fileId, {
          ...file,
          searchQuery: '',
          filters: {},
        });
        return { openFiles: newFiles };
      });
    },

    // ========================================================================
    // Device Manipulation (Phase 19: Settings implementation)
    // ========================================================================

    removeDevice: (fileId, deviceIndex) => {
      set((state) => {
        const file = state.openFiles.get(fileId);
        if (!file) return state;
        if (deviceIndex < 0 || deviceIndex >= file.devices.length) return state;

        // AIDEV-NOTE: TsiFile is a class with controllerDevices and keyboardDevices.
        // The devices getter returns [...controllerDevices, ...keyboardDevices].
        // We use the removeDevice method which handles the combined index mapping.
        const success = file.tsiFile.removeDevice(deviceIndex);
        if (!success) return state;

        // Recreate Device models from the updated tsiFile
        const newDevices = createDeviceModels(file.tsiFile);

        // Adjust selected device index if needed
        let newSelectedIndex = file.selectedDeviceIndex;
        if (newSelectedIndex !== null) {
          if (newSelectedIndex === deviceIndex) {
            // Select the previous device, or null if no devices left
            newSelectedIndex = newDevices.length > 0 ? Math.max(0, deviceIndex - 1) : null;
          } else if (newSelectedIndex > deviceIndex) {
            // Adjust for removed index
            newSelectedIndex -= 1;
          }
        }

        const newFiles = new Map(state.openFiles);
        newFiles.set(fileId, {
          ...file,
          devices: newDevices,
          isDirty: true,
          selectedDeviceIndex: newSelectedIndex,
          selectedMappingIds: new Set(), // Clear mapping selection
        });

        return { openFiles: newFiles };
      });
    },

    duplicateDevice: (fileId, deviceIndex) => {
      set((state) => {
        const file = state.openFiles.get(fileId);
        if (!file) return state;
        if (deviceIndex < 0 || deviceIndex >= file.devices.length) return state;

        // AIDEV-NOTE: TsiFile.duplicateDevice handles the combined index mapping
        // and returns the new device's index
        const newIndex = file.tsiFile.duplicateDevice(deviceIndex);
        if (newIndex < 0) return state;

        // Recreate Device models from the updated tsiFile
        const newDevices = createDeviceModels(file.tsiFile);

        const newFiles = new Map(state.openFiles);
        newFiles.set(fileId, {
          ...file,
          devices: newDevices,
          isDirty: true,
          selectedDeviceIndex: newIndex, // Select the new device
          selectedMappingIds: new Set(),
        });

        return { openFiles: newFiles };
      });
    },

    renameDevice: (fileId, deviceIndex, newName) => {
      set((state) => {
        const file = state.openFiles.get(fileId);
        if (!file) return state;
        if (deviceIndex < 0 || deviceIndex >= file.devices.length) return state;

        // AIDEV-NOTE: Device name is stored in the device's comment field.
        // The device "type" is determined by deviceType enum which can't be renamed.
        // Device "name" in UI is typically the comment or a generic name from deviceType.
        const device = file.devices[deviceIndex];
        if (!device) return state;

        // Set the comment field as the device name
        device.comment = newName;

        const newFiles = new Map(state.openFiles);
        newFiles.set(fileId, {
          ...file,
          isDirty: true,
        });

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
  return useTsiStore((state) => Array.from(state.openFiles.values()).some((f) => f.isDirty));
}

/**
 * Hook to check if clipboard has content
 */
export function useCanPaste(): boolean {
  return useTsiStore((state) => state.clipboard !== null && state.clipboard.mappings.length > 0);
}

/**
 * Hook to get clipboard info
 */
export function useClipboardInfo(): {
  hasContent: boolean;
  mappingCount: number;
} {
  return useTsiStore((state) => ({
    hasContent: state.clipboard !== null && state.clipboard.mappings.length > 0,
    mappingCount: state.clipboard?.mappings.length ?? 0,
  }));
}

// ============================================================================
// Search and Filter Helpers (Phase 15)
// ============================================================================

/**
 * Hook to get search query for active file
 */
export function useSearchQuery(): string {
  return useTsiStore((state) => {
    if (!state.activeFileId) return '';
    const file = state.openFiles.get(state.activeFileId);
    return file?.searchQuery ?? '';
  });
}

/**
 * Hook to get filters for active file
 */
export function useFilters(): MappingFilters {
  return useTsiStore((state) => {
    if (!state.activeFileId) return {};
    const file = state.openFiles.get(state.activeFileId);
    return file?.filters ?? {};
  });
}

/**
 * Check if a mapping matches the search query
 * AIDEV-NOTE: Searches in command name, comment, and MIDI binding
 */
export function mappingMatchesSearch(mapping: Mapping, query: string): boolean {
  if (!query.trim()) return true;

  const lowerQuery = query.toLowerCase().trim();

  // Search in command name
  if (mapping.commandName.toLowerCase().includes(lowerQuery)) {
    return true;
  }

  // Search in comment
  if (mapping.comment?.toLowerCase().includes(lowerQuery)) {
    return true;
  }

  // Search in MIDI binding note
  if (mapping.midiBinding?.note?.toString().toLowerCase().includes(lowerQuery)) {
    return true;
  }

  // Search in condition names
  if (mapping.condition1?.description?.name?.toLowerCase().includes(lowerQuery)) {
    return true;
  }
  if (mapping.condition2?.description?.name?.toLowerCase().includes(lowerQuery)) {
    return true;
  }

  return false;
}

/**
 * Check if a mapping matches the filter criteria
 * AIDEV-NOTE: All active filters must match (AND logic)
 */
export function mappingMatchesFilters(mapping: Mapping, filters: MappingFilters): boolean {
  // Filter by command category
  // AIDEV-NOTE: Category is a Categories enum, convert to string for comparison
  if (filters.commandCategory) {
    const category = mapping.command?.category;
    const categoryStr = category !== undefined ? String(category) : '';
    if (categoryStr !== filters.commandCategory) {
      return false;
    }
  }

  // Filter by control type
  if (filters.controlType) {
    // AIDEV-NOTE: controlType is an enum, so compare as string for flexibility
    const controlTypeName = String(mapping.controlType);
    if (controlTypeName !== filters.controlType) {
      return false;
    }
  }

  // Filter by has conditions
  if (filters.hasConditions !== null && filters.hasConditions !== undefined) {
    const hasConditions = mapping.condition1 !== null || mapping.condition2 !== null;
    if (hasConditions !== filters.hasConditions) {
      return false;
    }
  }

  // Filter by has MIDI binding
  if (filters.hasMidiBinding !== null && filters.hasMidiBinding !== undefined) {
    const hasBinding = mapping.midiBinding !== null;
    if (hasBinding !== filters.hasMidiBinding) {
      return false;
    }
  }

  return true;
}

/**
 * Filter mappings by search query and filters
 * Returns filtered mappings and match indices for highlighting
 */
export function filterMappings(
  mappings: readonly Mapping[],
  searchQuery: string,
  filters: MappingFilters
): { filtered: Mapping[]; matchingIds: Set<number> } {
  const matchingIds = new Set<number>();
  const filtered: Mapping[] = [];

  for (const mapping of mappings) {
    const matchesSearch = mappingMatchesSearch(mapping, searchQuery);
    const matchesFilters = mappingMatchesFilters(mapping, filters);

    if (matchesSearch && matchesFilters) {
      filtered.push(mapping);
      matchingIds.add(mapping.id);
    }
  }

  return { filtered, matchingIds };
}

/**
 * Hook to check if any filters are active
 */
export function useHasActiveFilters(): boolean {
  return useTsiStore((state) => {
    if (!state.activeFileId) return false;
    const file = state.openFiles.get(state.activeFileId);
    if (!file) return false;

    const { filters, searchQuery } = file;
    return (
      searchQuery.trim() !== '' ||
      filters.commandCategory != null ||
      filters.controlType != null ||
      filters.hasConditions != null ||
      filters.hasMidiBinding != null
    );
  });
}

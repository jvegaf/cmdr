/**
 * Tests for tsiStore.ts - TSI File State Management
 *
 * AIDEV-NOTE: Compact test suite covering critical paths of the main TSI store.
 * Uses vi.mock with factory function - all mock classes MUST be defined inside the factory.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useHistoryStore } from '../src/renderer/store/historyStore';

// ============================================================================
// Mock @cmdr/core - All classes MUST be defined inside factory due to hoisting
// ============================================================================

const MappingType = { In: 0, Out: 1 };
const MappingControlType = { Button: 0, Fader: 1, Encoder: 2, LED: 3 };
const MappingInteractionMode = { Hold: 0, Toggle: 1, Direct: 2 };
const MappingTargetDeck = { DeviceTarget: 0, DeckA: 1, DeckB: 2 };

vi.mock('@cmdr/core', () => {
  // Helper to create mock mapping data
  function createMockMappingDataInternal(commandId = 0, bindingId = -1) {
    return {
      midiNoteBindingId: bindingId,
      type: 0,
      traktorControlId: commandId,
      settings: {
        controlType: 0,
        interactionMode: 0,
        target: 0,
        comment: `Mapping ${bindingId}`,
        autoRepeat: false,
        invert: false,
        softTakeover: false,
        conditionOneId: 0,
        conditionOneTarget: 0,
        conditionOneValue: new Uint8Array(4),
        conditionTwoId: 0,
        conditionTwoTarget: 0,
        conditionTwoValue: new Uint8Array(4),
        setValueTo: new Uint8Array(4),
        ledMinControllerRange: new Uint8Array(4),
        ledMaxControllerRange: new Uint8Array(4),
      },
    };
  }

  type RawMappingData = ReturnType<typeof createMockMappingDataInternal>;

  // AIDEV-NOTE: MockMapping uses getters/setters that sync with rawData
  // This is critical for undo/redo which uses Object.assign on rawData
  class MockMapping {
    rawData: RawMappingData;
    midiBinding: null = null;
    command = { category: 0 };

    constructor(rawData: RawMappingData) {
      this.rawData = rawData;
    }

    get id() {
      return this.rawData.midiNoteBindingId;
    }
    set id(value: number) {
      this.rawData.midiNoteBindingId = value;
    }

    get commandId() {
      return this.rawData.traktorControlId;
    }
    set commandId(value: number) {
      this.rawData.traktorControlId = value;
    }

    get commandName() {
      return `Command ${this.rawData.traktorControlId}`;
    }

    get comment() {
      return this.rawData.settings.comment;
    }
    set comment(value: string) {
      this.rawData.settings.comment = value;
    }

    get controlType() {
      return this.rawData.settings.controlType;
    }
    set controlType(value: number) {
      this.rawData.settings.controlType = value;
    }

    get interactionMode() {
      return this.rawData.settings.interactionMode;
    }
    set interactionMode(value: number) {
      this.rawData.settings.interactionMode = value;
    }

    get target() {
      return this.rawData.settings.target;
    }
    set target(value: number) {
      this.rawData.settings.target = value;
    }

    get autoRepeat() {
      return this.rawData.settings.autoRepeat;
    }
    set autoRepeat(value: boolean) {
      this.rawData.settings.autoRepeat = value;
    }

    get invert() {
      return this.rawData.settings.invert;
    }
    set invert(value: boolean) {
      this.rawData.settings.invert = value;
    }

    get softTakeover() {
      return this.rawData.settings.softTakeover;
    }
    set softTakeover(value: boolean) {
      this.rawData.settings.softTakeover = value;
    }

    get condition1(): { id: number; target: number; description: { name: string } } | null {
      const id = this.rawData.settings.conditionOneId;
      if (id > 0) {
        return {
          id,
          target: this.rawData.settings.conditionOneTarget,
          description: { name: `Cond ${id}` },
        };
      }
      return null;
    }

    get condition2(): { id: number; target: number; description: { name: string } } | null {
      const id = this.rawData.settings.conditionTwoId;
      if (id > 0) {
        return {
          id,
          target: this.rawData.settings.conditionTwoTarget,
          description: { name: `Cond ${id}` },
        };
      }
      return null;
    }

    static fromRawData(rawData: RawMappingData) {
      return new MockMapping(rawData);
    }

    copy(includeMidiBinding = false) {
      const copiedData = JSON.parse(JSON.stringify(this.rawData));
      copiedData.settings.setValueTo = new Uint8Array(4);
      copiedData.settings.conditionOneValue = new Uint8Array(4);
      copiedData.settings.conditionTwoValue = new Uint8Array(4);
      copiedData.settings.ledMinControllerRange = new Uint8Array(4);
      copiedData.settings.ledMaxControllerRange = new Uint8Array(4);
      if (!includeMidiBinding) copiedData.midiNoteBindingId = -1;
      return new MockMapping(copiedData);
    }

    setCondition1(id: number, target = 0) {
      this.rawData.settings.conditionOneId = id;
      this.rawData.settings.conditionOneTarget = target;
    }

    setCondition2(id: number, target = 0) {
      this.rawData.settings.conditionTwoId = id;
      this.rawData.settings.conditionTwoTarget = target;
    }

    clearCondition1() {
      this.setCondition1(0);
    }
    clearCondition2() {
      this.setCondition2(0);
    }
  }

  class MockDevice {
    rawData: {
      deviceType: string;
      data: { mappings: { mappings: RawMappingData[] } };
    };
    id = -1;
    deviceType: string;
    mappings: MockMapping[] = [];

    constructor(deviceType: string) {
      this.deviceType = deviceType;
      this.rawData = {
        deviceType,
        data: { mappings: { mappings: [] } },
      };
    }

    static fromRawData(rawData: {
      deviceType: string;
      data: { mappings?: { mappings: RawMappingData[] } };
    }) {
      const device = new MockDevice(rawData.deviceType);
      device.rawData = rawData as MockDevice['rawData'];
      if (rawData.data.mappings?.mappings) {
        device.mappings = rawData.data.mappings.mappings.map((m) => MockMapping.fromRawData(m));
      }
      return device;
    }

    get mappingCount() {
      return this.mappings.length;
    }

    addMapping(mapping: MockMapping) {
      this.mappings.push(mapping);
    }

    insertMapping(index: number, mapping: MockMapping) {
      if (mapping.rawData.midiNoteBindingId === -1) {
        const maxId = this.mappings.length > 0 ? Math.max(...this.mappings.map((m) => m.id)) : 0;
        mapping.rawData.midiNoteBindingId = maxId + 1;
        mapping.id = mapping.rawData.midiNoteBindingId;
      }
      this.mappings.splice(index, 0, mapping);
    }

    removeMappingAt(index: number) {
      this.mappings.splice(index, 1);
    }
  }

  // AIDEV-NOTE: Mock deepCopyMappingData to match @cmdr/core implementation
  // This must handle Uint8Array deep copy and preserveBindingId option
  function deepCopyMappingData(
    data: RawMappingData,
    options: { preserveBindingId?: boolean } = {}
  ): RawMappingData {
    const { preserveBindingId = false } = options;
    return {
      midiNoteBindingId: preserveBindingId ? data.midiNoteBindingId : -1,
      type: data.type,
      traktorControlId: data.traktorControlId,
      settings: {
        ...data.settings,
        setValueTo: new Uint8Array(data.settings.setValueTo),
        conditionOneValue: new Uint8Array(data.settings.conditionOneValue),
        conditionTwoValue: new Uint8Array(data.settings.conditionTwoValue),
        ledMinControllerRange: new Uint8Array(data.settings.ledMinControllerRange),
        ledMaxControllerRange: new Uint8Array(data.settings.ledMaxControllerRange),
      },
    };
  }

  return {
    Device: MockDevice,
    Mapping: MockMapping,
    deepCopyMappingData,
    MappingType: { In: 0, Out: 1 },
    MappingControlType: { Button: 0, Fader: 1, Encoder: 2, LED: 3 },
    MappingInteractionMode: { Hold: 0, Toggle: 1, Direct: 2 },
    MappingTargetDeck: { DeviceTarget: 0, DeckA: 1, DeckB: 2 },
  };
});

// Import after mock
import { useTsiStore } from '../src/renderer/store/tsiStore';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockMappingData(commandId = 0, bindingId = -1) {
  return {
    midiNoteBindingId: bindingId,
    type: MappingType.In,
    traktorControlId: commandId,
    settings: {
      controlType: MappingControlType.Button,
      interactionMode: MappingInteractionMode.Hold,
      target: MappingTargetDeck.DeviceTarget,
      comment: `Mapping ${bindingId}`,
      autoRepeat: false,
      invert: false,
      softTakeover: false,
      conditionOneId: 0,
      conditionOneTarget: 0,
      conditionOneValue: new Uint8Array(4),
      conditionTwoId: 0,
      conditionTwoTarget: 0,
      conditionTwoValue: new Uint8Array(4),
      setValueTo: new Uint8Array(4),
      ledMinControllerRange: new Uint8Array(4),
      ledMaxControllerRange: new Uint8Array(4),
    },
  };
}

type MockDeviceData = {
  deviceType: string;
  isKeyboard?: boolean;
  comment?: string;
  data: { mappings: { mappings: ReturnType<typeof createMockMappingData>[] } };
};

/**
 * AIDEV-NOTE: Mock TsiFile class that mimics the real TsiFile class behavior.
 * The real TsiFile has:
 * - controllerDevices: DeviceData[]
 * - keyboardDevices: DeviceData[]
 * - devices getter: returns [...controllerDevices, ...keyboardDevices]
 * - removeDevice(index): removes from the combined index
 * - duplicateDevice(index): duplicates at combined index, returns new index
 * - getDevice(index): returns device data at combined index
 */
function createMockTsiFile(deviceCount = 1, mappingsPerDevice = 3) {
  const controllerDevices: MockDeviceData[] = [];
  const keyboardDevices: MockDeviceData[] = [];

  for (let i = 0; i < deviceCount; i++) {
    const mappings = Array.from({ length: mappingsPerDevice }, (_, j) =>
      createMockMappingData(j + 1, j + 1)
    );
    controllerDevices.push({
      deviceType: `Device ${i}`,
      isKeyboard: false,
      data: { mappings: { mappings } },
    });
  }

  return {
    get devices() {
      return [...controllerDevices, ...keyboardDevices];
    },
    controllerDevices,
    keyboardDevices,

    // AIDEV-NOTE: Remove device at combined index (mirrors TsiFile.removeDevice)
    removeDevice(combinedIndex: number): boolean {
      if (combinedIndex < 0) return false;
      if (combinedIndex < controllerDevices.length) {
        controllerDevices.splice(combinedIndex, 1);
        return true;
      }
      const keyboardIndex = combinedIndex - controllerDevices.length;
      if (keyboardIndex < keyboardDevices.length) {
        keyboardDevices.splice(keyboardIndex, 1);
        return true;
      }
      return false;
    },

    // AIDEV-NOTE: Duplicate device at combined index, returns new device index
    duplicateDevice(combinedIndex: number): number {
      if (combinedIndex < 0) return -1;
      if (combinedIndex < controllerDevices.length) {
        const original = controllerDevices[combinedIndex];
        if (!original) return -1;
        const copy = JSON.parse(JSON.stringify(original));
        controllerDevices.splice(combinedIndex + 1, 0, copy);
        return combinedIndex + 1;
      }
      const keyboardIndex = combinedIndex - controllerDevices.length;
      if (keyboardIndex < keyboardDevices.length) {
        const original = keyboardDevices[keyboardIndex];
        if (!original) return -1;
        const copy = JSON.parse(JSON.stringify(original));
        keyboardDevices.splice(keyboardIndex + 1, 0, copy);
        return combinedIndex + 1;
      }
      return -1;
    },

    // AIDEV-NOTE: Get device data at combined index
    getDevice(combinedIndex: number): MockDeviceData | null {
      const devices = [...controllerDevices, ...keyboardDevices];
      if (combinedIndex < 0 || combinedIndex >= devices.length) return null;
      return devices[combinedIndex] ?? null;
    },
  };
}

function resetStores() {
  useTsiStore.setState({ openFiles: new Map(), activeFileId: null, clipboard: null });
  useHistoryStore.setState({ histories: new Map(), maxHistorySize: 50 });
}

// ============================================================================
// Tests
// ============================================================================

describe('tsiStore', () => {
  beforeEach(resetStores);

  // ==========================================================================
  // File Operations
  // ==========================================================================
  describe('File Operations', () => {
    it('should open file and set as active', () => {
      const { openFile } = useTsiStore.getState();
      const fileId = openFile('/path/test.tsi', createMockTsiFile(2, 3) as any);

      const state = useTsiStore.getState();
      expect(state.openFiles.has(fileId)).toBe(true);
      expect(state.activeFileId).toBe(fileId);

      const file = state.openFiles.get(fileId)!;
      expect(file.filePath).toBe('/path/test.tsi');
      expect(file.displayName).toBe('test.tsi');
      expect(file.devices).toHaveLength(2);
      expect(file.isDirty).toBe(false);
      expect(file.selectedDeviceIndex).toBe(0);
    });

    it('should create new file with Untitled name', () => {
      const { createNewFile } = useTsiStore.getState();
      const fileId = createNewFile(createMockTsiFile(1, 0) as any);

      const file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.filePath).toBe('');
      expect(file.displayName).toBe('Untitled');
    });

    it('should close file and update active', () => {
      const { openFile, closeFile } = useTsiStore.getState();
      const fileId1 = openFile('/path/file1.tsi', createMockTsiFile() as any);
      const fileId2 = openFile('/path/file2.tsi', createMockTsiFile() as any);

      closeFile(fileId2);

      const state = useTsiStore.getState();
      expect(state.openFiles.has(fileId2)).toBe(false);
      expect(state.activeFileId).toBe(fileId1);
    });

    it('should mark dirty/clean and update path', () => {
      const { openFile, markDirty, markClean, updateFilePath } = useTsiStore.getState();
      const fileId = openFile('/old.tsi', createMockTsiFile() as any);

      markDirty(fileId);
      expect(useTsiStore.getState().openFiles.get(fileId)!.isDirty).toBe(true);

      markClean(fileId);
      expect(useTsiStore.getState().openFiles.get(fileId)!.isDirty).toBe(false);

      updateFilePath(fileId, '/new/path.tsi');
      const file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.filePath).toBe('/new/path.tsi');
      expect(file.displayName).toBe('path.tsi');
    });

    it('should set active file', () => {
      const { openFile, setActiveFile } = useTsiStore.getState();
      const fileId1 = openFile('/file1.tsi', createMockTsiFile() as any);
      openFile('/file2.tsi', createMockTsiFile() as any);

      setActiveFile(fileId1);
      expect(useTsiStore.getState().activeFileId).toBe(fileId1);
    });
  });

  // ==========================================================================
  // Selection Operations
  // ==========================================================================
  describe('Selection Operations', () => {
    it('should select device and clear mapping selection', () => {
      const { openFile, selectMapping, selectDevice } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(2, 3) as any);

      selectMapping(fileId, 1);
      selectDevice(fileId, 1);

      const file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.selectedDeviceIndex).toBe(1);
      expect(file.selectedMappingIds.size).toBe(0);
    });

    it('should select mappings exclusively and non-exclusively', () => {
      const { openFile, selectMapping } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 5) as any);

      selectMapping(fileId, 1, true);
      selectMapping(fileId, 2, false);
      selectMapping(fileId, 3, false);

      const file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.selectedMappingIds.size).toBe(3);
      expect([...file.selectedMappingIds]).toEqual([1, 2, 3]);
    });

    it('should select multiple mappings and toggle', () => {
      const { openFile, selectMappings, toggleMappingSelection } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 5) as any);

      selectMappings(fileId, [1, 3, 5]);
      expect(useTsiStore.getState().openFiles.get(fileId)!.selectedMappingIds.size).toBe(3);

      toggleMappingSelection(fileId, 3);
      toggleMappingSelection(fileId, 2);

      const file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.selectedMappingIds.has(3)).toBe(false);
      expect(file.selectedMappingIds.has(2)).toBe(true);
    });

    it('should select mapping range and clear selection', () => {
      const { openFile, selectMappingRange, clearMappingSelection } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 5) as any);

      selectMappingRange(fileId, 2, 4);
      expect(useTsiStore.getState().openFiles.get(fileId)!.selectedMappingIds.size).toBe(3);

      clearMappingSelection(fileId);
      expect(useTsiStore.getState().openFiles.get(fileId)!.selectedMappingIds.size).toBe(0);
    });
  });

  // ==========================================================================
  // Mapping Editing
  // ==========================================================================
  describe('Mapping Editing', () => {
    it('should update single mapping and mark dirty', () => {
      const { openFile, updateMapping } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 3) as any);

      updateMapping(fileId, 1, { comment: 'Updated', autoRepeat: true });

      const file = useTsiStore.getState().openFiles.get(fileId)!;
      const mapping = (file.devices[0].mappings as any[]).find((m: any) => m.id === 1)!;
      expect(mapping.comment).toBe('Updated');
      expect(mapping.autoRepeat).toBe(true);
      expect(file.isDirty).toBe(true);
    });

    it('should update multiple mappings', () => {
      const { openFile, updateMappings } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 5) as any);

      updateMappings(fileId, [1, 2, 3], { invert: true });

      const file = useTsiStore.getState().openFiles.get(fileId)!;
      [1, 2, 3].forEach((id) => {
        const m = (file.devices[0].mappings as any[]).find((m: any) => m.id === id)!;
        expect(m.invert).toBe(true);
      });
    });

    it('should update and clear conditions', () => {
      const { openFile, updateMapping } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 3) as any);

      updateMapping(fileId, 1, { condition1: { id: 10, target: 1 } });
      let mapping = (
        useTsiStore.getState().openFiles.get(fileId)!.devices[0].mappings as any[]
      ).find((m: any) => m.id === 1)!;
      expect(mapping.condition1?.id).toBe(10);

      updateMapping(fileId, 1, { condition1: null });
      mapping = (useTsiStore.getState().openFiles.get(fileId)!.devices[0].mappings as any[]).find(
        (m: any) => m.id === 1
      )!;
      expect(mapping.condition1).toBe(null);
    });

    it('should record action in history', () => {
      const { openFile, updateMapping } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 3) as any);

      updateMapping(fileId, 1, { comment: 'Test' });

      const history = useHistoryStore.getState().histories.get(fileId);
      expect(history?.undoStack).toHaveLength(1);
      expect(history?.undoStack[0]?.type).toBe('UPDATE_MAPPING');
    });
  });

  // ==========================================================================
  // Clipboard Operations
  // ==========================================================================
  describe('Clipboard Operations', () => {
    it('should copy and paste mappings', () => {
      const { openFile, selectMappings, copyMappings, pasteMappings, canPaste } =
        useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 3) as any);

      expect(canPaste()).toBe(false);

      selectMappings(fileId, [1, 2]);
      copyMappings(fileId);

      expect(canPaste()).toBe(true);
      expect(useTsiStore.getState().clipboard?.mappings).toHaveLength(2);

      pasteMappings(fileId);

      const file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices[0].mappings).toHaveLength(5);
      expect(file.selectedMappingIds.size).toBe(2); // New mappings selected
    });

    it('should cut mappings', () => {
      const { openFile, selectMappings, cutMappings } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 5) as any);

      selectMappings(fileId, [1, 2]);
      cutMappings(fileId);

      const state = useTsiStore.getState();
      expect(state.clipboard?.mappings).toHaveLength(2);
      expect(state.openFiles.get(fileId)!.devices[0].mappings).toHaveLength(3);
    });

    it('should reset MIDI binding ID when copying', () => {
      const { openFile, selectMappings, copyMappings } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 3) as any);

      selectMappings(fileId, [1]);
      copyMappings(fileId);

      expect(useTsiStore.getState().clipboard?.mappings[0]?.midiNoteBindingId).toBe(-1);
    });
  });

  // ==========================================================================
  // Mapping Manipulation
  // ==========================================================================
  describe('Mapping Manipulation', () => {
    it('should duplicate mappings', () => {
      const { openFile, selectMappings, duplicateMappings } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 3) as any);

      selectMappings(fileId, [1, 2]);
      duplicateMappings(fileId);

      const file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices[0].mappings).toHaveLength(5);
      expect(file.selectedMappingIds.has(1)).toBe(false); // Duplicates selected, not originals
    });

    it('should delete mappings', () => {
      const { openFile, selectMappings, deleteMappings } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 5) as any);

      selectMappings(fileId, [1, 3, 5]);
      deleteMappings(fileId);

      const file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices[0].mappings).toHaveLength(2);
      expect(file.selectedMappingIds.size).toBe(0);
    });

    it('should delete specific mappings by ID', () => {
      const { openFile, deleteMappings } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 5) as any);

      deleteMappings(fileId, [2, 4]);

      expect(useTsiStore.getState().openFiles.get(fileId)!.devices[0].mappings).toHaveLength(3);
    });

    it('should move mappings to another device', () => {
      const { openFile, selectMappings, moveMappingsToDevice } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(2, 3) as any);

      selectMappings(fileId, [1, 2]);
      moveMappingsToDevice(fileId, 1);

      const file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices[0].mappings).toHaveLength(1);
      expect(file.devices[1].mappings).toHaveLength(5);
      expect(file.selectedDeviceIndex).toBe(1);
    });
  });

  // ==========================================================================
  // Undo/Redo
  // ==========================================================================
  describe('Undo/Redo', () => {
    it('should undo and redo mapping update', () => {
      const { openFile, updateMapping, undo, redo } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 3) as any);
      const getMapping = () =>
        (useTsiStore.getState().openFiles.get(fileId)!.devices[0].mappings as any[]).find(
          (m: any) => m.id === 1
        )!;

      const original = getMapping().comment;
      updateMapping(fileId, 1, { comment: 'Changed' });
      expect(getMapping().comment).toBe('Changed');

      undo(fileId);
      expect(getMapping().comment).toBe(original);

      redo(fileId);
      expect(getMapping().comment).toBe('Changed');
    });

    it('should undo paste and delete', () => {
      const { openFile, selectMappings, copyMappings, pasteMappings, deleteMappings, undo } =
        useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 3) as any);
      const getCount = () =>
        useTsiStore.getState().openFiles.get(fileId)!.devices[0].mappings.length;

      // Test paste undo
      selectMappings(fileId, [1, 2]);
      copyMappings(fileId);
      pasteMappings(fileId);
      expect(getCount()).toBe(5);
      undo(fileId);
      expect(getCount()).toBe(3);

      // Test delete undo
      selectMappings(fileId, [1, 2]);
      deleteMappings(fileId);
      expect(getCount()).toBe(1);
      undo(fileId);
      expect(getCount()).toBe(3);
    });

    it('should undo duplicate', () => {
      const { openFile, selectMappings, duplicateMappings, undo } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 3) as any);

      selectMappings(fileId, [1, 2]);
      duplicateMappings(fileId);
      expect(useTsiStore.getState().openFiles.get(fileId)!.devices[0].mappings).toHaveLength(5);

      undo(fileId);
      expect(useTsiStore.getState().openFiles.get(fileId)!.devices[0].mappings).toHaveLength(3);
    });
  });

  // ==========================================================================
  // Search and Filters
  // ==========================================================================
  describe('Search and Filters', () => {
    it('should set and clear search query', () => {
      const { openFile, setSearchQuery, clearFilters } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 3) as any);

      setSearchQuery(fileId, 'play');
      expect(useTsiStore.getState().openFiles.get(fileId)!.searchQuery).toBe('play');

      clearFilters(fileId);
      expect(useTsiStore.getState().openFiles.get(fileId)!.searchQuery).toBe('');
    });

    it('should set and merge filters', () => {
      const { openFile, setFilters, clearFilters } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 3) as any);

      setFilters(fileId, { hasConditions: true });
      setFilters(fileId, { hasMidiBinding: false });

      const filters = useTsiStore.getState().openFiles.get(fileId)!.filters;
      expect(filters.hasConditions).toBe(true);
      expect(filters.hasMidiBinding).toBe(false);

      clearFilters(fileId);
      expect(useTsiStore.getState().openFiles.get(fileId)!.filters).toEqual({});
    });
  });

  // ==========================================================================
  // Getters
  // ==========================================================================
  describe('Getters', () => {
    it('should get active file and file by ID', () => {
      const { openFile, getActiveFile, getFile } = useTsiStore.getState();

      expect(getActiveFile()).toBe(null);

      const fileId = openFile('/test.tsi', createMockTsiFile(1, 3) as any);
      expect(getActiveFile()?.id).toBe(fileId);
      expect(getFile(fileId)?.id).toBe(fileId);
    });

    it('should get selected device and mappings', () => {
      const { openFile, selectMappings, getSelectedDevice, getSelectedMappings } =
        useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(2, 5) as any);

      expect(getSelectedDevice(fileId)?.deviceType).toBe('Device 0');

      selectMappings(fileId, [1, 3, 5]);
      const mappings = getSelectedMappings(fileId);
      expect(mappings).toHaveLength(3);
      expect(mappings.map((m: any) => m.id)).toEqual([1, 3, 5]);
    });
  });

  // ==========================================================================
  // Device Manipulation (Phase 19: Settings implementation)
  // ==========================================================================
  describe('Device Manipulation', () => {
    it('should remove a device and adjust selection', () => {
      const { openFile, selectDevice, removeDevice } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(3, 2) as any);

      // Verify initial state
      let file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices).toHaveLength(3);
      expect(file.selectedDeviceIndex).toBe(0);

      // Select second device
      selectDevice(fileId, 1);
      file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.selectedDeviceIndex).toBe(1);

      // Remove selected device (index 1)
      removeDevice(fileId, 1);
      file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices).toHaveLength(2);
      expect(file.isDirty).toBe(true);
      // Selected should move to previous device (index 0)
      expect(file.selectedDeviceIndex).toBe(0);
      // Mappings selection should be cleared
      expect(file.selectedMappingIds.size).toBe(0);
    });

    it('should remove the first device and select the new first', () => {
      const { openFile, removeDevice } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(3, 2) as any);

      // Selection starts at 0
      let file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.selectedDeviceIndex).toBe(0);
      expect(file.devices[0].deviceType).toBe('Device 0');

      // Remove first device
      removeDevice(fileId, 0);
      file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices).toHaveLength(2);
      // Should stay at 0 (the new first device)
      expect(file.selectedDeviceIndex).toBe(0);
      expect(file.devices[0].deviceType).toBe('Device 1');
    });

    it('should set selection to null when removing the last device', () => {
      const { openFile, removeDevice } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(1, 2) as any);

      let file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices).toHaveLength(1);

      // Remove the only device
      removeDevice(fileId, 0);
      file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices).toHaveLength(0);
      expect(file.selectedDeviceIndex).toBe(null);
    });

    it('should adjust selection when removing device before selected', () => {
      const { openFile, selectDevice, removeDevice } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(4, 2) as any);

      // Select device 2 (index 2)
      selectDevice(fileId, 2);
      let file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.selectedDeviceIndex).toBe(2);

      // Remove device at index 0
      removeDevice(fileId, 0);
      file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices).toHaveLength(3);
      // Selection should decrease by 1
      expect(file.selectedDeviceIndex).toBe(1);
    });

    it('should not change selection when removing device after selected', () => {
      const { openFile, removeDevice } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(4, 2) as any);

      // Selection is at 0
      let file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.selectedDeviceIndex).toBe(0);

      // Remove device at index 2
      removeDevice(fileId, 2);
      file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices).toHaveLength(3);
      // Selection should stay at 0
      expect(file.selectedDeviceIndex).toBe(0);
    });

    it('should not remove device with invalid index', () => {
      const { openFile, removeDevice } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(2, 2) as any);

      let file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices).toHaveLength(2);

      // Try to remove with negative index
      removeDevice(fileId, -1);
      file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices).toHaveLength(2);

      // Try to remove with out-of-bounds index
      removeDevice(fileId, 5);
      file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices).toHaveLength(2);
    });

    it('should duplicate a device and select the copy', () => {
      const { openFile, duplicateDevice } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(2, 3) as any);

      let file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices).toHaveLength(2);

      // Duplicate device 0
      duplicateDevice(fileId, 0);
      file = useTsiStore.getState().openFiles.get(fileId)!;

      expect(file.devices).toHaveLength(3);
      expect(file.isDirty).toBe(true);
      // New device should be selected (index 1)
      expect(file.selectedDeviceIndex).toBe(1);
      // Mappings selection should be cleared
      expect(file.selectedMappingIds.size).toBe(0);
    });

    it('should not duplicate device with invalid index', () => {
      const { openFile, duplicateDevice } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(2, 2) as any);

      let file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices).toHaveLength(2);

      // Try to duplicate with negative index
      duplicateDevice(fileId, -1);
      file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices).toHaveLength(2);

      // Try to duplicate with out-of-bounds index
      duplicateDevice(fileId, 5);
      file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices).toHaveLength(2);
    });

    it('should rename a device via comment', () => {
      const { openFile, renameDevice } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(2, 2) as any);

      let file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices[0].comment).toBeUndefined();

      // Rename device 0
      renameDevice(fileId, 0, 'My Custom Device');
      file = useTsiStore.getState().openFiles.get(fileId)!;

      expect(file.devices[0].comment).toBe('My Custom Device');
      expect(file.isDirty).toBe(true);
    });

    it('should not rename device with invalid index', () => {
      const { openFile, renameDevice } = useTsiStore.getState();
      const fileId = openFile('/test.tsi', createMockTsiFile(2, 2) as any);

      let file = useTsiStore.getState().openFiles.get(fileId)!;
      const originalDevice0Comment = file.devices[0].comment;

      // Try to rename with negative index
      renameDevice(fileId, -1, 'Bad Name');
      file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices[0].comment).toBe(originalDevice0Comment);

      // Try to rename with out-of-bounds index
      renameDevice(fileId, 5, 'Bad Name');
      file = useTsiStore.getState().openFiles.get(fileId)!;
      expect(file.devices[0].comment).toBe(originalDevice0Comment);
    });
  });
});

/**
 * Device - High-level model for TSI devices
 *
 * AIDEV-NOTE: This provides a convenient object-oriented interface over DeviceData.
 * A Device represents a MIDI controller or keyboard in Traktor with:
 * - Device type (e.g., "Generic MIDI", "Traktor Kontrol S4 MK3")
 * - MIDI ports (in/out)
 * - Mappings (list of command bindings)
 * - MIDI definitions (for NI devices)
 *
 * This is the TypeScript equivalent of the C# Device class in cmdr.TsiLib/Device.cs
 *
 * Key concepts:
 * - Device wraps DeviceData (raw binary format)
 * - Mappings are stored as high-level Mapping objects
 * - MIDI bindings are resolved from the device's binding list and definitions
 */

import { DeviceTarget } from '../enums/index.js';
import type { DeviceData } from '../format/Device.js';
import { createDefaultDevice } from '../format/Device.js';
import type { DeviceDataData, MidiDefinitionData } from '../format/DeviceData.js';
import type { MidiNoteBindingData } from '../format/MidiNoteBinding.js';
import { INT32_MAX, MAX_BINDING_ID } from '../utils/constants.js';

import { Mapping, type MidiBinding, parseMidiNoteString } from './Mapping.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Generic MIDI device type string
 */
export const DEVICE_TYPE_GENERIC_MIDI = 'Generic MIDI';

/**
 * Generic Keyboard device type string
 */
export const DEVICE_TYPE_GENERIC_KEYBOARD = 'Generic Keyboard';

/**
 * List of proprietary (non-generic MIDI) device types
 * These devices have built-in mappings and special handling
 */
export const PROPRIETARY_DEVICE_TYPES = [
  'Traktor.Kontrol S4 MK3',
  'Traktor.Kontrol S2 MK3',
  'Traktor.Kontrol S3',
  'Traktor.Kontrol S8',
  'Traktor.Kontrol D2',
  'Pioneer.DDJ-T1',
  'Pioneer.DJM-T1',
  'Generic Keyboard',
] as const;

/**
 * Check if a device type is a generic MIDI device
 */
export function isGenericMidiDevice(deviceType: string): boolean {
  return !PROPRIETARY_DEVICE_TYPES.includes(
    deviceType as (typeof PROPRIETARY_DEVICE_TYPES)[number]
  );
}

// ============================================================================
// Device class
// ============================================================================

/**
 * High-level Device model
 *
 * Provides convenient access to device properties and mappings.
 * Wraps the raw DeviceData from the binary format.
 */
export class Device {
  private _rawData: DeviceData;
  private _mappings: Mapping[] = [];
  private _midiInDefinitions: Map<string, MidiDefinitionData> = new Map();
  private _midiOutDefinitions: Map<string, MidiDefinitionData> = new Map();

  /**
   * Internal ID used when device is added to TsiFile
   * Not persistent, just an enumeration index
   */
  id = -1;

  constructor(rawData: DeviceData) {
    this._rawData = rawData;
    this._initMappings();
    this._initMidiDefinitions();
  }

  // --------------------------------------------------------------------------
  // Static factory methods
  // --------------------------------------------------------------------------

  /**
   * Create a Device from raw data
   */
  static fromRawData(rawData: DeviceData): Device {
    return new Device(rawData);
  }

  /**
   * Create a new empty Device
   */
  static create(
    deviceType = DEVICE_TYPE_GENERIC_MIDI,
    traktorVersion = '',
    isKeyboard = false
  ): Device {
    return new Device(createDefaultDevice(deviceType, traktorVersion, isKeyboard));
  }

  /**
   * Create a new Generic MIDI device
   */
  static createGenericMidi(traktorVersion = ''): Device {
    return Device.create(DEVICE_TYPE_GENERIC_MIDI, traktorVersion, false);
  }

  /**
   * Create a new Keyboard device
   */
  static createKeyboard(traktorVersion = ''): Device {
    return Device.create(DEVICE_TYPE_GENERIC_KEYBOARD, traktorVersion, true);
  }

  // --------------------------------------------------------------------------
  // Basic properties
  // --------------------------------------------------------------------------

  /**
   * Get the raw device data (for serialization)
   */
  get rawData(): DeviceData {
    return this._rawData;
  }

  /**
   * Device type identifier string
   */
  get deviceType(): string {
    return this._rawData.deviceType;
  }

  set deviceType(value: string) {
    this._rawData.deviceType = value;
  }

  /**
   * Alias for deviceType
   */
  get typeStr(): string {
    return this._rawData.deviceType;
  }

  /**
   * Whether this is a keyboard device
   */
  get isKeyboard(): boolean {
    return this._rawData.isKeyboard;
  }

  set isKeyboard(value: boolean) {
    this._rawData.isKeyboard = value;
  }

  /**
   * Whether this is a generic MIDI device (not a proprietary NI device)
   */
  get isGenericMidi(): boolean {
    return isGenericMidiDevice(this._rawData.deviceType);
  }

  /**
   * Device target (Focus, Software, etc.)
   */
  get target(): DeviceTarget {
    return this._rawData.data.target.deviceTarget;
  }

  set target(value: DeviceTarget) {
    this._rawData.data.target.deviceTarget = value;
  }

  // --------------------------------------------------------------------------
  // Version info
  // --------------------------------------------------------------------------

  /**
   * Traktor version string (e.g., "3.11.0")
   */
  get traktorVersion(): string {
    return this._rawData.data.version.version;
  }

  set traktorVersion(value: string) {
    this._rawData.data.version.version = value;
  }

  /**
   * Mapping file revision number
   */
  get revision(): number {
    return this._rawData.data.version.mappingFileRevision;
  }

  /**
   * Increment the mapping file revision
   * AIDEV-NOTE: Uses INT32_MAX for wrapping to avoid overflow
   */
  incrementRevision(): void {
    this._rawData.data.version.mappingFileRevision =
      (this._rawData.data.version.mappingFileRevision + 1) % INT32_MAX;
  }

  // --------------------------------------------------------------------------
  // Comment
  // --------------------------------------------------------------------------

  /**
   * Device comment
   */
  get comment(): string {
    return this._rawData.data.comment ?? '';
  }

  set comment(value: string) {
    this._rawData.data.comment = value || undefined;
  }

  // --------------------------------------------------------------------------
  // Ports
  // --------------------------------------------------------------------------

  /**
   * MIDI input port name (empty string means "All Ports")
   */
  get inPort(): string {
    return this._rawData.data.ports.inPortName;
  }

  set inPort(value: string) {
    this._rawData.data.ports.inPortName = value;
  }

  /**
   * MIDI output port name (empty string means "All Ports")
   */
  get outPort(): string {
    return this._rawData.data.ports.outPortName;
  }

  set outPort(value: string) {
    this._rawData.data.ports.outPortName = value;
  }

  // --------------------------------------------------------------------------
  // Mappings
  // --------------------------------------------------------------------------

  /**
   * All mappings in this device
   */
  get mappings(): readonly Mapping[] {
    return this._mappings;
  }

  /**
   * Number of mappings
   */
  get mappingCount(): number {
    return this._mappings.length;
  }

  /**
   * Get a mapping by index
   */
  getMapping(index: number): Mapping | undefined {
    return this._mappings[index];
  }

  /**
   * Get a mapping by ID
   */
  getMappingById(id: number): Mapping | undefined {
    return this._mappings.find((m) => m.id === id);
  }

  /**
   * Add a mapping to the device
   */
  addMapping(mapping: Mapping): void {
    this._insertMapping(this._mappings.length, mapping, false);
  }

  /**
   * Insert a mapping at a specific index
   */
  insertMapping(index: number, mapping: Mapping): void {
    this._insertMapping(index, mapping, false);
  }

  /**
   * Remove a mapping by ID
   */
  removeMapping(id: number): boolean {
    const index = this._mappings.findIndex((m) => m.id === id);
    if (index === -1) return false;
    this._removeMapping(index, false);
    return true;
  }

  /**
   * Remove a mapping by index
   */
  removeMappingAt(index: number): boolean {
    if (index < 0 || index >= this._mappings.length) return false;
    this._removeMapping(index, false);
    return true;
  }

  /**
   * Move a mapping from one index to another
   */
  moveMapping(fromIndex: number, toIndex: number): boolean {
    if (fromIndex < 0 || fromIndex >= this._mappings.length) return false;
    if (toIndex < 0 || toIndex > this._mappings.length) return false;

    const mapping = this._mappings[fromIndex];
    if (!mapping) return false;

    this._removeMapping(fromIndex, true);
    this._insertMapping(toIndex, mapping, true);
    return true;
  }

  /**
   * Create a new mapping with the given command
   */
  createMapping(commandId: number): Mapping {
    return Mapping.create(undefined, commandId);
  }

  // --------------------------------------------------------------------------
  // MIDI Definitions
  // --------------------------------------------------------------------------

  /**
   * MIDI input definitions (for NI devices)
   */
  get midiInDefinitions(): ReadonlyMap<string, MidiDefinitionData> {
    return this._midiInDefinitions;
  }

  /**
   * MIDI output definitions (for NI devices)
   */
  get midiOutDefinitions(): ReadonlyMap<string, MidiDefinitionData> {
    return this._midiOutDefinitions;
  }

  /**
   * Get MIDI definition by note string
   */
  getMidiDefinition(note: string, isOutput: boolean): MidiDefinitionData | undefined {
    return isOutput ? this._midiOutDefinitions.get(note) : this._midiInDefinitions.get(note);
  }

  // --------------------------------------------------------------------------
  // Copy
  // --------------------------------------------------------------------------

  /**
   * Create a deep copy of this device
   * @param includeMappings Whether to copy mappings
   */
  copy(includeMappings = true): Device {
    // Deep copy device data
    const copiedData = this._deepCopyDeviceData();

    // Reset revision for the copy
    copiedData.data.version.mappingFileRevision = 0;

    if (!includeMappings) {
      // Clear mappings
      copiedData.data.mappings = {
        mappings: [],
        midiBindings: [],
      };
    }

    const copy = new Device(copiedData);
    copy.id = -1;
    return copy;
  }

  // --------------------------------------------------------------------------
  // Sync to raw data
  // --------------------------------------------------------------------------

  /**
   * Sync high-level mappings back to raw data
   * Call this before serialization
   */
  syncToRawData(): void {
    // Ensure mappings container exists
    if (!this._rawData.data.mappings) {
      this._rawData.data.mappings = {
        mappings: [],
        midiBindings: [],
      };
    }

    // Update raw mappings from high-level Mapping objects
    this._rawData.data.mappings.mappings = this._mappings.map((m) => m.rawData);
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private _initMappings(): void {
    this._mappings = [];

    const mappingsData = this._rawData.data.mappings;
    if (!mappingsData?.mappings) return;

    // Create Mapping objects and resolve MIDI bindings
    for (const rawMapping of mappingsData.mappings) {
      const mapping = new Mapping(rawMapping);

      // Resolve MIDI binding
      if (rawMapping.midiNoteBindingId >= 0) {
        const binding = this._resolveBinding(
          rawMapping.midiNoteBindingId,
          mappingsData.midiBindings
        );
        mapping.setMidiBinding(binding);
      }

      this._mappings.push(mapping);
    }
  }

  private _initMidiDefinitions(): void {
    this._midiInDefinitions.clear();
    this._midiOutDefinitions.clear();

    const defs = this._rawData.data.midiDefinitions;
    if (!defs) return;

    for (const def of defs.inDefinitions) {
      this._midiInDefinitions.set(def.midiNote, def);
    }

    for (const def of defs.outDefinitions) {
      this._midiOutDefinitions.set(def.midiNote, def);
    }
  }

  private _resolveBinding(bindingId: number, bindings: MidiNoteBindingData[]): MidiBinding | null {
    const binding = bindings.find((b) => b.bindingId === bindingId);
    if (!binding) return null;

    return parseMidiNoteString(binding.midiNote);
  }

  private _insertMapping(index: number, mapping: Mapping, asIs: boolean): void {
    // Ensure mappings container exists
    if (!this._rawData.data.mappings) {
      this._rawData.data.mappings = {
        mappings: [],
        midiBindings: [],
      };
    }

    if (!asIs) {
      // Assign a new binding ID
      mapping.rawData.midiNoteBindingId = this._createNewBindingId();
    }

    // Add to high-level list
    if (index >= this._mappings.length) {
      this._mappings.push(mapping);
      this._rawData.data.mappings.mappings.push(mapping.rawData);
    } else {
      this._mappings.splice(index, 0, mapping);
      this._rawData.data.mappings.mappings.splice(index, 0, mapping.rawData);
    }
  }

  private _removeMapping(index: number, keepBinding: boolean): void {
    const mapping = this._mappings[index];
    if (!mapping) return;

    // Remove from high-level list
    this._mappings.splice(index, 1);

    // Remove from raw data
    if (this._rawData.data.mappings) {
      this._rawData.data.mappings.mappings.splice(index, 1);

      // Remove binding if requested
      if (!keepBinding && mapping.midiNoteBindingId >= 0) {
        const bindings = this._rawData.data.mappings.midiBindings;
        const bindingIndex = bindings.findIndex((b) => b.bindingId === mapping.midiNoteBindingId);
        if (bindingIndex >= 0) {
          bindings.splice(bindingIndex, 1);
        }
      }
    }
  }

  private _createNewBindingId(): number {
    const mappings = this._rawData.data.mappings?.mappings ?? [];
    if (mappings.length === 0) return 1;

    const maxId = Math.max(...mappings.map((m) => m.midiNoteBindingId));
    if (maxId < MAX_BINDING_ID) return maxId + 1;

    // Search for first unused ID
    // AIDEV-NOTE: INT32_MAX is the upper bound for valid binding IDs
    for (let i = 1; i < INT32_MAX; i++) {
      if (!mappings.some((m) => m.midiNoteBindingId === i)) {
        return i;
      }
    }

    throw new Error('No available binding IDs');
  }

  private _deepCopyDeviceData(): DeviceData {
    // AIDEV-NOTE: Simple deep copy via JSON for now
    // For binary-perfect copies, would need structured clone
    const data = this._rawData.data;

    const copiedDeviceData: DeviceDataData = {
      target: { ...data.target },
      version: { ...data.version },
      comment: data.comment,
      ports: { ...data.ports },
    };

    // Copy MIDI definitions
    if (data.midiDefinitions) {
      copiedDeviceData.midiDefinitions = {
        inDefinitions: data.midiDefinitions.inDefinitions.map((d) => ({
          ...d,
        })),
        outDefinitions: data.midiDefinitions.outDefinitions.map((d) => ({
          ...d,
        })),
      };
    }

    // Copy mappings
    if (data.mappings) {
      copiedDeviceData.mappings = {
        mappings: data.mappings.mappings.map((m) => ({
          ...m,
          settings: {
            ...m.settings,
            setValueTo: new Uint8Array(m.settings.setValueTo),
            conditionOneValue: new Uint8Array(m.settings.conditionOneValue),
            conditionTwoValue: new Uint8Array(m.settings.conditionTwoValue),
            ledMinControllerRange: new Uint8Array(m.settings.ledMinControllerRange),
            ledMaxControllerRange: new Uint8Array(m.settings.ledMaxControllerRange),
          },
        })),
        midiBindings: data.mappings.midiBindings.map((b) => ({ ...b })),
      };
    }

    // Copy DVST
    if (data.dvst) {
      copiedDeviceData.dvst = { ...data.dvst };
    }

    return {
      deviceType: this._rawData.deviceType,
      isKeyboard: this._rawData.isKeyboard,
      data: copiedDeviceData,
    };
  }
}

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Get a human-readable device type name
 */
export function getDeviceTypeName(deviceType: string): string {
  if (deviceType === DEVICE_TYPE_GENERIC_MIDI) return 'Generic MIDI';
  if (deviceType === DEVICE_TYPE_GENERIC_KEYBOARD) return 'Generic Keyboard';

  // Clean up NI device names (e.g., "Traktor.Kontrol S4 MK3" -> "Kontrol S4 MK3")
  if (deviceType.startsWith('Traktor.')) {
    return deviceType.substring(8);
  }
  if (deviceType.startsWith('Pioneer.')) {
    return deviceType.substring(8);
  }

  return deviceType;
}

/**
 * Get device target name
 */
export function getDeviceTargetName(target: DeviceTarget): string {
  switch (target) {
    case DeviceTarget.None:
      return 'None';
    case DeviceTarget.FocusedDeck:
      return 'Focused Deck';
    default:
      return `Unknown (${target})`;
  }
}

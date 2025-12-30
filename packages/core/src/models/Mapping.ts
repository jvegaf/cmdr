/**
 * Mapping - High-level model for TSI mappings
 *
 * AIDEV-NOTE: This provides a convenient object-oriented interface over MappingData.
 * A Mapping represents a single MIDI control → Traktor command binding with:
 * - Command: What Traktor action is triggered (e.g., Play, Cue, Loop)
 * - Conditions: Up to 2 conditions that must be met for the mapping to activate
 * - MIDI Binding: The MIDI note/CC that triggers this mapping
 * - Settings: Control type, interaction mode, value settings, etc.
 *
 * This is the TypeScript equivalent of the C# Mapping class in cmdr.TsiLib/Mapping.cs
 */

import type { CommandDescription } from '../commands/command-description.js';
import { getCommandDescriptionOrUnknown } from '../commands/command-metadata.js';
import type { ConditionDescription } from '../conditions/condition-description.js';
import { getConditionDescriptionOrUnknown } from '../conditions/condition-metadata.js';
import {
  type MappingControlType,
  type MappingInteractionMode,
  MappingTargetDeck,
  MappingType,
} from '../enums/index.js';
import type { MappingData } from '../format/Mapping.js';
import { createDefaultMapping } from '../format/Mapping.js';
import type { MappingSettingsData } from '../format/MappingSettings.js';

// ============================================================================
// Condition interfaces
// ============================================================================

/**
 * Represents a condition on a mapping
 * A mapping can have up to 2 conditions
 */
export interface MappingCondition {
  /**
   * Condition ID (0 = no condition)
   */
  id: number;

  /**
   * Target deck for the condition (which deck's state to check)
   */
  target: MappingTargetDeck;

  /**
   * Condition value as raw bytes
   * AIDEV-NOTE: Value interpretation depends on condition type
   */
  rawValue: Uint8Array;

  /**
   * Condition metadata (name, category, value type, etc.)
   */
  description: ConditionDescription | null;
}

// ============================================================================
// MIDI Binding interfaces
// ============================================================================

/**
 * Represents a MIDI binding for a mapping
 * This is resolved from MidiNoteBinding using the device's MIDI definitions
 */
export interface MidiBinding {
  /**
   * MIDI note string (e.g., "CC.00.001" = CC #1 on channel 0)
   */
  note: string;

  /**
   * Channel number (0-15)
   */
  channel: number;

  /**
   * Note/CC number (0-127)
   */
  noteNumber: number;

  /**
   * Whether this is a CC (true) or Note (false)
   */
  isCC: boolean;
}

// ============================================================================
// Mapping class
// ============================================================================

/**
 * High-level Mapping model
 *
 * Provides convenient access to mapping properties and related metadata.
 * Wraps the raw MappingData from the binary format.
 */
export class Mapping {
  private _rawData: MappingData;
  private _commandDescription: CommandDescription;
  private _condition1: MappingCondition | null = null;
  private _condition2: MappingCondition | null = null;
  private _midiBinding: MidiBinding | null = null;

  constructor(rawData: MappingData) {
    this._rawData = rawData;
    this._commandDescription = getCommandDescriptionOrUnknown(rawData.traktorControlId);
    this._initConditions();
  }

  // --------------------------------------------------------------------------
  // Static factory methods
  // --------------------------------------------------------------------------

  /**
   * Create a new Mapping from raw data
   */
  static fromRawData(rawData: MappingData): Mapping {
    return new Mapping(rawData);
  }

  /**
   * Create a new empty Mapping with default settings
   */
  static create(type: MappingType = MappingType.In, commandId = 0): Mapping {
    return new Mapping(createDefaultMapping(type, commandId));
  }

  // --------------------------------------------------------------------------
  // Basic properties
  // --------------------------------------------------------------------------

  /**
   * Get the raw mapping data (for serialization)
   */
  get rawData(): MappingData {
    return this._rawData;
  }

  /**
   * Mapping ID (used to link to MIDI binding)
   */
  get id(): number {
    return this._rawData.midiNoteBindingId;
  }

  /**
   * Mapping type: In (controller → Traktor) or Out (Traktor → LED)
   */
  get type(): MappingType {
    return this._rawData.type;
  }

  /**
   * Whether this is an input mapping
   */
  get isInput(): boolean {
    return this._rawData.type === MappingType.In;
  }

  /**
   * Whether this is an output (LED) mapping
   */
  get isOutput(): boolean {
    return this._rawData.type === MappingType.Out;
  }

  /**
   * Traktor command ID
   */
  get commandId(): number {
    return this._rawData.traktorControlId;
  }

  set commandId(value: number) {
    this._rawData.traktorControlId = value;
    this._commandDescription = getCommandDescriptionOrUnknown(value);
  }

  // --------------------------------------------------------------------------
  // Command
  // --------------------------------------------------------------------------

  /**
   * Command description with metadata (name, category, etc.)
   */
  get command(): CommandDescription {
    return this._commandDescription;
  }

  /**
   * Command name
   */
  get commandName(): string {
    return this._commandDescription.name;
  }

  // --------------------------------------------------------------------------
  // Comment
  // --------------------------------------------------------------------------

  /**
   * User comment for this mapping
   */
  get comment(): string {
    return this._rawData.settings.comment;
  }

  set comment(value: string) {
    this._rawData.settings.comment = value;
  }

  // --------------------------------------------------------------------------
  // Control type and interaction
  // --------------------------------------------------------------------------

  /**
   * Control type (Button, Fader, Encoder, LED)
   */
  get controlType(): MappingControlType {
    return this._rawData.settings.controlType;
  }

  set controlType(value: MappingControlType) {
    this._rawData.settings.controlType = value;
  }

  /**
   * Interaction mode (Trigger, Toggle, Hold, Direct, etc.)
   */
  get interactionMode(): MappingInteractionMode {
    return this._rawData.settings.interactionMode;
  }

  set interactionMode(value: MappingInteractionMode) {
    this._rawData.settings.interactionMode = value;
  }

  /**
   * Target deck assignment
   */
  get target(): MappingTargetDeck {
    return this._rawData.settings.target;
  }

  set target(value: MappingTargetDeck) {
    this._rawData.settings.target = value;
  }

  // --------------------------------------------------------------------------
  // Settings access
  // --------------------------------------------------------------------------

  /**
   * Get raw mapping settings (for advanced access)
   */
  get settings(): MappingSettingsData {
    return this._rawData.settings;
  }

  /**
   * Auto-repeat enabled
   */
  get autoRepeat(): boolean {
    return this._rawData.settings.autoRepeat;
  }

  set autoRepeat(value: boolean) {
    this._rawData.settings.autoRepeat = value;
  }

  /**
   * Invert enabled
   */
  get invert(): boolean {
    return this._rawData.settings.invert;
  }

  set invert(value: boolean) {
    this._rawData.settings.invert = value;
  }

  /**
   * Soft takeover enabled
   */
  get softTakeover(): boolean {
    return this._rawData.settings.softTakeover;
  }

  set softTakeover(value: boolean) {
    this._rawData.settings.softTakeover = value;
  }

  /**
   * LED blend enabled (for Out mappings)
   */
  get ledBlend(): boolean {
    return this._rawData.settings.ledBlend ?? false;
  }

  // --------------------------------------------------------------------------
  // Conditions
  // --------------------------------------------------------------------------

  /**
   * First condition (or null if none)
   */
  get condition1(): MappingCondition | null {
    return this._condition1;
  }

  /**
   * Second condition (or null if none)
   */
  get condition2(): MappingCondition | null {
    return this._condition2;
  }

  /**
   * Whether this mapping has any conditions
   */
  get hasConditions(): boolean {
    return this._condition1 !== null || this._condition2 !== null;
  }

  /**
   * Set condition 1
   * @param id Condition ID (0 to clear)
   * @param target Target deck
   * @param value Raw value bytes
   */
  setCondition1(
    id: number,
    target: MappingTargetDeck = MappingTargetDeck.DeviceTarget,
    value?: Uint8Array
  ): void {
    this._rawData.settings.conditionOneId = id;
    this._rawData.settings.conditionOneTarget = target;
    if (value) {
      this._rawData.settings.conditionOneValue = value;
    }
    this._initCondition1();
  }

  /**
   * Set condition 2
   * @param id Condition ID (0 to clear)
   * @param target Target deck
   * @param value Raw value bytes
   */
  setCondition2(
    id: number,
    target: MappingTargetDeck = MappingTargetDeck.DeviceTarget,
    value?: Uint8Array
  ): void {
    this._rawData.settings.conditionTwoId = id;
    this._rawData.settings.conditionTwoTarget = target;
    if (value) {
      this._rawData.settings.conditionTwoValue = value;
    }
    this._initCondition2();
  }

  /**
   * Clear condition 1
   */
  clearCondition1(): void {
    this.setCondition1(0);
  }

  /**
   * Clear condition 2
   */
  clearCondition2(): void {
    this.setCondition2(0);
  }

  /**
   * Clear both conditions
   */
  clearConditions(): void {
    this.clearCondition1();
    this.clearCondition2();
  }

  // --------------------------------------------------------------------------
  // MIDI Binding
  // --------------------------------------------------------------------------

  /**
   * MIDI binding (or null if not bound)
   * AIDEV-NOTE: This is resolved externally by the Device since bindings are stored at device level
   */
  get midiBinding(): MidiBinding | null {
    return this._midiBinding;
  }

  /**
   * Set MIDI binding (resolved from device's MIDI definitions)
   * This is called by Device when resolving bindings
   * @internal
   */
  setMidiBinding(binding: MidiBinding | null): void {
    this._midiBinding = binding;
  }

  /**
   * Whether this mapping has a MIDI binding
   */
  get hasMidiBinding(): boolean {
    return this._rawData.midiNoteBindingId >= 0 && this._midiBinding !== null;
  }

  /**
   * MIDI note binding ID (-1 if no binding)
   */
  get midiNoteBindingId(): number {
    return this._rawData.midiNoteBindingId;
  }

  // --------------------------------------------------------------------------
  // Copy
  // --------------------------------------------------------------------------

  /**
   * Create a deep copy of this mapping
   * @param includeMidiBinding Whether to keep the MIDI binding reference
   */
  copy(includeMidiBinding = false): Mapping {
    // Deep copy the raw data
    const copiedSettings: MappingSettingsData = {
      ...this._rawData.settings,
      setValueTo: new Uint8Array(this._rawData.settings.setValueTo),
      conditionOneValue: new Uint8Array(this._rawData.settings.conditionOneValue),
      conditionTwoValue: new Uint8Array(this._rawData.settings.conditionTwoValue),
      ledMinControllerRange: new Uint8Array(this._rawData.settings.ledMinControllerRange),
      ledMaxControllerRange: new Uint8Array(this._rawData.settings.ledMaxControllerRange),
    };

    const copiedData: MappingData = {
      midiNoteBindingId: includeMidiBinding ? this._rawData.midiNoteBindingId : -1,
      type: this._rawData.type,
      traktorControlId: this._rawData.traktorControlId,
      settings: copiedSettings,
    };

    const copy = new Mapping(copiedData);
    if (includeMidiBinding) {
      copy._midiBinding = this._midiBinding;
    }
    return copy;
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private _initConditions(): void {
    this._initCondition1();
    this._initCondition2();
  }

  private _initCondition1(): void {
    const id = this._rawData.settings.conditionOneId;
    if (id > 0) {
      this._condition1 = {
        id,
        target: this._rawData.settings.conditionOneTarget,
        rawValue: this._rawData.settings.conditionOneValue,
        description: getConditionDescriptionOrUnknown(id),
      };
    } else {
      this._condition1 = null;
    }
  }

  private _initCondition2(): void {
    const id = this._rawData.settings.conditionTwoId;
    if (id > 0) {
      this._condition2 = {
        id,
        target: this._rawData.settings.conditionTwoTarget,
        rawValue: this._rawData.settings.conditionTwoValue,
        description: getConditionDescriptionOrUnknown(id),
      };
    } else {
      this._condition2 = null;
    }
  }
}

// ============================================================================
// Helper functions
// ============================================================================

/**
 * MIDI channel range constants
 * AIDEV-NOTE: Exported for use by @cmdr/midi package
 */
export const MIDI_CHANNEL_MIN = 0;
export const MIDI_CHANNEL_MAX = 15;
export const MIDI_NOTE_MIN = 0;
export const MIDI_NOTE_MAX = 127;

/**
 * Parse MIDI note string to extract components
 * Format: "CC.XX.YYY" or "Note.XX.YYY" where XX=channel (0-15), YYY=note/cc number (0-127)
 *
 * AIDEV-NOTE: This is the canonical implementation. The @cmdr/midi package
 * re-exports this function to avoid duplication.
 *
 * @param noteString MIDI note string like "CC.00.001" or "Note.00.060"
 * @returns MidiBinding object or null if parsing fails
 *
 * @example
 * parseMidiNoteString("CC.00.001")  // { note: "CC.00.001", channel: 0, noteNumber: 1, isCC: true }
 * parseMidiNoteString("Note.00.060")  // { note: "Note.00.060", channel: 0, noteNumber: 60, isCC: false }
 * parseMidiNoteString("invalid")  // null
 */
export function parseMidiNoteString(noteString: string): MidiBinding | null {
  if (!noteString) return null;

  const parts = noteString.split('.');
  if (parts.length !== 3) return null;

  const [typeStr, channelStr, noteStr] = parts;
  if (!typeStr || !channelStr || !noteStr) return null;

  // Validate type prefix
  const typeLower = typeStr.toLowerCase();
  if (typeLower !== 'cc' && typeLower !== 'note') return null;

  const isCC = typeLower === 'cc';
  const channel = parseInt(channelStr, 10);
  const noteNumber = parseInt(noteStr, 10);

  // Validate parsed numbers
  if (Number.isNaN(channel) || Number.isNaN(noteNumber)) return null;

  // Validate MIDI ranges
  if (channel < MIDI_CHANNEL_MIN || channel > MIDI_CHANNEL_MAX) return null;
  if (noteNumber < MIDI_NOTE_MIN || noteNumber > MIDI_NOTE_MAX) return null;

  return {
    note: noteString,
    channel,
    noteNumber,
    isCC,
  };
}

/**
 * Create MIDI note string from components
 */
export function createMidiNoteString(isCC: boolean, channel: number, noteNumber: number): string {
  const type = isCC ? 'CC' : 'Note';
  const channelStr = channel.toString().padStart(2, '0');
  const noteStr = noteNumber.toString().padStart(3, '0');
  return `${type}.${channelStr}.${noteStr}`;
}

// Re-export from controls for convenience
export { getControlTypeName, getInteractionModeName } from '../controls/control.js';

/**
 * Get human-readable target deck name
 */
export function getTargetDeckName(target: MappingTargetDeck): string {
  switch (target) {
    case MappingTargetDeck.DeviceTarget:
      return 'Device Target';
    case MappingTargetDeck.DeckA:
      return 'Deck A';
    case MappingTargetDeck.DeckB:
      return 'Deck B';
    case MappingTargetDeck.DeckC:
      return 'Deck C';
    case MappingTargetDeck.DeckD:
      return 'Deck D';
    case MappingTargetDeck.DeckFocusedSlotLeft:
      return 'Focused Slot Left';
    case MappingTargetDeck.DeckFocusedSlotRight:
      return 'Focused Slot Right';
    default:
      return `Unknown (${target})`;
  }
}

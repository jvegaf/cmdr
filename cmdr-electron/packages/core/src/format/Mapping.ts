/**
 * Mapping - Parse CMAI frame data
 *
 * AIDEV-NOTE: This is the TypeScript equivalent of Mapping.cs.
 * A mapping links a Traktor control (command) to MIDI settings.
 * Each mapping has:
 * - MidiNoteBindingId: Links to MidiNoteBinding in the DCBM list (-1 if unassigned)
 * - Type: In (controller→Traktor) or Out (Traktor→controller LED)
 * - TraktorControlId: ID of the command in Traktor's command list
 * - Settings: The MappingSettings (CMAD frame) with all configuration
 */

import type { BinaryReader } from '../binary/BinaryReader.js';
import type { BinaryWriter } from '../binary/BinaryWriter.js';
import {
  MappingControlType,
  MappingInteractionMode,
  MappingType,
} from '../enums/index.js';
import { Frame } from './Frame.js';
import {
  createDefaultMappingSettings,
  MAPPING_SETTINGS_FRAME_ID,
  type MappingSettingsData,
  parseMappingSettings,
  writeMappingSettings,
} from './MappingSettings.js';

/**
 * Frame ID for Mapping
 */
export const MAPPING_FRAME_ID = 'CMAI';

/**
 * Data structure for Mapping
 */
export interface MappingData {
  /**
   * ID linking this mapping to its MIDI binding.
   * -1 means no MIDI binding assigned.
   * In Traktor's Controller Manager, IDs start at 1.
   */
  midiNoteBindingId: number;

  /**
   * In = input from controller (button/fader/encoder)
   * Out = output to controller (LED)
   */
  type: MappingType;

  /**
   * Traktor command ID (e.g., Play, Cue, Sync, etc.)
   */
  traktorControlId: number;

  /**
   * All mapping configuration settings
   */
  settings: MappingSettingsData;
}

/**
 * Create default Mapping data
 */
export function createDefaultMapping(
  type: MappingType = MappingType.In,
  traktorControlId = 0
): MappingData {
  return {
    midiNoteBindingId: -1,
    type,
    traktorControlId,
    settings: createDefaultMappingSettings(),
  };
}

/**
 * Parse Mapping from a BinaryReader
 * Reader should be positioned at start of CMAI frame data (after header)
 */
export function parseMapping(reader: BinaryReader): MappingData {
  const midiNoteBindingId = reader.readInt32();
  const type = reader.readInt32() as MappingType;
  const traktorControlId = reader.readInt32();

  // Read the nested CMAD frame
  const settingsHeader = Frame.readHeader(reader);
  if (settingsHeader.fourCC !== MAPPING_SETTINGS_FRAME_ID) {
    throw new Error(`Expected CMAD frame inside CMAI, got ${settingsHeader.fourCC}`);
  }

  const settingsReader = reader.slice(settingsHeader.size);
  const settings = parseMappingSettings(settingsReader);

  // AIDEV-NOTE: Special handling for Out mappings with Button control type
  // They should be treated as LEDs with Output interaction mode
  if (type === MappingType.Out && settings.controlType === MappingControlType.Button) {
    settings.controlType = MappingControlType.LED;
    settings.interactionMode = MappingInteractionMode.Output;
  }

  return {
    midiNoteBindingId,
    type,
    traktorControlId,
    settings,
  };
}

/**
 * Parse Mapping from a Frame
 */
export function parseMappingFromFrame(frame: Frame): MappingData {
  if (frame.fourCC !== MAPPING_FRAME_ID) {
    throw new Error(`Expected CMAI frame, got ${frame.fourCC}`);
  }
  return parseMapping(frame.getReader());
}

/**
 * Write Mapping to a BinaryWriter
 */
export function writeMapping(writer: BinaryWriter, data: MappingData): void {
  writer.writeInt32(data.midiNoteBindingId);
  writer.writeInt32(data.type);
  writer.writeInt32(data.traktorControlId);

  // Write the nested CMAD frame
  const settingsFrame = Frame.create(MAPPING_SETTINGS_FRAME_ID, (settingsWriter) => {
    writeMappingSettings(settingsWriter, data.settings);
  });
  settingsFrame.writeTo(writer);
}

/**
 * Create a CMAI frame from Mapping data
 */
export function createMappingFrame(data: MappingData): Frame {
  return Frame.create(MAPPING_FRAME_ID, (writer) => {
    writeMapping(writer, data);
  });
}

/**
 * MappingSettings - Parse CMAD frame data
 *
 * AIDEV-NOTE: This is the TypeScript equivalent of MappingSettings.cs.
 * This is the most complex frame in the TSI format, containing all
 * the configuration for a single mapping (command settings, conditions, etc.)
 *
 * The structure has conditional fields based on DeviceType:
 * - ProprietarySynth (1): Base fields only
 * - ProprietaryAudio (2): Base + LedInvert/LedBlend
 * - ProprietaryController (3): Base + LedInvert/LedBlend + Resolution
 * - GenericMidi (4): Base + LedInvert/LedBlend + Resolution + UseFactoryMap
 */

import type { BinaryReader } from '../binary/BinaryReader.js';
import type { BinaryWriter } from '../binary/BinaryWriter.js';
import {
  DeviceType,
  MappingControlType,
  MappingInteractionMode,
  MappingResolution,
  MappingTargetDeck,
  MidiEncoderMode,
  ValueUIType,
} from '../enums/index.js';
import { Frame } from './Frame.js';

/**
 * Frame ID for MappingSettings
 */
export const MAPPING_SETTINGS_FRAME_ID = 'CMAD';

/**
 * Data structure for MappingSettings
 */
export interface MappingSettingsData {
  // Device type determines which optional fields are present
  deviceType: DeviceType;

  // Command settings
  controlType: MappingControlType;
  interactionMode: MappingInteractionMode;
  target: MappingTargetDeck;
  autoRepeat: boolean;
  invert: boolean;
  softTakeover: boolean;

  // Rotary settings (for encoders)
  rotarySensitivity: number; // 1% in UI = 0.5f, default 5f for Direct mode = 300%
  rotaryAcceleration: number; // 0.0 - 1.0

  // Encoder mode (for MIDI encoders)
  encoderMode: MidiEncoderMode;

  // Value settings
  hasValueUI: boolean;
  valueUIType: ValueUIType;
  setValueTo: Uint8Array; // 4 bytes, interpretation depends on valueUIType

  // Comment
  comment: string;

  // Condition 1
  conditionOneId: number;
  conditionOneTarget: MappingTargetDeck;
  conditionOneValue: Uint8Array; // 4 bytes

  // Condition 2
  conditionTwoId: number;
  conditionTwoTarget: MappingTargetDeck;
  conditionTwoValue: Uint8Array; // 4 bytes

  // LED controller range (for Out mappings)
  ledMinControllerRangeType: ValueUIType;
  ledMinControllerRange: Uint8Array; // 4 bytes
  ledMaxControllerRangeType: ValueUIType;
  ledMaxControllerRange: Uint8Array; // 4 bytes

  // LED MIDI range
  ledMinMidiRange: number;
  ledMaxMidiRange: number;

  // Optional fields (presence depends on deviceType)
  ledInvert?: boolean;
  ledBlend?: boolean;
  unknownValueUIType?: ValueUIType;
  resolution?: MappingResolution;
  useFactoryMap?: boolean;
}

/**
 * Create default MappingSettings data
 */
export function createDefaultMappingSettings(): MappingSettingsData {
  return {
    deviceType: DeviceType.GenericMidi,
    controlType: MappingControlType.Button,
    interactionMode: MappingInteractionMode.Trigger,
    target: MappingTargetDeck.DeviceTarget,
    autoRepeat: false,
    invert: false,
    softTakeover: false,
    rotarySensitivity: 5.0,
    rotaryAcceleration: 0.0,
    encoderMode: MidiEncoderMode.ThreeFhTwosComplement,
    hasValueUI: false,
    valueUIType: ValueUIType.ComboBox,
    setValueTo: new Uint8Array(4),
    comment: '',
    conditionOneId: 0,
    conditionOneTarget: MappingTargetDeck.DeviceTarget,
    conditionOneValue: new Uint8Array(4),
    conditionTwoId: 0,
    conditionTwoTarget: MappingTargetDeck.DeviceTarget,
    conditionTwoValue: new Uint8Array(4),
    ledMinControllerRangeType: ValueUIType.ComboBox,
    ledMinControllerRange: new Uint8Array(4),
    ledMaxControllerRangeType: ValueUIType.ComboBox,
    ledMaxControllerRange: new Uint8Array(4),
    ledMinMidiRange: 0,
    ledMaxMidiRange: 127,
    ledInvert: false,
    ledBlend: false,
    resolution: MappingResolution.Default,
    useFactoryMap: false,
  };
}

/**
 * Parse MappingSettings from a BinaryReader
 * Reader should be positioned at start of CMAD frame data (after header)
 */
export function parseMappingSettings(reader: BinaryReader): MappingSettingsData {
  const deviceType = reader.readInt32() as DeviceType;
  const controlType = reader.readInt32() as MappingControlType;
  const interactionMode = reader.readInt32() as MappingInteractionMode;
  const target = reader.readInt32() as MappingTargetDeck;
  const autoRepeat = reader.readBoolean();
  const invert = reader.readBoolean();
  const softTakeover = reader.readBoolean();
  const rotarySensitivity = reader.readFloat();
  const rotaryAcceleration = reader.readFloat();

  const hasValueUI = reader.readBoolean();
  const valueUIType = reader.readInt32() as ValueUIType;
  const setValueTo = reader.readBytes(4);

  const comment = reader.readWideString();

  const conditionOneId = reader.readInt32();
  const conditionOneTarget = reader.readInt32() as MappingTargetDeck;
  const conditionOneValue = reader.readBytes(4);
  const conditionTwoId = reader.readInt32();
  const conditionTwoTarget = reader.readInt32() as MappingTargetDeck;
  const conditionTwoValue = reader.readBytes(4);

  const ledMinControllerRangeType = reader.readInt32() as ValueUIType;
  const ledMinControllerRange = reader.readBytes(4);
  const ledMaxControllerRangeType = reader.readInt32() as ValueUIType;
  const ledMaxControllerRange = reader.readBytes(4);

  const ledMinMidiRange = reader.readInt32();
  const ledMaxMidiRange = reader.readInt32();

  const data: MappingSettingsData = {
    deviceType,
    controlType,
    interactionMode,
    target,
    autoRepeat,
    invert,
    softTakeover,
    rotarySensitivity,
    rotaryAcceleration,
    encoderMode: MidiEncoderMode.ThreeFhTwosComplement, // AIDEV-NOTE: Not present in binary, derived elsewhere
    hasValueUI,
    valueUIType,
    setValueTo,
    comment,
    conditionOneId,
    conditionOneTarget,
    conditionOneValue,
    conditionTwoId,
    conditionTwoTarget,
    conditionTwoValue,
    ledMinControllerRangeType,
    ledMinControllerRange,
    ledMaxControllerRangeType,
    ledMaxControllerRange,
    ledMinMidiRange,
    ledMaxMidiRange,
  };

  // Conditional fields based on device type
  if (deviceType !== DeviceType.ProprietarySynth) {
    data.ledInvert = reader.readBoolean();
    data.ledBlend = reader.readBoolean();

    if (deviceType !== DeviceType.ProprietaryAudio) {
      data.unknownValueUIType = reader.readInt32() as ValueUIType;
      data.resolution = reader.readInt32() as MappingResolution;
    }

    if (deviceType === DeviceType.GenericMidi) {
      data.useFactoryMap = reader.readBoolean();
    }
  }

  return data;
}

/**
 * Parse MappingSettings from a Frame
 */
export function parseMappingSettingsFromFrame(frame: Frame): MappingSettingsData {
  if (frame.fourCC !== MAPPING_SETTINGS_FRAME_ID) {
    throw new Error(`Expected CMAD frame, got ${frame.fourCC}`);
  }
  return parseMappingSettings(frame.getReader());
}

/**
 * Write MappingSettings to a BinaryWriter
 */
export function writeMappingSettings(writer: BinaryWriter, data: MappingSettingsData): void {
  writer.writeInt32(data.deviceType);
  writer.writeInt32(data.controlType);
  writer.writeInt32(data.interactionMode);
  writer.writeInt32(data.target);
  writer.writeBoolean(data.autoRepeat);
  writer.writeBoolean(data.invert);
  writer.writeBoolean(data.softTakeover);
  writer.writeFloat(data.rotarySensitivity);
  writer.writeFloat(data.rotaryAcceleration);

  writer.writeBoolean(data.hasValueUI);
  writer.writeInt32(data.valueUIType);
  writer.writeBytes(data.setValueTo);

  writer.writeWideString(data.comment);

  writer.writeInt32(data.conditionOneId);
  writer.writeInt32(data.conditionOneTarget);
  writer.writeBytes(data.conditionOneValue);
  writer.writeInt32(data.conditionTwoId);
  writer.writeInt32(data.conditionTwoTarget);
  writer.writeBytes(data.conditionTwoValue);

  // AIDEV-NOTE: ledMinControllerRangeType should use valueUIType if 0
  const minType =
    data.ledMinControllerRangeType === 0 ? data.valueUIType : data.ledMinControllerRangeType;
  writer.writeInt32(minType);
  writer.writeBytes(data.ledMinControllerRange);

  const maxType =
    data.ledMaxControllerRangeType === 0 ? data.valueUIType : data.ledMaxControllerRangeType;
  writer.writeInt32(maxType);
  writer.writeBytes(data.ledMaxControllerRange);

  writer.writeInt32(data.ledMinMidiRange);
  writer.writeInt32(data.ledMaxMidiRange);

  // Conditional fields based on device type
  if (data.deviceType !== DeviceType.ProprietarySynth) {
    writer.writeBoolean(data.ledInvert ?? false);
    writer.writeBoolean(data.ledBlend ?? false);

    if (data.deviceType !== DeviceType.ProprietaryAudio) {
      // AIDEV-NOTE: unknownValueUIType is dynamically determined:
      // For LED, use ledMaxControllerRangeType, otherwise use valueUIType
      const unknownType =
        data.controlType === MappingControlType.LED
          ? data.ledMaxControllerRangeType || data.valueUIType
          : data.valueUIType;
      writer.writeInt32(unknownType);

      const resolution =
        data.resolution === MappingResolution.Default
          ? MappingResolution.Default
          : data.resolution ?? MappingResolution.Default;
      writer.writeInt32(resolution);
    }

    if (data.deviceType === DeviceType.GenericMidi) {
      writer.writeBoolean(data.useFactoryMap ?? false);
    }
  }
}

/**
 * Create a CMAD frame from MappingSettings data
 */
export function createMappingSettingsFrame(data: MappingSettingsData): Frame {
  return Frame.create(MAPPING_SETTINGS_FRAME_ID, (writer) => {
    writeMappingSettings(writer, data);
  });
}

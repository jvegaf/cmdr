/**
 * DeviceData - Parse DDAT frame data
 *
 * AIDEV-NOTE: This is the TypeScript equivalent of DeviceData.cs.
 * The DDAT frame is a complex container with multiple sub-frames:
 *
 * Required frames:
 * - DDIF: DeviceTargetInfo (device target setting)
 * - DDIV: VersionInfo (Traktor version + mapping file revision)
 * - DDPT: DevicePorts (MIDI in/out port names)
 *
 * Optional frames (peek ahead to check presence):
 * - DDIC: MappingFileComment (device comment)
 * - DDDC: MidiDefinitionsContainer (MIDI definitions for NI devices)
 * - DDCB: MappingsContainer (the actual mappings)
 * - DVST: Device state (special XML for some NI devices like F1)
 */

import type { BinaryReader } from '../binary/BinaryReader.js';
import type { BinaryWriter } from '../binary/BinaryWriter.js';
import { DeviceTarget } from '../enums/index.js';
import { Frame } from './Frame.js';
import {
  createMappingsContainerFrame,
  type MappingsContainerData,
  MAPPINGS_CONTAINER_FRAME_ID,
  parseMappingsContainer,
} from './MappingsContainer.js';

// ============================================================================
// Frame IDs
// ============================================================================

export const DEVICE_DATA_FRAME_ID = 'DDAT';
export const DEVICE_TARGET_INFO_FRAME_ID = 'DDIF';
export const VERSION_INFO_FRAME_ID = 'DDIV';
export const DEVICE_PORTS_FRAME_ID = 'DDPT';
export const MAPPING_FILE_COMMENT_FRAME_ID = 'DDIC';
export const MIDI_DEFINITIONS_CONTAINER_FRAME_ID = 'DDDC';
export const MIDI_IN_DEFINITIONS_FRAME_ID = 'DDCI';
export const MIDI_OUT_DEFINITIONS_FRAME_ID = 'DDCO';
export const MIDI_DEFINITION_FRAME_ID = 'DCDT';
export const DVST_FRAME_ID = 'DVST';

// ============================================================================
// Sub-frame data structures
// ============================================================================

/**
 * Device target info (DDIF frame)
 */
export interface DeviceTargetInfoData {
  deviceTarget: DeviceTarget;
}

/**
 * Version info (DDIV frame)
 */
export interface VersionInfoData {
  version: string;
  mappingFileRevision: number;
}

/**
 * Device ports (DDPT frame)
 */
export interface DevicePortsData {
  inPortName: string;
  outPortName: string;
}

/**
 * MIDI control type enum
 */
export enum MidiControlType {
  Pad = 0,
  Button = 1,
  Fader = 2,
  FaderHighRes = 3,
  Encoder = 4,
  Led = 5,
  LedRGB = 6,
  WheelRelative = 7,
  WheelAbsolute = 8,
  JogWheel = 9,
  Generic = 10,
}

/**
 * Encoder mode enum
 */
export enum EncoderMode {
  ThreeFhTwosComplement = 0,
  SevenFTwosComplement = 1,
  ThreeFh = 2,
  SevenF = 3,
}

/**
 * MIDI definition (DCDT frame)
 * Defines a MIDI control for NI devices
 */
export interface MidiDefinitionData {
  midiNote: string;
  midiControlType: MidiControlType;
  minValue: number;
  maxValue: number;
  encoderMode: EncoderMode;
  controlId: number;
}

/**
 * MIDI definitions container (DDDC frame)
 */
export interface MidiDefinitionsContainerData {
  inDefinitions: MidiDefinitionData[];
  outDefinitions: MidiDefinitionData[];
}

/**
 * DVST frame data (special device state for some NI devices)
 */
export interface DvstData {
  unknown1: boolean;
  unknown2: number;
  unknown3: number;
  unknown4: number;
  xml: string;
}

/**
 * Main DeviceData structure (DDAT frame)
 */
export interface DeviceDataData {
  target: DeviceTargetInfoData;
  version: VersionInfoData;
  comment?: string;
  ports: DevicePortsData;
  midiDefinitions?: MidiDefinitionsContainerData;
  mappings?: MappingsContainerData;
  dvst?: DvstData;
}

// ============================================================================
// Default values
// ============================================================================

export const DEFAULT_PORT = 'None';

export function createDefaultDeviceData(traktorVersion = ''): DeviceDataData {
  return {
    target: { deviceTarget: DeviceTarget.None },
    version: { version: traktorVersion, mappingFileRevision: 0 },
    ports: { inPortName: DEFAULT_PORT, outPortName: DEFAULT_PORT },
  };
}

// ============================================================================
// Parsing functions
// ============================================================================

function parseDeviceTargetInfo(reader: BinaryReader): DeviceTargetInfoData {
  return {
    deviceTarget: reader.readInt32() as DeviceTarget,
  };
}

function parseVersionInfo(reader: BinaryReader): VersionInfoData {
  return {
    version: reader.readWideString(),
    mappingFileRevision: reader.readInt32(),
  };
}

function parseDevicePorts(reader: BinaryReader): DevicePortsData {
  return {
    inPortName: reader.readWideString(),
    outPortName: reader.readWideString(),
  };
}

function parseMidiDefinition(reader: BinaryReader): MidiDefinitionData {
  return {
    midiNote: reader.readWideString(),
    midiControlType: reader.readInt32() as MidiControlType,
    minValue: reader.readFloat(),
    maxValue: reader.readFloat(),
    encoderMode: reader.readInt32() as EncoderMode,
    controlId: reader.readInt32(),
  };
}

function parseMidiDefinitionsList(reader: BinaryReader): MidiDefinitionData[] {
  const count = reader.readInt32();
  const definitions: MidiDefinitionData[] = [];

  for (let i = 0; i < count; i++) {
    const header = Frame.readHeader(reader);
    if (header.fourCC !== MIDI_DEFINITION_FRAME_ID) {
      throw new Error(`Expected DCDT frame, got ${header.fourCC}`);
    }
    const defReader = reader.slice(header.size);
    definitions.push(parseMidiDefinition(defReader));
  }

  return definitions;
}

function parseMidiDefinitionsContainer(reader: BinaryReader): MidiDefinitionsContainerData {
  // Read DDCI frame (in definitions)
  const inHeader = Frame.readHeader(reader);
  if (inHeader.fourCC !== MIDI_IN_DEFINITIONS_FRAME_ID) {
    throw new Error(`Expected DDCI frame, got ${inHeader.fourCC}`);
  }
  const inReader = reader.slice(inHeader.size);
  const inDefinitions = parseMidiDefinitionsList(inReader);

  // Read DDCO frame (out definitions)
  const outHeader = Frame.readHeader(reader);
  if (outHeader.fourCC !== MIDI_OUT_DEFINITIONS_FRAME_ID) {
    throw new Error(`Expected DDCO frame, got ${outHeader.fourCC}`);
  }
  const outReader = reader.slice(outHeader.size);
  const outDefinitions = parseMidiDefinitionsList(outReader);

  return { inDefinitions, outDefinitions };
}

function parseDvst(reader: BinaryReader): DvstData {
  const unknown1 = reader.readBoolean();
  const unknown2 = reader.readInt32();
  const unknown3 = reader.readInt32();
  const unknown4 = reader.readInt32();
  const len = reader.readInt32();
  const xml = reader.readAsciiString(len);

  return { unknown1, unknown2, unknown3, unknown4, xml };
}

/**
 * Parse DeviceData from a BinaryReader
 * Reader should be positioned at start of DDAT frame data (after header)
 */
export function parseDeviceData(reader: BinaryReader): DeviceDataData {
  // Read required DDIF frame
  const targetHeader = Frame.readHeader(reader);
  if (targetHeader.fourCC !== DEVICE_TARGET_INFO_FRAME_ID) {
    throw new Error(`Expected DDIF frame, got ${targetHeader.fourCC}`);
  }
  const targetReader = reader.slice(targetHeader.size);
  const target = parseDeviceTargetInfo(targetReader);

  // Read required DDIV frame
  const versionHeader = Frame.readHeader(reader);
  if (versionHeader.fourCC !== VERSION_INFO_FRAME_ID) {
    throw new Error(`Expected DDIV frame, got ${versionHeader.fourCC}`);
  }
  const versionReader = reader.slice(versionHeader.size);
  const version = parseVersionInfo(versionReader);

  const data: DeviceDataData = {
    target,
    version,
    ports: { inPortName: DEFAULT_PORT, outPortName: DEFAULT_PORT },
  };

  // AIDEV-NOTE: Optional frames are detected by peeking at FourCC
  // Check for optional DDIC (comment)
  if (!reader.isEof) {
    const nextFourCC = reader.peekFourCC();
    if (nextFourCC === MAPPING_FILE_COMMENT_FRAME_ID) {
      const commentHeader = Frame.readHeader(reader);
      const commentReader = reader.slice(commentHeader.size);
      data.comment = commentReader.readWideString();
    }
  }

  // Read required DDPT frame (ports)
  const portsHeader = Frame.readHeader(reader);
  if (portsHeader.fourCC !== DEVICE_PORTS_FRAME_ID) {
    throw new Error(`Expected DDPT frame, got ${portsHeader.fourCC}`);
  }
  const portsReader = reader.slice(portsHeader.size);
  data.ports = parseDevicePorts(portsReader);

  // Check for optional DDDC (MIDI definitions)
  if (!reader.isEof) {
    const nextFourCC = reader.peekFourCC();
    if (nextFourCC === MIDI_DEFINITIONS_CONTAINER_FRAME_ID) {
      const midiDefsHeader = Frame.readHeader(reader);
      const midiDefsReader = reader.slice(midiDefsHeader.size);
      data.midiDefinitions = parseMidiDefinitionsContainer(midiDefsReader);
    }
  }

  // Check for optional DDCB (mappings)
  if (!reader.isEof) {
    const nextFourCC = reader.peekFourCC();
    if (nextFourCC === MAPPINGS_CONTAINER_FRAME_ID) {
      const mappingsHeader = Frame.readHeader(reader);
      const mappingsReader = reader.slice(mappingsHeader.size);
      data.mappings = parseMappingsContainer(mappingsReader);
    }
  }

  // Check for optional DVST
  if (!reader.isEof) {
    const nextFourCC = reader.peekFourCC();
    if (nextFourCC === DVST_FRAME_ID) {
      const dvstHeader = Frame.readHeader(reader);
      const dvstReader = reader.slice(dvstHeader.size);
      data.dvst = parseDvst(dvstReader);
    }
  }

  return data;
}

/**
 * Parse DeviceData from a Frame
 */
export function parseDeviceDataFromFrame(frame: Frame): DeviceDataData {
  if (frame.fourCC !== DEVICE_DATA_FRAME_ID) {
    throw new Error(`Expected DDAT frame, got ${frame.fourCC}`);
  }
  return parseDeviceData(frame.getReader());
}

// ============================================================================
// Writing functions
// ============================================================================

function writeDeviceTargetInfo(writer: BinaryWriter, data: DeviceTargetInfoData): void {
  writer.writeInt32(data.deviceTarget);
}

function writeVersionInfo(writer: BinaryWriter, data: VersionInfoData): void {
  writer.writeWideString(data.version);
  writer.writeInt32(data.mappingFileRevision);
}

function writeDevicePorts(writer: BinaryWriter, data: DevicePortsData): void {
  writer.writeWideString(data.inPortName);
  writer.writeWideString(data.outPortName);
}

function writeMidiDefinition(writer: BinaryWriter, data: MidiDefinitionData): void {
  writer.writeWideString(data.midiNote);
  writer.writeInt32(data.midiControlType);
  writer.writeFloat(data.minValue);
  writer.writeFloat(data.maxValue);
  writer.writeInt32(data.encoderMode);
  writer.writeInt32(data.controlId);
}

function writeMidiDefinitionsList(
  writer: BinaryWriter,
  definitions: MidiDefinitionData[],
  frameId: string
): void {
  const listFrame = Frame.create(frameId, (listWriter) => {
    listWriter.writeInt32(definitions.length);
    for (const def of definitions) {
      const defFrame = Frame.create(MIDI_DEFINITION_FRAME_ID, (defWriter) => {
        writeMidiDefinition(defWriter, def);
      });
      defFrame.writeTo(listWriter);
    }
  });
  listFrame.writeTo(writer);
}

function writeMidiDefinitionsContainer(
  writer: BinaryWriter,
  data: MidiDefinitionsContainerData
): void {
  writeMidiDefinitionsList(writer, data.inDefinitions, MIDI_IN_DEFINITIONS_FRAME_ID);
  writeMidiDefinitionsList(writer, data.outDefinitions, MIDI_OUT_DEFINITIONS_FRAME_ID);
}

function writeDvst(writer: BinaryWriter, data: DvstData): void {
  writer.writeBoolean(data.unknown1);
  writer.writeInt32(data.unknown2);
  writer.writeInt32(data.unknown3);
  writer.writeInt32(data.unknown4);
  writer.writeInt32(data.xml.length);
  writer.writeAsciiString(data.xml);
}

/**
 * Write DeviceData to a BinaryWriter
 */
export function writeDeviceData(writer: BinaryWriter, data: DeviceDataData): void {
  // Write DDIF frame
  const targetFrame = Frame.create(DEVICE_TARGET_INFO_FRAME_ID, (w) => {
    writeDeviceTargetInfo(w, data.target);
  });
  targetFrame.writeTo(writer);

  // Write DDIV frame
  const versionFrame = Frame.create(VERSION_INFO_FRAME_ID, (w) => {
    writeVersionInfo(w, data.version);
  });
  versionFrame.writeTo(writer);

  // Write optional DDIC frame (comment)
  if (data.comment !== undefined) {
    const commentFrame = Frame.create(MAPPING_FILE_COMMENT_FRAME_ID, (w) => {
      w.writeWideString(data.comment ?? '');
    });
    commentFrame.writeTo(writer);
  }

  // Write DDPT frame
  const portsFrame = Frame.create(DEVICE_PORTS_FRAME_ID, (w) => {
    writeDevicePorts(w, data.ports);
  });
  portsFrame.writeTo(writer);

  // Write optional DDDC frame (MIDI definitions)
  if (data.midiDefinitions) {
    const midiDefs = data.midiDefinitions;
    const midiDefsFrame = Frame.create(MIDI_DEFINITIONS_CONTAINER_FRAME_ID, (w) => {
      writeMidiDefinitionsContainer(w, midiDefs);
    });
    midiDefsFrame.writeTo(writer);
  }

  // Write optional DDCB frame (mappings)
  if (data.mappings) {
    const mappingsFrame = createMappingsContainerFrame(data.mappings);
    mappingsFrame.writeTo(writer);
  }

  // Write optional DVST frame
  if (data.dvst) {
    const dvst = data.dvst;
    const dvstFrame = Frame.create(DVST_FRAME_ID, (w) => {
      writeDvst(w, dvst);
    });
    dvstFrame.writeTo(writer);
  }
}

/**
 * Create a DDAT frame from DeviceData
 */
export function createDeviceDataFrame(data: DeviceDataData): Frame {
  return Frame.create(DEVICE_DATA_FRAME_ID, (writer) => {
    writeDeviceData(writer, data);
  });
}

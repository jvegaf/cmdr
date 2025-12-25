/**
 * MappingsContainer - Parse DDCB frame data
 *
 * AIDEV-NOTE: This is the TypeScript equivalent of MappingsContainer.cs.
 * The DDCB frame contains:
 * - CMAS: List of mappings
 * - DCBM: List of MIDI note bindings
 */

import type { BinaryReader } from '../binary/BinaryReader.js';
import type { BinaryWriter } from '../binary/BinaryWriter.js';
import { Frame } from './Frame.js';
import {
  createMappingFrame,
  MAPPING_FRAME_ID,
  type MappingData,
  parseMapping,
} from './Mapping.js';
import {
  createMidiNoteBindingFrame,
  MIDI_NOTE_BINDING_FRAME_ID,
  type MidiNoteBindingData,
  parseMidiNoteBinding,
} from './MidiNoteBinding.js';

/**
 * Frame ID for MappingsContainer
 */
export const MAPPINGS_CONTAINER_FRAME_ID = 'DDCB';

/**
 * Frame ID for MappingsList
 */
export const MAPPINGS_LIST_FRAME_ID = 'CMAS';

/**
 * Frame ID for MidiNoteBindingList
 */
export const MIDI_NOTE_BINDING_LIST_FRAME_ID = 'DCBM';

/**
 * Data structure for MappingsContainer
 */
export interface MappingsContainerData {
  mappings: MappingData[];
  midiBindings: MidiNoteBindingData[];
}

/**
 * Create empty MappingsContainer data
 */
export function createEmptyMappingsContainer(): MappingsContainerData {
  return {
    mappings: [],
    midiBindings: [],
  };
}

/**
 * Parse a list of items from a BinaryReader using a factory function
 * AIDEV-NOTE: This mimics the C# ReadList<T> extension method
 */
function parseList<T>(reader: BinaryReader, parseItem: (r: BinaryReader) => T, frameId: string): T[] {
  const count = reader.readInt32();
  const items: T[] = [];

  for (let i = 0; i < count; i++) {
    // Read frame header for each item
    const header = Frame.readHeader(reader);
    if (header.fourCC !== frameId) {
      throw new Error(`Expected ${frameId} frame, got ${header.fourCC}`);
    }
    const itemReader = reader.slice(header.size);
    items.push(parseItem(itemReader));
  }

  return items;
}

/**
 * Parse MappingsContainer from a BinaryReader
 * Reader should be positioned at start of DDCB frame data (after header)
 */
export function parseMappingsContainer(reader: BinaryReader): MappingsContainerData {
  // Read CMAS frame (mappings list)
  const cmasHeader = Frame.readHeader(reader);
  if (cmasHeader.fourCC !== MAPPINGS_LIST_FRAME_ID) {
    throw new Error(`Expected CMAS frame, got ${cmasHeader.fourCC}`);
  }
  const cmasReader = reader.slice(cmasHeader.size);
  const mappings = parseList(cmasReader, parseMapping, MAPPING_FRAME_ID);

  // Read DCBM frame (MIDI bindings list)
  const dcbmHeader = Frame.readHeader(reader);
  if (dcbmHeader.fourCC !== MIDI_NOTE_BINDING_LIST_FRAME_ID) {
    throw new Error(`Expected DCBM frame, got ${dcbmHeader.fourCC}`);
  }
  const dcbmReader = reader.slice(dcbmHeader.size);
  const midiBindings = parseList(dcbmReader, parseMidiNoteBinding, MIDI_NOTE_BINDING_FRAME_ID);

  return {
    mappings,
    midiBindings,
  };
}

/**
 * Parse MappingsContainer from a Frame
 */
export function parseMappingsContainerFromFrame(frame: Frame): MappingsContainerData {
  if (frame.fourCC !== MAPPINGS_CONTAINER_FRAME_ID) {
    throw new Error(`Expected DDCB frame, got ${frame.fourCC}`);
  }
  return parseMappingsContainer(frame.getReader());
}

/**
 * Write a list of items to a BinaryWriter
 */
function writeList<T>(
  writer: BinaryWriter,
  items: T[],
  createFrame: (item: T) => Frame
): void {
  writer.writeInt32(items.length);
  for (const item of items) {
    const frame = createFrame(item);
    frame.writeTo(writer);
  }
}

/**
 * Write MappingsContainer to a BinaryWriter
 */
export function writeMappingsContainer(writer: BinaryWriter, data: MappingsContainerData): void {
  // Write CMAS frame (mappings list)
  const cmasFrame = Frame.create(MAPPINGS_LIST_FRAME_ID, (cmasWriter) => {
    writeList(cmasWriter, data.mappings, createMappingFrame);
  });
  cmasFrame.writeTo(writer);

  // Write DCBM frame (MIDI bindings list)
  const dcbmFrame = Frame.create(MIDI_NOTE_BINDING_LIST_FRAME_ID, (dcbmWriter) => {
    writeList(dcbmWriter, data.midiBindings, createMidiNoteBindingFrame);
  });
  dcbmFrame.writeTo(writer);
}

/**
 * Create a DDCB frame from MappingsContainer data
 */
export function createMappingsContainerFrame(data: MappingsContainerData): Frame {
  return Frame.create(MAPPINGS_CONTAINER_FRAME_ID, (writer) => {
    writeMappingsContainer(writer, data);
  });
}

/**
 * MidiNoteBinding - Parse DCBM frame data
 *
 * AIDEV-NOTE: This is the TypeScript equivalent of MidiNoteBinding.cs.
 * MidiNoteBindings link mappings to MIDI note/CC messages.
 *
 * Structure:
 * - BindingId: Links to Mapping.midiNoteBindingId
 * - MidiNote: String representation of the MIDI message (e.g., "Ch01.CC.001")
 */

import type { BinaryReader } from '../binary/BinaryReader.js';
import type { BinaryWriter } from '../binary/BinaryWriter.js';
import { Frame } from './Frame.js';

/**
 * Frame ID for MidiNoteBinding
 * AIDEV-NOTE: Confusingly, both MidiNoteBindingList and individual MidiNoteBinding
 * use the same frame ID "DCBM". The list contains a count followed by frames.
 */
export const MIDI_NOTE_BINDING_FRAME_ID = 'DCBM';

/**
 * Data structure for MidiNoteBinding
 */
export interface MidiNoteBindingData {
  /**
   * ID linking this binding to a mapping
   * Must match Mapping.midiNoteBindingId
   */
  bindingId: number;

  /**
   * MIDI note string, e.g.:
   * - "Ch01.CC.001" - CC message, channel 1, CC number 1
   * - "Ch01.Note.C3" - Note message, channel 1, note C3
   */
  midiNote: string;
}

/**
 * Create default MidiNoteBinding data
 */
export function createDefaultMidiNoteBinding(bindingId: number, midiNote = ''): MidiNoteBindingData {
  return {
    bindingId,
    midiNote,
  };
}

/**
 * Parse MidiNoteBinding from a BinaryReader
 * Reader should be positioned at start of DCBM frame data (after header)
 */
export function parseMidiNoteBinding(reader: BinaryReader): MidiNoteBindingData {
  const bindingId = reader.readInt32();
  const midiNote = reader.readWideString();

  return {
    bindingId,
    midiNote,
  };
}

/**
 * Parse MidiNoteBinding from a Frame
 */
export function parseMidiNoteBindingFromFrame(frame: Frame): MidiNoteBindingData {
  if (frame.fourCC !== MIDI_NOTE_BINDING_FRAME_ID) {
    throw new Error(`Expected DCBM frame, got ${frame.fourCC}`);
  }
  return parseMidiNoteBinding(frame.getReader());
}

/**
 * Write MidiNoteBinding to a BinaryWriter
 */
export function writeMidiNoteBinding(writer: BinaryWriter, data: MidiNoteBindingData): void {
  writer.writeInt32(data.bindingId);
  writer.writeWideString(data.midiNote);
}

/**
 * Create a DCBM frame from MidiNoteBinding data
 */
export function createMidiNoteBindingFrame(data: MidiNoteBindingData): Frame {
  return Frame.create(MIDI_NOTE_BINDING_FRAME_ID, (writer) => {
    writeMidiNoteBinding(writer, data);
  });
}

/**
 * MIDI Binding Utilities
 *
 * AIDEV-NOTE: This module bridges @cmdr/midi (runtime MIDI messages) with @cmdr/core
 * (TSI file bindings). Use these helpers to convert learned MIDI messages into
 * binding objects that can be assigned to mappings.
 *
 * The MidiBinding interface from @cmdr/core expects:
 * - note: string like "CC.00.001" or "Note.00.060"
 * - channel: 0-15 (MIDI channels, 0-indexed)
 * - noteNumber: 0-127 (note or CC number)
 * - isCC: boolean
 */

import type { MidiMessageType } from './types.js';

import { MidiMessage } from './MidiMessage.js';

/**
 * Represents a MIDI binding for a mapping
 * (Duplicated here to avoid circular dependency with @cmdr/core)
 */
export interface MidiBindingData {
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

/**
 * Create MIDI note string from components
 * Format: "CC.XX.YYY" or "Note.XX.YYY" where XX=channel (0-padded), YYY=note/cc number (0-padded)
 */
export function createMidiNoteString(
  isCC: boolean,
  channel: number,
  noteNumber: number
): string {
  const type = isCC ? 'CC' : 'Note';
  const channelStr = channel.toString().padStart(2, '0');
  const noteStr = noteNumber.toString().padStart(3, '0');
  return `${type}.${channelStr}.${noteStr}`;
}

/**
 * Convert a MidiMessage to a MidiBindingData object
 *
 * Only Note On, Note Off, and Control Change messages can be converted to bindings.
 * Other message types (pitch bend, aftertouch, sysex, etc.) return null.
 *
 * @param msg The MIDI message from MidiManager
 * @returns MidiBindingData or null if message type is not bindable
 *
 * @example
 * ```typescript
 * const msg = MidiMessage.parse([0xB0, 0x01, 0x7F]); // CC#1 on channel 1
 * const binding = midiMessageToBinding(msg);
 * // { note: "CC.00.001", channel: 0, noteNumber: 1, isCC: true }
 * ```
 */
export function midiMessageToBinding(msg: MidiMessage): MidiBindingData | null {
  // AIDEV-NOTE: MidiMessage uses 1-indexed channels (1-16), but MidiBinding uses 0-indexed (0-15)
  const channel = msg.channel - 1;

  switch (msg.type) {
    case 'controlchange': {
      const controller = msg.data.controller;
      if (controller === undefined) return null;

      return {
        note: createMidiNoteString(true, channel, controller),
        channel,
        noteNumber: controller,
        isCC: true,
      };
    }

    case 'noteon':
    case 'noteoff': {
      const noteNumber = msg.data.note;
      if (noteNumber === undefined) return null;

      return {
        note: createMidiNoteString(false, channel, noteNumber),
        channel,
        noteNumber,
        isCC: false,
      };
    }

    default:
      // Pitch bend, aftertouch, sysex, etc. cannot be mapped in Traktor
      return null;
  }
}

/**
 * Parse a MIDI note string into components
 *
 * @param noteString String like "CC.00.001" or "Note.00.060"
 * @returns MidiBindingData or null if parsing fails
 */
export function parseMidiNoteString(noteString: string): MidiBindingData | null {
  if (!noteString) return null;

  const parts = noteString.split('.');
  if (parts.length !== 3) return null;

  const typeStr = parts[0];
  const channelStr = parts[1];
  const noteStr = parts[2];

  if (!typeStr || !channelStr || !noteStr) return null;

  // Validate type prefix
  const typeLower = typeStr.toLowerCase();
  if (typeLower !== 'cc' && typeLower !== 'note') return null;

  const isCC = typeLower === 'cc';
  const channel = parseInt(channelStr, 10);
  const noteNumber = parseInt(noteStr, 10);

  if (Number.isNaN(channel) || Number.isNaN(noteNumber)) return null;
  if (channel < 0 || channel > 15) return null;
  if (noteNumber < 0 || noteNumber > 127) return null;

  return {
    note: noteString,
    channel,
    noteNumber,
    isCC,
  };
}

/**
 * Check if a MIDI message type is bindable (can be used in Traktor mappings)
 *
 * Only Note On, Note Off, and Control Change can be bound to Traktor commands.
 */
export function isBindableMessageType(type: MidiMessageType): boolean {
  return type === 'noteon' || type === 'noteoff' || type === 'controlchange';
}

/**
 * Filter message types to only bindable ones
 * Useful for MIDI Learn to ignore non-bindable messages
 */
export const BINDABLE_MESSAGE_TYPES: MidiMessageType[] = ['noteon', 'noteoff', 'controlchange'];

/**
 * Get human-readable description of a MIDI binding
 *
 * @example
 * ```typescript
 * describeBinding({ note: "CC.00.001", channel: 0, noteNumber: 1, isCC: true })
 * // "CC #1 on Channel 1"
 *
 * describeBinding({ note: "Note.00.060", channel: 0, noteNumber: 60, isCC: false })
 * // "Note C4 on Channel 1"
 * ```
 */
export function describeBinding(binding: MidiBindingData): string {
  // Display channel as 1-indexed for user-friendliness
  const channelDisplay = binding.channel + 1;

  if (binding.isCC) {
    return `CC #${binding.noteNumber} on Channel ${channelDisplay}`;
  }

  // Convert note number to note name
  const noteName = noteNumberToName(binding.noteNumber);
  return `Note ${noteName} on Channel ${channelDisplay}`;
}

/**
 * Convert MIDI note number (0-127) to note name (e.g., "C4", "A#3")
 */
export function noteNumberToName(noteNumber: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(noteNumber / 12) - 1; // MIDI note 60 = C4
  const noteName = noteNames[noteNumber % 12];
  return `${noteName}${octave}`;
}

/**
 * Convert note name to MIDI note number
 * Supports formats like "C4", "A#3", "Bb5"
 *
 * @returns Note number 0-127, or null if parsing fails
 */
export function noteNameToNumber(name: string): number | null {
  const match = name.match(/^([A-Ga-g])([#b]?)(-?\d)$/);
  if (!match) return null;

  const noteNames: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };

  const noteLetter = match[1]?.toUpperCase();
  const accidental = match[2];
  const octave = parseInt(match[3] ?? '0', 10);

  if (!noteLetter || noteNames[noteLetter] === undefined) return null;

  let noteValue = noteNames[noteLetter];

  if (accidental === '#') {
    noteValue += 1;
  } else if (accidental === 'b') {
    noteValue -= 1;
  }

  const midiNote = (octave + 1) * 12 + noteValue;

  if (midiNote < 0 || midiNote > 127) return null;

  return midiNote;
}

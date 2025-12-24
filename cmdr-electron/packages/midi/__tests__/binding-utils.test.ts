/**
 * Tests for MIDI binding utilities
 */

import { describe, expect, it } from 'vitest';
import {
  midiMessageToBinding,
  createMidiNoteString,
  parseMidiNoteString,
  isBindableMessageType,
  describeBinding,
  noteNumberToName,
  noteNameToNumber,
  BINDABLE_MESSAGE_TYPES,
} from '../src/binding-utils.js';
import { MidiMessage } from '../src/MidiMessage.js';

describe('createMidiNoteString', () => {
  it('creates CC note string with proper padding', () => {
    expect(createMidiNoteString(true, 0, 1)).toBe('CC.00.001');
    expect(createMidiNoteString(true, 15, 127)).toBe('CC.15.127');
    expect(createMidiNoteString(true, 1, 64)).toBe('CC.01.064');
  });

  it('creates Note string with proper padding', () => {
    expect(createMidiNoteString(false, 0, 60)).toBe('Note.00.060');
    expect(createMidiNoteString(false, 9, 36)).toBe('Note.09.036');
    expect(createMidiNoteString(false, 15, 127)).toBe('Note.15.127');
  });
});

describe('parseMidiNoteString', () => {
  it('parses CC note strings', () => {
    const result = parseMidiNoteString('CC.00.001');
    expect(result).toEqual({
      note: 'CC.00.001',
      channel: 0,
      noteNumber: 1,
      isCC: true,
    });
  });

  it('parses Note strings', () => {
    const result = parseMidiNoteString('Note.00.060');
    expect(result).toEqual({
      note: 'Note.00.060',
      channel: 0,
      noteNumber: 60,
      isCC: false,
    });
  });

  it('handles lowercase type', () => {
    const result = parseMidiNoteString('cc.05.032');
    expect(result).not.toBeNull();
    expect(result?.isCC).toBe(true);
  });

  it('returns null for invalid formats', () => {
    expect(parseMidiNoteString('')).toBeNull();
    expect(parseMidiNoteString('CC.00')).toBeNull();
    expect(parseMidiNoteString('CC.00.001.extra')).toBeNull();
    expect(parseMidiNoteString('Invalid.00.001')).toBeNull();
  });

  it('validates channel range (0-15)', () => {
    expect(parseMidiNoteString('CC.15.001')).not.toBeNull();
    expect(parseMidiNoteString('CC.16.001')).toBeNull();
    expect(parseMidiNoteString('CC.-1.001')).toBeNull();
  });

  it('validates note number range (0-127)', () => {
    expect(parseMidiNoteString('CC.00.127')).not.toBeNull();
    expect(parseMidiNoteString('CC.00.128')).toBeNull();
    expect(parseMidiNoteString('CC.00.-1')).toBeNull();
  });
});

describe('midiMessageToBinding', () => {
  it('converts Control Change to binding', () => {
    // CC#1 on channel 1 (0xB0 = CC on channel 1)
    const msg = MidiMessage.parse([0xb0, 0x01, 0x7f]);
    const binding = midiMessageToBinding(msg);

    expect(binding).toEqual({
      note: 'CC.00.001',
      channel: 0,
      noteNumber: 1,
      isCC: true,
    });
  });

  it('converts Note On to binding', () => {
    // Note On, C4 (note 60), channel 1
    const msg = MidiMessage.parse([0x90, 0x3c, 0x7f]);
    const binding = midiMessageToBinding(msg);

    expect(binding).toEqual({
      note: 'Note.00.060',
      channel: 0,
      noteNumber: 60,
      isCC: false,
    });
  });

  it('converts Note Off to binding', () => {
    // Note Off, C4, channel 1
    const msg = MidiMessage.parse([0x80, 0x3c, 0x00]);
    const binding = midiMessageToBinding(msg);

    expect(binding).toEqual({
      note: 'Note.00.060',
      channel: 0,
      noteNumber: 60,
      isCC: false,
    });
  });

  it('handles different channels correctly', () => {
    // CC on channel 10 (0xB9 = CC + channel 10, 0-indexed is 9)
    const msg = MidiMessage.parse([0xb9, 0x40, 0x7f]);
    const binding = midiMessageToBinding(msg);

    expect(binding?.channel).toBe(9);
    expect(binding?.note).toBe('CC.09.064');
  });

  it('returns null for pitch bend', () => {
    const msg = MidiMessage.parse([0xe0, 0x00, 0x40]);
    expect(midiMessageToBinding(msg)).toBeNull();
  });

  it('returns null for aftertouch', () => {
    // Channel aftertouch
    const msg = MidiMessage.parse([0xd0, 0x40]);
    expect(midiMessageToBinding(msg)).toBeNull();
  });

  it('returns null for program change', () => {
    const msg = MidiMessage.parse([0xc0, 0x05]);
    expect(midiMessageToBinding(msg)).toBeNull();
  });
});

describe('isBindableMessageType', () => {
  it('returns true for bindable types', () => {
    expect(isBindableMessageType('noteon')).toBe(true);
    expect(isBindableMessageType('noteoff')).toBe(true);
    expect(isBindableMessageType('controlchange')).toBe(true);
  });

  it('returns false for non-bindable types', () => {
    expect(isBindableMessageType('pitchbend')).toBe(false);
    expect(isBindableMessageType('aftertouch')).toBe(false);
    expect(isBindableMessageType('channelaftertouch')).toBe(false);
    expect(isBindableMessageType('programchange')).toBe(false);
    expect(isBindableMessageType('sysex')).toBe(false);
    expect(isBindableMessageType('unknown')).toBe(false);
  });
});

describe('BINDABLE_MESSAGE_TYPES', () => {
  it('contains only bindable types', () => {
    expect(BINDABLE_MESSAGE_TYPES).toEqual(['noteon', 'noteoff', 'controlchange']);
  });
});

describe('noteNumberToName', () => {
  it('converts common notes correctly', () => {
    expect(noteNumberToName(60)).toBe('C4'); // Middle C
    expect(noteNumberToName(69)).toBe('A4'); // A440
    expect(noteNumberToName(0)).toBe('C-1');
    expect(noteNumberToName(127)).toBe('G9');
  });

  it('handles sharps correctly', () => {
    expect(noteNumberToName(61)).toBe('C#4');
    expect(noteNumberToName(70)).toBe('A#4');
  });
});

describe('noteNameToNumber', () => {
  it('converts common notes correctly', () => {
    expect(noteNameToNumber('C4')).toBe(60);
    expect(noteNameToNumber('A4')).toBe(69);
    expect(noteNameToNumber('C-1')).toBe(0);
  });

  it('handles sharps', () => {
    expect(noteNameToNumber('C#4')).toBe(61);
    expect(noteNameToNumber('A#4')).toBe(70);
  });

  it('handles flats', () => {
    expect(noteNameToNumber('Db4')).toBe(61);
    expect(noteNameToNumber('Bb4')).toBe(70);
  });

  it('handles lowercase', () => {
    expect(noteNameToNumber('c4')).toBe(60);
    expect(noteNameToNumber('a#4')).toBe(70);
  });

  it('returns null for invalid formats', () => {
    expect(noteNameToNumber('')).toBeNull();
    expect(noteNameToNumber('X4')).toBeNull();
    expect(noteNameToNumber('C')).toBeNull();
    expect(noteNameToNumber('C##4')).toBeNull();
  });

  it('returns null for out of range notes', () => {
    expect(noteNameToNumber('C-2')).toBeNull(); // Below 0
    expect(noteNameToNumber('C11')).toBeNull(); // Above 127
  });

  it('is inverse of noteNumberToName for natural notes', () => {
    // Round-trip test
    for (const note of [0, 12, 24, 36, 48, 60, 72, 84, 96, 108]) {
      const name = noteNumberToName(note);
      expect(noteNameToNumber(name)).toBe(note);
    }
  });
});

describe('describeBinding', () => {
  it('describes CC binding', () => {
    const binding = {
      note: 'CC.00.001',
      channel: 0,
      noteNumber: 1,
      isCC: true,
    };
    expect(describeBinding(binding)).toBe('CC #1 on Channel 1');
  });

  it('describes Note binding with note name', () => {
    const binding = {
      note: 'Note.00.060',
      channel: 0,
      noteNumber: 60,
      isCC: false,
    };
    expect(describeBinding(binding)).toBe('Note C4 on Channel 1');
  });

  it('shows correct channel (1-indexed for display)', () => {
    const binding = {
      note: 'CC.09.064',
      channel: 9,
      noteNumber: 64,
      isCC: true,
    };
    expect(describeBinding(binding)).toBe('CC #64 on Channel 10');
  });
});

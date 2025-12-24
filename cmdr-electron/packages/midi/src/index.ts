/**
 * @cmdr/midi - MIDI communication library for CMDR
 *
 * AIDEV-NOTE: This package provides MIDI Learn functionality using WebMIDI API.
 * In Electron, WebMIDI is available in the renderer process.
 *
 * Features:
 * - Device enumeration (list available MIDI inputs/outputs)
 * - MIDI message listening for MIDI Learn
 * - MIDI message parsing (Note On/Off, CC, etc.)
 */

export { MidiManager } from './MidiManager.js';
export { MidiMessage, type MidiMessageData } from './MidiMessage.js';
export type { MidiDevice, MidiPort } from './types.js';

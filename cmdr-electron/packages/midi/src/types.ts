/**
 * MIDI device and port type definitions
 */

export interface MidiPort {
  id: string;
  name: string;
  manufacturer: string;
  state: 'connected' | 'disconnected';
  type: 'input' | 'output';
}

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  inputs: MidiPort[];
  outputs: MidiPort[];
}

/**
 * MIDI message types
 */
export type MidiMessageType =
  | 'noteon'
  | 'noteoff'
  | 'controlchange'
  | 'programchange'
  | 'pitchbend'
  | 'aftertouch'
  | 'channelaftertouch'
  | 'sysex'
  | 'unknown';

/**
 * Callback type for MIDI message listeners
 */
export type MidiMessageCallback = (message: import('./MidiMessage.js').MidiMessage) => void;

/**
 * Options for starting MIDI Learn
 */
export interface MidiLearnOptions {
  /** Specific input port to listen on (all if not specified) */
  inputId?: string;
  /** Filter by message types */
  messageTypes?: MidiMessageType[];
  /** Timeout in milliseconds (0 = no timeout) */
  timeout?: number;
}

/**
 * MidiMessage - Parsed MIDI message
 *
 * AIDEV-NOTE: Represents a parsed MIDI message with all relevant data
 * extracted for use in MIDI Learn and mapping.
 */

import type { MidiMessageType } from './types.js';

export interface MidiMessageData {
  /** Raw MIDI bytes */
  raw: Uint8Array;
  /** Message type */
  type: MidiMessageType;
  /** MIDI channel (1-16) */
  channel: number;
  /** Note number (for note on/off) */
  note?: number;
  /** Velocity (for note on/off) */
  velocity?: number;
  /** Controller number (for CC) */
  controller?: number;
  /** Controller value (for CC) */
  value?: number;
  /** Program number (for program change) */
  program?: number;
  /** Pitch bend value (-8192 to 8191) */
  pitchBend?: number;
  /** Pressure value (for aftertouch) */
  pressure?: number;
  /** Source input port ID */
  portId: string;
  /** Source input port name */
  portName: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Parsed MIDI message with helper methods
 */
export class MidiMessage {
  readonly data: MidiMessageData;

  constructor(data: MidiMessageData) {
    this.data = data;
  }

  get type(): MidiMessageType {
    return this.data.type;
  }

  get channel(): number {
    return this.data.channel;
  }

  get raw(): Uint8Array {
    return this.data.raw;
  }

  get portId(): string {
    return this.data.portId;
  }

  get portName(): string {
    return this.data.portName;
  }

  /**
   * Parse raw MIDI bytes into a MidiMessage
   */
  static parse(raw: Uint8Array, portId: string, portName: string, timestamp: number): MidiMessage {
    const statusByte = raw[0];
    if (statusByte === undefined) {
      return new MidiMessage({
        raw,
        type: 'unknown',
        channel: 0,
        portId,
        portName,
        timestamp,
      });
    }

    // Extract channel (lower nibble) and message type (upper nibble)
    const channel = (statusByte & 0x0f) + 1; // MIDI channels are 1-16
    const messageType = statusByte & 0xf0;

    const data: MidiMessageData = {
      raw,
      type: 'unknown',
      channel,
      portId,
      portName,
      timestamp,
    };

    switch (messageType) {
      case 0x90: // Note On
        data.type = raw[2] === 0 ? 'noteoff' : 'noteon'; // velocity 0 = note off
        data.note = raw[1];
        data.velocity = raw[2];
        break;

      case 0x80: // Note Off
        data.type = 'noteoff';
        data.note = raw[1];
        data.velocity = raw[2];
        break;

      case 0xb0: // Control Change
        data.type = 'controlchange';
        data.controller = raw[1];
        data.value = raw[2];
        break;

      case 0xc0: // Program Change
        data.type = 'programchange';
        data.program = raw[1];
        break;

      case 0xe0: // Pitch Bend
        data.type = 'pitchbend';
        // Pitch bend is 14-bit: LSB in data[1], MSB in data[2]
        data.pitchBend = ((raw[2] ?? 0) << 7) | (raw[1] ?? 0) - 8192;
        break;

      case 0xa0: // Polyphonic Aftertouch
        data.type = 'aftertouch';
        data.note = raw[1];
        data.pressure = raw[2];
        break;

      case 0xd0: // Channel Aftertouch
        data.type = 'channelaftertouch';
        data.pressure = raw[1];
        break;

      case 0xf0: // System messages (including SysEx)
        if (statusByte === 0xf0) {
          data.type = 'sysex';
          data.channel = 0; // SysEx has no channel
        }
        break;
    }

    return new MidiMessage(data);
  }

  /**
   * Get a human-readable description of this message
   */
  toString(): string {
    switch (this.data.type) {
      case 'noteon':
        return `Note On: ch${this.data.channel} note=${this.data.note} vel=${this.data.velocity}`;
      case 'noteoff':
        return `Note Off: ch${this.data.channel} note=${this.data.note}`;
      case 'controlchange':
        return `CC: ch${this.data.channel} cc=${this.data.controller} val=${this.data.value}`;
      case 'programchange':
        return `Program: ch${this.data.channel} prog=${this.data.program}`;
      case 'pitchbend':
        return `Pitch Bend: ch${this.data.channel} val=${this.data.pitchBend}`;
      case 'aftertouch':
        return `Aftertouch: ch${this.data.channel} note=${this.data.note} pressure=${this.data.pressure}`;
      case 'channelaftertouch':
        return `Channel AT: ch${this.data.channel} pressure=${this.data.pressure}`;
      case 'sysex':
        return `SysEx: ${this.data.raw.length} bytes`;
      default:
        return `Unknown: ${Array.from(this.data.raw).map((b) => b.toString(16).padStart(2, '0')).join(' ')}`;
    }
  }
}

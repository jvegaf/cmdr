/**
 * MidiManager - Manages MIDI device connections and message handling
 *
 * AIDEV-NOTE: This is the TypeScript equivalent of MidiManager.cs from the WPF version.
 * Uses WebMIDI API which is available in Electron's renderer process.
 *
 * Key differences from .NET MIDI:
 * - Async/event-driven API
 * - Must be enabled before use (browser security)
 * - Works only in renderer process in Electron
 */

import type { MidiDevice, MidiPort, MidiMessageCallback, MidiLearnOptions } from './types.js';
import { MidiMessage } from './MidiMessage.js';

type WebMidiInput = {
  id: string;
  name: string | null;
  manufacturer: string | null;
  state: string;
  onmidimessage: ((event: { data: Uint8Array; timeStamp: number }) => void) | null;
};

type WebMidiOutput = {
  id: string;
  name: string | null;
  manufacturer: string | null;
  state: string;
};

type WebMidiAccess = {
  inputs: Map<string, WebMidiInput>;
  outputs: Map<string, WebMidiOutput>;
  onstatechange: ((event: unknown) => void) | null;
};

/**
 * MIDI Manager for device enumeration and MIDI Learn
 */
export class MidiManager {
  private midiAccess: WebMidiAccess | null = null;
  private isEnabled = false;
  private messageListeners: Set<MidiMessageCallback> = new Set();
  private deviceChangeListeners: Set<() => void> = new Set();

  /**
   * Check if WebMIDI is supported
   */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
  }

  /**
   * Check if MIDI is currently enabled
   */
  get enabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Enable MIDI access (must be called before other operations)
   */
  async enable(): Promise<void> {
    if (this.isEnabled) {
      return;
    }

    if (!MidiManager.isSupported()) {
      throw new Error('WebMIDI is not supported in this environment');
    }

    try {
      // Request MIDI access with sysex support
      this.midiAccess = (await (navigator as Navigator & { requestMIDIAccess: (options?: { sysex?: boolean }) => Promise<WebMidiAccess> }).requestMIDIAccess({ sysex: true })) as WebMidiAccess;
      this.isEnabled = true;

      // Set up state change listener
      this.midiAccess.onstatechange = () => {
        this.notifyDeviceChange();
      };

      // Set up message listeners for all inputs
      this.setupInputListeners();
    } catch (error) {
      throw new Error(`Failed to enable MIDI: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Disable MIDI and clean up
   */
  disable(): void {
    if (!this.isEnabled || !this.midiAccess) {
      return;
    }

    // Remove all input listeners
    for (const input of this.midiAccess.inputs.values()) {
      input.onmidimessage = null;
    }

    this.midiAccess.onstatechange = null;
    this.midiAccess = null;
    this.isEnabled = false;
    this.messageListeners.clear();
    this.deviceChangeListeners.clear();
  }

  /**
   * Get list of available MIDI input ports
   */
  getInputs(): MidiPort[] {
    if (!this.midiAccess) {
      return [];
    }

    const inputs: MidiPort[] = [];
    for (const input of this.midiAccess.inputs.values()) {
      inputs.push({
        id: input.id,
        name: input.name ?? 'Unknown',
        manufacturer: input.manufacturer ?? 'Unknown',
        state: input.state === 'connected' ? 'connected' : 'disconnected',
        type: 'input',
      });
    }
    return inputs;
  }

  /**
   * Get list of available MIDI output ports
   */
  getOutputs(): MidiPort[] {
    if (!this.midiAccess) {
      return [];
    }

    const outputs: MidiPort[] = [];
    for (const output of this.midiAccess.outputs.values()) {
      outputs.push({
        id: output.id,
        name: output.name ?? 'Unknown',
        manufacturer: output.manufacturer ?? 'Unknown',
        state: output.state === 'connected' ? 'connected' : 'disconnected',
        type: 'output',
      });
    }
    return outputs;
  }

  /**
   * Get combined list of devices with their inputs and outputs
   */
  getDevices(): MidiDevice[] {
    const deviceMap = new Map<string, MidiDevice>();

    for (const input of this.getInputs()) {
      const key = `${input.manufacturer}-${input.name}`;
      let device = deviceMap.get(key);
      if (!device) {
        device = {
          id: key,
          name: input.name,
          manufacturer: input.manufacturer,
          inputs: [],
          outputs: [],
        };
        deviceMap.set(key, device);
      }
      device.inputs.push(input);
    }

    for (const output of this.getOutputs()) {
      const key = `${output.manufacturer}-${output.name}`;
      let device = deviceMap.get(key);
      if (!device) {
        device = {
          id: key,
          name: output.name,
          manufacturer: output.manufacturer,
          inputs: [],
          outputs: [],
        };
        deviceMap.set(key, device);
      }
      device.outputs.push(output);
    }

    return Array.from(deviceMap.values());
  }

  /**
   * Add a listener for MIDI messages
   */
  addMessageListener(callback: MidiMessageCallback): void {
    this.messageListeners.add(callback);
  }

  /**
   * Remove a MIDI message listener
   */
  removeMessageListener(callback: MidiMessageCallback): void {
    this.messageListeners.delete(callback);
  }

  /**
   * Add a listener for device connection/disconnection
   */
  addDeviceChangeListener(callback: () => void): void {
    this.deviceChangeListeners.add(callback);
  }

  /**
   * Remove a device change listener
   */
  removeDeviceChangeListener(callback: () => void): void {
    this.deviceChangeListeners.delete(callback);
  }

  /**
   * Start MIDI Learn - returns a promise that resolves with the first received message
   */
  startMidiLearn(options: MidiLearnOptions = {}): Promise<MidiMessage> {
    return new Promise((resolve, reject) => {
      const { timeout = 0 } = options;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const listener: MidiMessageCallback = (message) => {
        // Filter by message type if specified
        if (options.messageTypes && !options.messageTypes.includes(message.type)) {
          return;
        }

        // Filter by input port if specified
        if (options.inputId && message.portId !== options.inputId) {
          return;
        }

        // Clean up
        this.removeMessageListener(listener);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        resolve(message);
      };

      this.addMessageListener(listener);

      // Set up timeout if specified
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          this.removeMessageListener(listener);
          reject(new Error('MIDI Learn timed out'));
        }, timeout);
      }
    });
  }

  /**
   * Set up message listeners for all inputs
   */
  private setupInputListeners(): void {
    if (!this.midiAccess) {
      return;
    }

    for (const input of this.midiAccess.inputs.values()) {
      input.onmidimessage = (event: { data: Uint8Array; timeStamp: number }) => {
        const message = MidiMessage.parse(
          event.data,
          input.id,
          input.name ?? 'Unknown',
          event.timeStamp
        );
        this.notifyMessage(message);
      };
    }
  }

  /**
   * Notify all message listeners
   */
  private notifyMessage(message: MidiMessage): void {
    for (const listener of this.messageListeners) {
      try {
        listener(message);
      } catch (error) {
        console.error('Error in MIDI message listener:', error);
      }
    }
  }

  /**
   * Notify device change listeners and re-setup input listeners
   */
  private notifyDeviceChange(): void {
    // Re-setup input listeners for new devices
    this.setupInputListeners();

    for (const listener of this.deviceChangeListeners) {
      try {
        listener();
      } catch (error) {
        console.error('Error in device change listener:', error);
      }
    }
  }
}

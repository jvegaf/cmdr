/**
 * MIDI Store (Zustand)
 *
 * AIDEV-NOTE: Manages MIDI device state and MIDI Learn functionality.
 * Integrates with @cmdr/midi for WebMIDI access.
 *
 * Key concepts:
 * - Device enumeration (inputs/outputs)
 * - MIDI Learn mode for capturing controller input
 * - Last received message for display
 */

import type {
  MidiBindingData,
  MidiDevice,
  MidiLearnOptions,
  MidiPort,
} from '@cmdr/midi';
import {
  BINDABLE_MESSAGE_TYPES,
  MidiManager,
  type MidiMessage,
  midiMessageToBinding,
} from '@cmdr/midi';
import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

interface MidiState {
  // State
  isSupported: boolean;
  isEnabled: boolean;
  isEnabling: boolean;
  enableError: string | null;

  // Devices
  inputs: MidiPort[];
  outputs: MidiPort[];
  devices: MidiDevice[];

  // MIDI Learn
  isLearning: boolean;
  learnTargetFileId: string | null;
  learnTargetMappingIds: number[] | null;
  lastMessage: MidiMessage | null;
  lastBinding: MidiBindingData | null;

  // Actions
  initialize: () => Promise<void>;
  enable: () => Promise<void>;
  disable: () => void;
  refreshDevices: () => void;

  // MIDI Learn
  startLearn: (
    fileId: string,
    mappingIds: number[],
    options?: MidiLearnOptions
  ) => Promise<MidiBindingData | null>;
  cancelLearn: () => void;
}

// ============================================================================
// Singleton MidiManager instance
// ============================================================================

const midiManager = new MidiManager();

// ============================================================================
// Store
// ============================================================================

export const useMidiStore = create<MidiState>((set, get) => ({
  // Initial state
  isSupported: MidiManager.isSupported(),
  isEnabled: false,
  isEnabling: false,
  enableError: null,

  inputs: [],
  outputs: [],
  devices: [],

  isLearning: false,
  learnTargetFileId: null,
  learnTargetMappingIds: null,
  lastMessage: null,
  lastBinding: null,

  // ========================================================================
  // Initialization
  // ========================================================================

  initialize: async () => {
    if (!MidiManager.isSupported()) {
      set({ isSupported: false });
      return;
    }

    // Auto-enable on init
    await get().enable();
  },

  enable: async () => {
    if (get().isEnabled || get().isEnabling) return;

    set({ isEnabling: true, enableError: null });

    try {
      await midiManager.enable();

      // Set up device change listener
      midiManager.addDeviceChangeListener(() => {
        get().refreshDevices();
      });

      // Set up message listener for last message tracking
      midiManager.addMessageListener((message: MidiMessage) => {
        const binding = midiMessageToBinding(message);
        set({ lastMessage: message, lastBinding: binding });
      });

      set({
        isEnabled: true,
        isEnabling: false,
        inputs: midiManager.getInputs(),
        outputs: midiManager.getOutputs(),
        devices: midiManager.getDevices(),
      });
    } catch (error) {
      set({
        isEnabling: false,
        enableError: error instanceof Error ? error.message : String(error),
      });
    }
  },

  disable: () => {
    midiManager.disable();
    set({
      isEnabled: false,
      inputs: [],
      outputs: [],
      devices: [],
      isLearning: false,
      learnTargetFileId: null,
      learnTargetMappingIds: null,
    });
  },

  refreshDevices: () => {
    if (!get().isEnabled) return;

    set({
      inputs: midiManager.getInputs(),
      outputs: midiManager.getOutputs(),
      devices: midiManager.getDevices(),
    });
  },

  // ========================================================================
  // MIDI Learn
  // ========================================================================

  startLearn: async (fileId, mappingIds, options = {}) => {
    if (!get().isEnabled) {
      throw new Error('MIDI is not enabled');
    }

    set({
      isLearning: true,
      learnTargetFileId: fileId,
      learnTargetMappingIds: mappingIds,
    });

    try {
      // Default to bindable message types only
      const learnOptions: MidiLearnOptions = {
        messageTypes: BINDABLE_MESSAGE_TYPES,
        timeout: 30000, // 30 seconds default
        ...options,
      };

      const message = await midiManager.startMidiLearn(learnOptions);
      const binding = midiMessageToBinding(message);

      set({
        isLearning: false,
        learnTargetFileId: null,
        learnTargetMappingIds: null,
        lastMessage: message,
        lastBinding: binding,
      });

      return binding;
    } catch (error) {
      set({
        isLearning: false,
        learnTargetFileId: null,
        learnTargetMappingIds: null,
      });

      // Re-throw unless it was a timeout (which is expected)
      if (error instanceof Error && error.message !== 'MIDI Learn timed out') {
        throw error;
      }

      return null;
    }
  },

  cancelLearn: () => {
    // AIDEV-NOTE: MidiManager.startMidiLearn doesn't have a cancel method yet.
    // For now, we just update the UI state. The promise will timeout naturally.
    set({
      isLearning: false,
      learnTargetFileId: null,
      learnTargetMappingIds: null,
    });
  },
}));

// ============================================================================
// Selector hooks
// ============================================================================

/**
 * Hook to check if MIDI is available and ready
 */
export function useMidiReady(): boolean {
  return useMidiStore((state) => state.isSupported && state.isEnabled);
}

/**
 * Hook to get MIDI input ports
 */
export function useMidiInputs(): MidiPort[] {
  return useMidiStore((state) => state.inputs);
}

/**
 * Hook to get MIDI output ports
 */
export function useMidiOutputs(): MidiPort[] {
  return useMidiStore((state) => state.outputs);
}

/**
 * Hook for MIDI Learn state
 */
export function useMidiLearn() {
  return useMidiStore((state) => ({
    isLearning: state.isLearning,
    targetFileId: state.learnTargetFileId,
    targetMappingIds: state.learnTargetMappingIds,
    lastMessage: state.lastMessage,
    lastBinding: state.lastBinding,
    startLearn: state.startLearn,
    cancelLearn: state.cancelLearn,
  }));
}

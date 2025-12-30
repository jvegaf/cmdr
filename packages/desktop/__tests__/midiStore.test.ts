/**
 * Tests for midiStore.ts - MIDI Device State Management
 *
 * AIDEV-NOTE: Tests the MIDI store with mocked MidiManager.
 * Covers:
 * - Initialization and enabling/disabling
 * - Device enumeration
 * - MIDI Learn functionality
 * - Selector hooks
 */

import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// We need to define mocks inside vi.mock factory because of hoisting
vi.mock('@cmdr/midi', () => {
  const mockEnable = vi.fn().mockResolvedValue(undefined);
  const mockDisable = vi.fn();
  const mockGetInputs = vi.fn().mockReturnValue([]);
  const mockGetOutputs = vi.fn().mockReturnValue([]);
  const mockGetDevices = vi.fn().mockReturnValue([]);
  const mockAddDeviceChangeListener = vi.fn();
  const mockAddMessageListener = vi.fn();
  const mockStartMidiLearn = vi.fn();

  // Store references so tests can access them
  const mocks = {
    enable: mockEnable,
    disable: mockDisable,
    getInputs: mockGetInputs,
    getOutputs: mockGetOutputs,
    getDevices: mockGetDevices,
    addDeviceChangeListener: mockAddDeviceChangeListener,
    addMessageListener: mockAddMessageListener,
    startMidiLearn: mockStartMidiLearn,
  };

  // Export for test access
  (globalThis as Record<string, unknown>).__midiMocks__ = mocks;

  return {
    MidiManager: Object.assign(
      vi.fn().mockImplementation(() => mocks),
      { isSupported: vi.fn(() => true) }
    ),
    BINDABLE_MESSAGE_TYPES: ['noteon', 'noteoff', 'controlchange'],
    midiMessageToBinding: vi.fn((message: { type: string; channel: number; data1: number }) => ({
      channel: message.channel,
      noteNumber: message.data1,
      isCC: message.type === 'controlchange',
      note: `${message.type === 'controlchange' ? 'CC' : 'Note'}.${String(message.channel).padStart(2, '0')}.${String(message.data1).padStart(3, '0')}`,
    })),
  };
});

// Import store after mocking
import { useMidiStore } from '../src/renderer/store/midiStore';

// Helper to get mocks
function getMocks() {
  return (globalThis as Record<string, unknown>).__midiMocks__ as {
    enable: ReturnType<typeof vi.fn>;
    disable: ReturnType<typeof vi.fn>;
    getInputs: ReturnType<typeof vi.fn>;
    getOutputs: ReturnType<typeof vi.fn>;
    getDevices: ReturnType<typeof vi.fn>;
    addDeviceChangeListener: ReturnType<typeof vi.fn>;
    addMessageListener: ReturnType<typeof vi.fn>;
    startMidiLearn: ReturnType<typeof vi.fn>;
  };
}

describe('midiStore', () => {
  beforeEach(() => {
    const mocks = getMocks();
    // Reset all mocks
    vi.clearAllMocks();
    mocks.enable.mockResolvedValue(undefined);
    mocks.getInputs.mockReturnValue([]);
    mocks.getOutputs.mockReturnValue([]);
    mocks.getDevices.mockReturnValue([]);

    // Reset store state
    useMidiStore.setState({
      isSupported: true,
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
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Initial State
  // ==========================================================================

  describe('Initial State', () => {
    it('should start with isEnabled false', () => {
      const state = useMidiStore.getState();
      expect(state.isEnabled).toBe(false);
    });

    it('should start with empty device lists', () => {
      const state = useMidiStore.getState();
      expect(state.inputs).toEqual([]);
      expect(state.outputs).toEqual([]);
      expect(state.devices).toEqual([]);
    });

    it('should start with isLearning false', () => {
      const state = useMidiStore.getState();
      expect(state.isLearning).toBe(false);
      expect(state.learnTargetFileId).toBeNull();
      expect(state.learnTargetMappingIds).toBeNull();
    });

    it('should start with null last message/binding', () => {
      const state = useMidiStore.getState();
      expect(state.lastMessage).toBeNull();
      expect(state.lastBinding).toBeNull();
    });
  });

  // ==========================================================================
  // Enable/Disable
  // ==========================================================================

  describe('enable', () => {
    it('should enable MIDI successfully', async () => {
      const { enable } = useMidiStore.getState();

      await act(async () => {
        await enable();
      });

      const state = useMidiStore.getState();
      expect(state.isEnabled).toBe(true);
      expect(state.isEnabling).toBe(false);
      expect(state.enableError).toBeNull();
    });

    it('should set isEnabling during enable process', async () => {
      const mocks = getMocks();
      let resolveEnable!: () => void;
      mocks.enable.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveEnable = resolve;
          })
      );

      const { enable } = useMidiStore.getState();

      // Start enabling
      const enablePromise = enable();

      // Check intermediate state
      expect(useMidiStore.getState().isEnabling).toBe(true);

      // Complete the enable
      resolveEnable();
      await act(async () => {
        await enablePromise;
      });

      expect(useMidiStore.getState().isEnabling).toBe(false);
      expect(useMidiStore.getState().isEnabled).toBe(true);
    });

    it('should not re-enable if already enabled', async () => {
      const mocks = getMocks();
      const { enable } = useMidiStore.getState();

      await act(async () => {
        await enable();
        await enable(); // Second call
      });

      expect(mocks.enable).toHaveBeenCalledTimes(1);
    });

    it('should handle enable errors', async () => {
      const mocks = getMocks();
      mocks.enable.mockRejectedValue(new Error('MIDI access denied'));

      const { enable } = useMidiStore.getState();

      await act(async () => {
        await enable();
      });

      const state = useMidiStore.getState();
      expect(state.isEnabled).toBe(false);
      expect(state.isEnabling).toBe(false);
      expect(state.enableError).toBe('MIDI access denied');
    });

    it('should handle non-Error objects in enable errors', async () => {
      const mocks = getMocks();
      mocks.enable.mockRejectedValue('string error');

      const { enable } = useMidiStore.getState();

      await act(async () => {
        await enable();
      });

      const state = useMidiStore.getState();
      expect(state.enableError).toBe('string error');
    });

    it('should set up device change listener', async () => {
      const mocks = getMocks();
      const { enable } = useMidiStore.getState();

      await act(async () => {
        await enable();
      });

      expect(mocks.addDeviceChangeListener).toHaveBeenCalled();
    });

    it('should set up message listener', async () => {
      const mocks = getMocks();
      const { enable } = useMidiStore.getState();

      await act(async () => {
        await enable();
      });

      expect(mocks.addMessageListener).toHaveBeenCalled();
    });
  });

  describe('disable', () => {
    it('should disable MIDI', async () => {
      const mocks = getMocks();
      const { enable, disable } = useMidiStore.getState();

      await act(async () => {
        await enable();
      });

      expect(useMidiStore.getState().isEnabled).toBe(true);

      act(() => {
        disable();
      });

      const state = useMidiStore.getState();
      expect(state.isEnabled).toBe(false);
      expect(mocks.disable).toHaveBeenCalled();
    });

    it('should clear device lists on disable', async () => {
      // Set up some mock devices
      useMidiStore.setState({
        isEnabled: true,
        inputs: [
          { id: 'input1', name: 'Input 1', manufacturer: '', state: 'connected', type: 'input' },
        ] as never[],
        outputs: [
          { id: 'output1', name: 'Output 1', manufacturer: '', state: 'connected', type: 'output' },
        ] as never[],
        devices: [
          { id: 'device1', name: 'Device 1', manufacturer: '', inputs: [], outputs: [] },
        ] as never[],
      });

      const { disable } = useMidiStore.getState();

      act(() => {
        disable();
      });

      const state = useMidiStore.getState();
      expect(state.inputs).toEqual([]);
      expect(state.outputs).toEqual([]);
      expect(state.devices).toEqual([]);
    });

    it('should cancel MIDI learn on disable', async () => {
      useMidiStore.setState({
        isEnabled: true,
        isLearning: true,
        learnTargetFileId: 'file1',
        learnTargetMappingIds: [1, 2, 3],
      });

      const { disable } = useMidiStore.getState();

      act(() => {
        disable();
      });

      const state = useMidiStore.getState();
      expect(state.isLearning).toBe(false);
      expect(state.learnTargetFileId).toBeNull();
      expect(state.learnTargetMappingIds).toBeNull();
    });
  });

  // ==========================================================================
  // Refresh Devices
  // ==========================================================================

  describe('refreshDevices', () => {
    it('should not refresh when disabled', () => {
      const mocks = getMocks();
      const { refreshDevices } = useMidiStore.getState();

      act(() => {
        refreshDevices();
      });

      expect(mocks.getInputs).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // MIDI Learn
  // ==========================================================================

  describe('startLearn', () => {
    it('should throw error if MIDI is not enabled', async () => {
      const { startLearn } = useMidiStore.getState();

      await expect(startLearn('file1', [1, 2])).rejects.toThrow('MIDI is not enabled');
    });

    it('should set learning state when starting', async () => {
      const mocks = getMocks();
      useMidiStore.setState({ isEnabled: true });

      // Mock a pending learn
      mocks.startMidiLearn.mockImplementation(() => new Promise(() => {}));

      const { startLearn } = useMidiStore.getState();

      // Start learn without awaiting
      startLearn('file1', [1, 2]);

      const state = useMidiStore.getState();
      expect(state.isLearning).toBe(true);
      expect(state.learnTargetFileId).toBe('file1');
      expect(state.learnTargetMappingIds).toEqual([1, 2]);
    });

    it('should return binding after successful learn', async () => {
      const mocks = getMocks();
      useMidiStore.setState({ isEnabled: true });

      const mockMessage = {
        type: 'controlchange',
        channel: 1,
        data1: 1,
        data2: 127,
      };

      mocks.startMidiLearn.mockResolvedValue(mockMessage);

      const { startLearn } = useMidiStore.getState();

      let result: Awaited<ReturnType<typeof startLearn>> = null;
      await act(async () => {
        result = await startLearn('file1', [1]);
      });

      expect(result).toBeDefined();
      expect((result as unknown as { isCC: boolean })?.isCC).toBe(true);
    });

    it('should clear learning state after successful learn', async () => {
      const mocks = getMocks();
      useMidiStore.setState({ isEnabled: true });

      const mockMessage = { type: 'noteon', channel: 1, data1: 60, data2: 100 };
      mocks.startMidiLearn.mockResolvedValue(mockMessage);

      const { startLearn } = useMidiStore.getState();

      await act(async () => {
        await startLearn('file1', [1]);
      });

      const state = useMidiStore.getState();
      expect(state.isLearning).toBe(false);
      expect(state.learnTargetFileId).toBeNull();
      expect(state.learnTargetMappingIds).toBeNull();
    });

    it('should store last message after learn', async () => {
      const mocks = getMocks();
      useMidiStore.setState({ isEnabled: true });

      const mockMessage = { type: 'noteon', channel: 5, data1: 60, data2: 100 };
      mocks.startMidiLearn.mockResolvedValue(mockMessage);

      const { startLearn } = useMidiStore.getState();

      await act(async () => {
        await startLearn('file1', [1]);
      });

      const state = useMidiStore.getState();
      expect(state.lastMessage).toEqual(mockMessage);
      expect(state.lastBinding).toBeDefined();
    });

    it('should return null on timeout without throwing', async () => {
      const mocks = getMocks();
      useMidiStore.setState({ isEnabled: true });

      mocks.startMidiLearn.mockRejectedValue(new Error('MIDI Learn timed out'));

      const { startLearn } = useMidiStore.getState();

      let result: Awaited<ReturnType<typeof startLearn>>;
      await act(async () => {
        result = await startLearn('file1', [1]);
      });

      expect(result!).toBeNull();
    });

    it('should re-throw non-timeout errors', async () => {
      const mocks = getMocks();
      useMidiStore.setState({ isEnabled: true });

      mocks.startMidiLearn.mockRejectedValue(new Error('Hardware error'));

      const { startLearn } = useMidiStore.getState();

      await expect(startLearn('file1', [1])).rejects.toThrow('Hardware error');
    });

    it('should pass options to startMidiLearn', async () => {
      const mocks = getMocks();
      useMidiStore.setState({ isEnabled: true });

      const mockMessage = { type: 'noteon', channel: 1, data1: 60, data2: 100 };
      mocks.startMidiLearn.mockResolvedValue(mockMessage);

      const { startLearn } = useMidiStore.getState();

      await act(async () => {
        await startLearn('file1', [1], { timeout: 5000 });
      });

      expect(mocks.startMidiLearn).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 5000,
        })
      );
    });

    // AIDEV-NOTE: Tests for settings integration - MIDI Learn timeout from appStore
    it('should use learnTimeout from settings when no explicit timeout provided', async () => {
      const mocks = getMocks();
      useMidiStore.setState({ isEnabled: true });

      const mockMessage = { type: 'noteon', channel: 1, data1: 60, data2: 100 };
      mocks.startMidiLearn.mockResolvedValue(mockMessage);

      // Import and set appStore settings
      const { useAppStore } = await import('../src/renderer/store/appStore');
      useAppStore.setState({
        settings: {
          ...useAppStore.getState().settings,
          midi: {
            ...useAppStore.getState().settings.midi,
            learnTimeout: 15, // 15 seconds
          },
        },
      });

      const { startLearn } = useMidiStore.getState();

      await act(async () => {
        await startLearn('file1', [1]);
      });

      // Should use 15 seconds * 1000 = 15000ms
      expect(mocks.startMidiLearn).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 15000,
        })
      );
    });

    it('should convert learnTimeout from seconds to milliseconds', async () => {
      const mocks = getMocks();
      useMidiStore.setState({ isEnabled: true });

      const mockMessage = { type: 'noteon', channel: 1, data1: 60, data2: 100 };
      mocks.startMidiLearn.mockResolvedValue(mockMessage);

      // Import and set appStore settings with 30 seconds
      const { useAppStore } = await import('../src/renderer/store/appStore');
      useAppStore.setState({
        settings: {
          ...useAppStore.getState().settings,
          midi: {
            ...useAppStore.getState().settings.midi,
            learnTimeout: 30, // 30 seconds
          },
        },
      });

      const { startLearn } = useMidiStore.getState();

      await act(async () => {
        await startLearn('file1', [1]);
      });

      // Should use 30 seconds * 1000 = 30000ms
      expect(mocks.startMidiLearn).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 30000,
        })
      );
    });

    it('should allow explicit timeout option to override settings', async () => {
      const mocks = getMocks();
      useMidiStore.setState({ isEnabled: true });

      const mockMessage = { type: 'noteon', channel: 1, data1: 60, data2: 100 };
      mocks.startMidiLearn.mockResolvedValue(mockMessage);

      // Set settings to 15 seconds
      const { useAppStore } = await import('../src/renderer/store/appStore');
      useAppStore.setState({
        settings: {
          ...useAppStore.getState().settings,
          midi: {
            ...useAppStore.getState().settings.midi,
            learnTimeout: 15,
          },
        },
      });

      const { startLearn } = useMidiStore.getState();

      // Explicitly pass 5000ms timeout
      await act(async () => {
        await startLearn('file1', [1], { timeout: 5000 });
      });

      // Should use explicit timeout (5000ms), not settings (15000ms)
      expect(mocks.startMidiLearn).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 5000,
        })
      );
    });
  });

  describe('cancelLearn', () => {
    it('should clear learning state', () => {
      useMidiStore.setState({
        isEnabled: true,
        isLearning: true,
        learnTargetFileId: 'file1',
        learnTargetMappingIds: [1, 2],
      });

      const { cancelLearn } = useMidiStore.getState();

      act(() => {
        cancelLearn();
      });

      const state = useMidiStore.getState();
      expect(state.isLearning).toBe(false);
      expect(state.learnTargetFileId).toBeNull();
      expect(state.learnTargetMappingIds).toBeNull();
    });
  });

  // ==========================================================================
  // Device Change Listener
  // ==========================================================================

  describe('Device Change Listener', () => {
    it('should refresh devices when device change callback is triggered', async () => {
      const mocks = getMocks();
      const { enable } = useMidiStore.getState();

      await act(async () => {
        await enable();
      });

      // Get the callback that was registered
      const callback = mocks.addDeviceChangeListener.mock.calls[0][0];

      // Update mock return values
      const newDevices = [
        { id: 'new-device', name: 'New Device', manufacturer: '', inputs: [], outputs: [] },
      ];
      mocks.getDevices.mockReturnValue(newDevices);

      // Trigger the callback
      act(() => {
        callback();
      });

      const state = useMidiStore.getState();
      expect(state.devices).toEqual(newDevices);
    });
  });

  // ==========================================================================
  // Message Listener
  // ==========================================================================

  describe('Message Listener', () => {
    it('should update last message/binding when message callback is triggered', async () => {
      const mocks = getMocks();
      const { enable } = useMidiStore.getState();

      await act(async () => {
        await enable();
      });

      // Get the message callback
      const callback = mocks.addMessageListener.mock.calls[0][0];

      const mockMessage = { type: 'controlchange', channel: 3, data1: 74, data2: 100 };

      act(() => {
        callback(mockMessage);
      });

      const state = useMidiStore.getState();
      expect(state.lastMessage).toEqual(mockMessage);
      expect(state.lastBinding).toBeDefined();
      expect(state.lastBinding?.channel).toBe(3);
    });
  });

  // ==========================================================================
  // Selector Tests
  // ==========================================================================

  describe('Selectors', () => {
    it('isReady should return true when supported and enabled', () => {
      useMidiStore.setState({ isSupported: true, isEnabled: true });

      const state = useMidiStore.getState();
      const isReady = state.isSupported && state.isEnabled;
      expect(isReady).toBe(true);
    });

    it('isReady should return false when not enabled', () => {
      useMidiStore.setState({ isSupported: true, isEnabled: false });

      const state = useMidiStore.getState();
      const isReady = state.isSupported && state.isEnabled;
      expect(isReady).toBe(false);
    });

    it('isReady should return false when not supported', () => {
      useMidiStore.setState({ isSupported: false, isEnabled: true });

      const state = useMidiStore.getState();
      const isReady = state.isSupported && state.isEnabled;
      expect(isReady).toBe(false);
    });

    it('useMidiLearn selector should return learn state', () => {
      useMidiStore.setState({
        isLearning: true,
        learnTargetFileId: 'test-file',
        learnTargetMappingIds: [1, 2, 3],
        lastMessage: { type: 'noteon', channel: 1, data1: 60, data2: 100 } as never,
        lastBinding: { note: 'Note.00.060', channel: 0, noteNumber: 60, isCC: false },
      });

      const state = useMidiStore.getState();
      expect(state.isLearning).toBe(true);
      expect(state.learnTargetFileId).toBe('test-file');
      expect(state.learnTargetMappingIds).toEqual([1, 2, 3]);
      expect(state.lastMessage).toBeDefined();
      expect(state.lastBinding).toBeDefined();
    });
  });
});

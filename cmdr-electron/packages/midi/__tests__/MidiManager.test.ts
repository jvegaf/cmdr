/**
 * Tests for MidiManager with WebMIDI mocks
 *
 * AIDEV-NOTE: Tests MidiManager using vitest stubbing. Since WebMIDI
 * relies on navigator.requestMIDIAccess which is browser-only, we use
 * a different approach: test the MidiManager methods directly where
 * possible and use vitest to stub the global navigator.
 *
 * Some tests are integration-style and verify behavior when enabled.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MidiManager } from "../src/MidiManager.js";

// ============================================================================
// WebMIDI Mock Setup
// ============================================================================

interface MockMidiInput {
	id: string;
	name: string | null;
	manufacturer: string | null;
	state: string;
	onmidimessage: ((event: { data: Uint8Array; timeStamp: number }) => void) | null;
}

interface MockMidiOutput {
	id: string;
	name: string | null;
	manufacturer: string | null;
	state: string;
}

interface MockMidiAccess {
	inputs: Map<string, MockMidiInput>;
	outputs: Map<string, MockMidiOutput>;
	onstatechange: ((event: unknown) => void) | null;
}

/**
 * Create a mock MIDI input
 */
function createMockInput(
	id: string,
	name: string,
	manufacturer = "Test Manufacturer"
): MockMidiInput {
	return {
		id,
		name,
		manufacturer,
		state: "connected",
		onmidimessage: null,
	};
}

/**
 * Create a mock MIDI output
 */
function createMockOutput(
	id: string,
	name: string,
	manufacturer = "Test Manufacturer"
): MockMidiOutput {
	return {
		id,
		name,
		manufacturer,
		state: "connected",
	};
}

/**
 * Create a mock MIDIAccess object
 */
function createMockMidiAccess(
	inputs: MockMidiInput[] = [],
	outputs: MockMidiOutput[] = []
): MockMidiAccess {
	return {
		inputs: new Map(inputs.map((i) => [i.id, i])),
		outputs: new Map(outputs.map((o) => [o.id, o])),
		onstatechange: null,
	};
}

// ============================================================================
// Tests
// ============================================================================

describe("MidiManager", () => {
	let mockMidiAccess: MockMidiAccess;
	let mockRequestMIDIAccess: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Create default mock with some devices
		const input1 = createMockInput("input-1", "Controller A");
		const input2 = createMockInput("input-2", "Controller B", "Other Manufacturer");
		const output1 = createMockOutput("output-1", "Controller A");
		const output2 = createMockOutput("output-2", "Synth");

		mockMidiAccess = createMockMidiAccess([input1, input2], [output1, output2]);
		mockRequestMIDIAccess = vi.fn().mockResolvedValue(mockMidiAccess);

		// Stub the global navigator
		vi.stubGlobal("navigator", {
			requestMIDIAccess: mockRequestMIDIAccess,
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	describe("isSupported()", () => {
		it("returns true when WebMIDI is available", () => {
			expect(MidiManager.isSupported()).toBe(true);
		});

		it("returns false when navigator is undefined", () => {
			vi.stubGlobal("navigator", undefined);
			expect(MidiManager.isSupported()).toBe(false);
		});

		it("returns false when requestMIDIAccess is not available", () => {
			vi.stubGlobal("navigator", {});
			expect(MidiManager.isSupported()).toBe(false);
		});
	});

	describe("enable()", () => {
		it("enables MIDI access", async () => {
			const manager = new MidiManager();
			expect(manager.enabled).toBe(false);

			await manager.enable();

			expect(manager.enabled).toBe(true);
		});

		it("calls requestMIDIAccess with sysex support", async () => {
			const manager = new MidiManager();
			await manager.enable();

			expect(mockRequestMIDIAccess).toHaveBeenCalledWith({ sysex: true });
		});

		it("is idempotent (multiple calls do not error)", async () => {
			const manager = new MidiManager();
			await manager.enable();
			await manager.enable();

			expect(manager.enabled).toBe(true);
			expect(mockRequestMIDIAccess).toHaveBeenCalledTimes(1);
		});

		it("throws when WebMIDI is not supported", async () => {
			vi.stubGlobal("navigator", undefined);

			const manager = new MidiManager();
			await expect(manager.enable()).rejects.toThrow("WebMIDI is not supported");
		});
	});

	describe("disable()", () => {
		it("disables MIDI access", async () => {
			const manager = new MidiManager();
			await manager.enable();
			expect(manager.enabled).toBe(true);

			manager.disable();

			expect(manager.enabled).toBe(false);
		});

		it("clears message listeners on inputs", async () => {
			const manager = new MidiManager();
			await manager.enable();

			// The mock inputs should have onmidimessage set
			const input = mockMidiAccess.inputs.get("input-1");
			expect(input?.onmidimessage).not.toBeNull();

			manager.disable();

			expect(input?.onmidimessage).toBeNull();
		});

		it("is idempotent (multiple calls do not error)", async () => {
			const manager = new MidiManager();
			await manager.enable();
			manager.disable();
			manager.disable();

			expect(manager.enabled).toBe(false);
		});

		it("works when never enabled", () => {
			const manager = new MidiManager();
			expect(() => manager.disable()).not.toThrow();
		});
	});

	describe("getInputs()", () => {
		it("returns empty array before enabling", () => {
			const manager = new MidiManager();
			expect(manager.getInputs()).toEqual([]);
		});

		it("returns list of input ports", async () => {
			const manager = new MidiManager();
			await manager.enable();

			const inputs = manager.getInputs();

			expect(inputs).toHaveLength(2);
			expect(inputs[0]).toEqual({
				id: "input-1",
				name: "Controller A",
				manufacturer: "Test Manufacturer",
				state: "connected",
				type: "input",
			});
			expect(inputs[1]).toEqual({
				id: "input-2",
				name: "Controller B",
				manufacturer: "Other Manufacturer",
				state: "connected",
				type: "input",
			});
		});
	});

	describe("getOutputs()", () => {
		it("returns empty array before enabling", () => {
			const manager = new MidiManager();
			expect(manager.getOutputs()).toEqual([]);
		});

		it("returns list of output ports", async () => {
			const manager = new MidiManager();
			await manager.enable();

			const outputs = manager.getOutputs();

			expect(outputs).toHaveLength(2);
			expect(outputs[0]).toEqual({
				id: "output-1",
				name: "Controller A",
				manufacturer: "Test Manufacturer",
				state: "connected",
				type: "output",
			});
			expect(outputs[1]).toEqual({
				id: "output-2",
				name: "Synth",
				manufacturer: "Test Manufacturer",
				state: "connected",
				type: "output",
			});
		});
	});

	describe("getDevices()", () => {
		it("returns empty array before enabling", () => {
			const manager = new MidiManager();
			expect(manager.getDevices()).toEqual([]);
		});

		it("combines inputs and outputs into devices", async () => {
			const manager = new MidiManager();
			await manager.enable();

			const devices = manager.getDevices();

			// Should have 3 devices: Controller A (in+out), Controller B (in only), Synth (out only)
			expect(devices).toHaveLength(3);

			const controllerA = devices.find((d) => d.name === "Controller A");
			expect(controllerA).toBeDefined();
			expect(controllerA?.inputs).toHaveLength(1);
			expect(controllerA?.outputs).toHaveLength(1);

			const controllerB = devices.find((d) => d.name === "Controller B");
			expect(controllerB).toBeDefined();
			expect(controllerB?.inputs).toHaveLength(1);
			expect(controllerB?.outputs).toHaveLength(0);

			const synth = devices.find((d) => d.name === "Synth");
			expect(synth).toBeDefined();
			expect(synth?.inputs).toHaveLength(0);
			expect(synth?.outputs).toHaveLength(1);
		});
	});

	describe("message listeners", () => {
		it("notifies listeners when MIDI message received", async () => {
			const manager = new MidiManager();
			await manager.enable();

			const listener = vi.fn();
			manager.addMessageListener(listener);

			// Simulate MIDI message from input
			const input = mockMidiAccess.inputs.get("input-1");
			input?.onmidimessage?.({
				data: new Uint8Array([0x90, 60, 100]),
				timeStamp: 1000,
			});

			expect(listener).toHaveBeenCalledTimes(1);
			const message = listener.mock.calls[0][0];
			expect(message.type).toBe("noteon");
			expect(message.data.note).toBe(60);
			expect(message.portId).toBe("input-1");
		});

		it("removes listeners correctly", async () => {
			const manager = new MidiManager();
			await manager.enable();

			const listener = vi.fn();
			manager.addMessageListener(listener);
			manager.removeMessageListener(listener);

			// Simulate MIDI message
			const input = mockMidiAccess.inputs.get("input-1");
			input?.onmidimessage?.({
				data: new Uint8Array([0x90, 60, 100]),
				timeStamp: 1000,
			});

			expect(listener).not.toHaveBeenCalled();
		});

		it("handles listener errors gracefully", async () => {
			const manager = new MidiManager();
			await manager.enable();

			const errorListener = vi.fn(() => {
				throw new Error("Listener error");
			});
			const goodListener = vi.fn();

			manager.addMessageListener(errorListener);
			manager.addMessageListener(goodListener);

			// Suppress console.error for this test
			const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

			// Should not throw, and should still call other listeners
			const input = mockMidiAccess.inputs.get("input-1");
			input?.onmidimessage?.({
				data: new Uint8Array([0x90, 60, 100]),
				timeStamp: 1000,
			});

			expect(errorListener).toHaveBeenCalled();
			expect(goodListener).toHaveBeenCalled();

			consoleError.mockRestore();
		});
	});

	describe("device change listeners", () => {
		it("notifies listeners when devices change", async () => {
			const manager = new MidiManager();
			await manager.enable();

			const listener = vi.fn();
			manager.addDeviceChangeListener(listener);

			// Simulate device state change
			mockMidiAccess.onstatechange?.({});

			expect(listener).toHaveBeenCalledTimes(1);
		});

		it("removes device change listeners correctly", async () => {
			const manager = new MidiManager();
			await manager.enable();

			const listener = vi.fn();
			manager.addDeviceChangeListener(listener);
			manager.removeDeviceChangeListener(listener);

			mockMidiAccess.onstatechange?.({});

			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe("startMidiLearn()", () => {
		it("resolves with first received message", async () => {
			const manager = new MidiManager();
			await manager.enable();

			const learnPromise = manager.startMidiLearn();

			// Simulate MIDI message
			const input = mockMidiAccess.inputs.get("input-1");
			input?.onmidimessage?.({
				data: new Uint8Array([0xb0, 1, 64]),
				timeStamp: 1000,
			});

			const message = await learnPromise;
			expect(message.type).toBe("controlchange");
			expect(message.data.controller).toBe(1);
		});

		it("filters by message type", async () => {
			const manager = new MidiManager();
			await manager.enable();

			const learnPromise = manager.startMidiLearn({
				messageTypes: ["controlchange"],
			});

			const input = mockMidiAccess.inputs.get("input-1");

			// Send Note On first (should be ignored)
			input?.onmidimessage?.({
				data: new Uint8Array([0x90, 60, 100]),
				timeStamp: 1000,
			});

			// Send CC (should be captured)
			input?.onmidimessage?.({
				data: new Uint8Array([0xb0, 1, 64]),
				timeStamp: 1001,
			});

			const message = await learnPromise;
			expect(message.type).toBe("controlchange");
		});

		it("filters by input port", async () => {
			const manager = new MidiManager();
			await manager.enable();

			const learnPromise = manager.startMidiLearn({
				inputId: "input-2",
			});

			// Send from input-1 (should be ignored)
			const input1 = mockMidiAccess.inputs.get("input-1");
			input1?.onmidimessage?.({
				data: new Uint8Array([0x90, 60, 100]),
				timeStamp: 1000,
			});

			// Send from input-2 (should be captured)
			const input2 = mockMidiAccess.inputs.get("input-2");
			input2?.onmidimessage?.({
				data: new Uint8Array([0x90, 48, 80]),
				timeStamp: 1001,
			});

			const message = await learnPromise;
			expect(message.portId).toBe("input-2");
			expect(message.data.note).toBe(48);
		});

		it("times out when specified", async () => {
			const manager = new MidiManager();
			await manager.enable();

			const learnPromise = manager.startMidiLearn({ timeout: 50 });

			await expect(learnPromise).rejects.toThrow("MIDI Learn timed out");
		});

		it("cleans up listener after receiving message", async () => {
			const manager = new MidiManager();
			await manager.enable();

			const learnPromise = manager.startMidiLearn();

			const input = mockMidiAccess.inputs.get("input-1");
			input?.onmidimessage?.({
				data: new Uint8Array([0x90, 60, 100]),
				timeStamp: 1000,
			});

			await learnPromise;

			// Verify no more listeners are active by checking the internal set size
			// Add an external listener and send another message
			const externalListener = vi.fn();
			manager.addMessageListener(externalListener);

			input?.onmidimessage?.({
				data: new Uint8Array([0x90, 62, 100]),
				timeStamp: 1002,
			});

			// Only our external listener should be called
			expect(externalListener).toHaveBeenCalledTimes(1);
		});
	});
});

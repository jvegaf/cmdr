/**
 * Tests for MidiMessage parsing
 *
 * AIDEV-NOTE: Tests MIDI message parsing without requiring actual WebMIDI.
 * MidiMessage.parse() works with raw byte arrays, so we can test it directly.
 */

import { describe, expect, it } from "vitest";

import { MidiMessage } from "../src/MidiMessage.js";

describe("MidiMessage", () => {
	describe("parse()", () => {
		const portId = "test-port-id";
		const portName = "Test Port";
		const timestamp = 1000;

		describe("Note On", () => {
			it("parses Note On messages", () => {
				// Note On: channel 1, note 60 (Middle C), velocity 100
				const raw = new Uint8Array([0x90, 60, 100]);
				const msg = MidiMessage.parse(raw, portId, portName, timestamp);

				expect(msg.type).toBe("noteon");
				expect(msg.channel).toBe(1);
				expect(msg.data.note).toBe(60);
				expect(msg.data.velocity).toBe(100);
				expect(msg.portId).toBe(portId);
				expect(msg.portName).toBe(portName);
			});

			it("parses Note On on different channels", () => {
				// Note On: channel 10 (0x99), note 36, velocity 127
				const raw = new Uint8Array([0x99, 36, 127]);
				const msg = MidiMessage.parse(raw, portId, portName, timestamp);

				expect(msg.type).toBe("noteon");
				expect(msg.channel).toBe(10);
				expect(msg.data.note).toBe(36);
				expect(msg.data.velocity).toBe(127);
			});

			it("treats Note On with velocity 0 as Note Off", () => {
				const raw = new Uint8Array([0x90, 60, 0]);
				const msg = MidiMessage.parse(raw, portId, portName, timestamp);

				expect(msg.type).toBe("noteoff");
				expect(msg.data.note).toBe(60);
				expect(msg.data.velocity).toBe(0);
			});
		});

		describe("Note Off", () => {
			it("parses Note Off messages", () => {
				// Note Off: channel 1, note 60, velocity 64
				const raw = new Uint8Array([0x80, 60, 64]);
				const msg = MidiMessage.parse(raw, portId, portName, timestamp);

				expect(msg.type).toBe("noteoff");
				expect(msg.channel).toBe(1);
				expect(msg.data.note).toBe(60);
				expect(msg.data.velocity).toBe(64);
			});
		});

		describe("Control Change", () => {
			it("parses CC messages", () => {
				// CC: channel 1, controller 1 (Mod Wheel), value 64
				const raw = new Uint8Array([0xb0, 1, 64]);
				const msg = MidiMessage.parse(raw, portId, portName, timestamp);

				expect(msg.type).toBe("controlchange");
				expect(msg.channel).toBe(1);
				expect(msg.data.controller).toBe(1);
				expect(msg.data.value).toBe(64);
			});

			it("parses CC on channel 16", () => {
				// CC: channel 16 (0xBF), controller 74 (brightness), value 127
				const raw = new Uint8Array([0xbf, 74, 127]);
				const msg = MidiMessage.parse(raw, portId, portName, timestamp);

				expect(msg.type).toBe("controlchange");
				expect(msg.channel).toBe(16);
				expect(msg.data.controller).toBe(74);
				expect(msg.data.value).toBe(127);
			});
		});

		describe("Program Change", () => {
			it("parses Program Change messages", () => {
				// Program Change: channel 1, program 0
				const raw = new Uint8Array([0xc0, 0]);
				const msg = MidiMessage.parse(raw, portId, portName, timestamp);

				expect(msg.type).toBe("programchange");
				expect(msg.channel).toBe(1);
				expect(msg.data.program).toBe(0);
			});

			it("parses Program Change with high program number", () => {
				// Program Change: channel 5, program 127
				const raw = new Uint8Array([0xc4, 127]);
				const msg = MidiMessage.parse(raw, portId, portName, timestamp);

				expect(msg.type).toBe("programchange");
				expect(msg.channel).toBe(5);
				expect(msg.data.program).toBe(127);
			});
		});

		describe("Pitch Bend", () => {
			it("parses Pitch Bend at center", () => {
				// Pitch Bend center: LSB=0, MSB=64 (8192 - 8192 = 0)
				const raw = new Uint8Array([0xe0, 0, 64]);
				const msg = MidiMessage.parse(raw, portId, portName, timestamp);

				expect(msg.type).toBe("pitchbend");
				expect(msg.channel).toBe(1);
				expect(msg.data.pitchBend).toBe(0);
			});

			it("parses Pitch Bend max up", () => {
				// Pitch Bend max: LSB=127, MSB=127 (16383 - 8192 = 8191)
				const raw = new Uint8Array([0xe0, 127, 127]);
				const msg = MidiMessage.parse(raw, portId, portName, timestamp);

				expect(msg.type).toBe("pitchbend");
				expect(msg.data.pitchBend).toBe(8191);
			});

			it("parses Pitch Bend max down", () => {
				// Pitch Bend min: LSB=0, MSB=0 (0 - 8192 = -8192)
				const raw = new Uint8Array([0xe0, 0, 0]);
				const msg = MidiMessage.parse(raw, portId, portName, timestamp);

				expect(msg.type).toBe("pitchbend");
				expect(msg.data.pitchBend).toBe(-8192);
			});
		});

		describe("Aftertouch", () => {
			it("parses Polyphonic Aftertouch", () => {
				// Poly AT: channel 1, note 60, pressure 100
				const raw = new Uint8Array([0xa0, 60, 100]);
				const msg = MidiMessage.parse(raw, portId, portName, timestamp);

				expect(msg.type).toBe("aftertouch");
				expect(msg.channel).toBe(1);
				expect(msg.data.note).toBe(60);
				expect(msg.data.pressure).toBe(100);
			});

			it("parses Channel Aftertouch", () => {
				// Channel AT: channel 1, pressure 80
				const raw = new Uint8Array([0xd0, 80]);
				const msg = MidiMessage.parse(raw, portId, portName, timestamp);

				expect(msg.type).toBe("channelaftertouch");
				expect(msg.channel).toBe(1);
				expect(msg.data.pressure).toBe(80);
			});
		});

		describe("System Messages", () => {
			it("parses SysEx start", () => {
				// SysEx message
				const raw = new Uint8Array([0xf0, 0x7e, 0x00, 0x06, 0x01, 0xf7]);
				const msg = MidiMessage.parse(raw, portId, portName, timestamp);

				expect(msg.type).toBe("sysex");
				expect(msg.channel).toBe(0); // SysEx has no channel
			});
		});

		describe("Unknown messages", () => {
			it("handles empty data", () => {
				const raw = new Uint8Array([]);
				const msg = MidiMessage.parse(raw, portId, portName, timestamp);

				expect(msg.type).toBe("unknown");
			});
		});
	});

	describe("toString()", () => {
		const portId = "test";
		const portName = "Test";
		const timestamp = 0;

		it("formats Note On", () => {
			const raw = new Uint8Array([0x90, 60, 100]);
			const msg = MidiMessage.parse(raw, portId, portName, timestamp);

			expect(msg.toString()).toBe("Note On: ch1 note=60 vel=100");
		});

		it("formats Note Off", () => {
			const raw = new Uint8Array([0x80, 60, 64]);
			const msg = MidiMessage.parse(raw, portId, portName, timestamp);

			expect(msg.toString()).toBe("Note Off: ch1 note=60");
		});

		it("formats CC", () => {
			const raw = new Uint8Array([0xb0, 1, 64]);
			const msg = MidiMessage.parse(raw, portId, portName, timestamp);

			expect(msg.toString()).toBe("CC: ch1 cc=1 val=64");
		});

		it("formats Program Change", () => {
			const raw = new Uint8Array([0xc0, 5]);
			const msg = MidiMessage.parse(raw, portId, portName, timestamp);

			expect(msg.toString()).toBe("Program: ch1 prog=5");
		});

		it("formats Pitch Bend", () => {
			const raw = new Uint8Array([0xe0, 0, 64]);
			const msg = MidiMessage.parse(raw, portId, portName, timestamp);

			expect(msg.toString()).toBe("Pitch Bend: ch1 val=0");
		});

		it("formats SysEx", () => {
			const raw = new Uint8Array([0xf0, 0x7e, 0x00, 0xf7]);
			const msg = MidiMessage.parse(raw, portId, portName, timestamp);

			expect(msg.toString()).toBe("SysEx: 4 bytes");
		});
	});

	describe("raw data access", () => {
		it("preserves raw bytes", () => {
			const raw = new Uint8Array([0x90, 60, 100]);
			const msg = MidiMessage.parse(raw, "port", "Port", 0);

			expect(msg.raw).toEqual(raw);
		});

		it("provides data object access", () => {
			const raw = new Uint8Array([0xb0, 7, 100]);
			const msg = MidiMessage.parse(raw, "port", "Port", 0);

			expect(msg.data.type).toBe("controlchange");
			expect(msg.data.controller).toBe(7);
			expect(msg.data.value).toBe(100);
			expect(msg.data.portId).toBe("port");
		});
	});
});

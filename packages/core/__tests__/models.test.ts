/**
 * Tests for high-level model classes (Device, Mapping)
 *
 * AIDEV-NOTE: These tests verify the object-oriented model layer that wraps
 * the raw binary format structures. Tests cover:
 * - Factory methods and creation
 * - Property access and mutation
 * - Mapping operations (add, remove, move)
 * - Condition handling
 * - MIDI binding resolution
 * - Copy/clone operations
 * - Integration with real TSI fixtures
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import {
	// Device exports
	DEVICE_TYPE_GENERIC_KEYBOARD,
	DEVICE_TYPE_GENERIC_MIDI,
	Device,
	// Mapping exports
	Mapping,
	PROPRIETARY_DEVICE_TYPES,
	// TsiFile exports
	TsiFile,
	createMidiNoteString,
	getControlTypeName,
	getDeviceTargetName,
	getDeviceTypeName,
	getInteractionModeName,
	getTargetDeckName,
	isGenericMidiDevice,
	parseMidiNoteString,
} from "../src/index.js";

import {
	DeviceTarget,
	MappingControlType,
	MappingInteractionMode,
	MappingTargetDeck,
	MappingType,
} from "../src/enums/index.js";

// ============================================================================
// Helper to load fixtures
// ============================================================================

const fixturesDir = join(__dirname, "fixtures");

async function loadFixture(filename: string): Promise<Buffer> {
	return readFile(join(fixturesDir, filename));
}

// ============================================================================
// Mapping Class Tests
// ============================================================================

describe("Mapping", () => {
	describe("create()", () => {
		it("creates a new empty mapping with default type", () => {
			const mapping = Mapping.create();

			expect(mapping).toBeInstanceOf(Mapping);
			expect(mapping.type).toBe(MappingType.In);
			expect(mapping.commandId).toBe(0);
			expect(mapping.comment).toBe("");
		});

		it("creates a mapping with specified type", () => {
			const outMapping = Mapping.create(MappingType.Out);

			expect(outMapping.type).toBe(MappingType.Out);
			expect(outMapping.isOutput).toBe(true);
			expect(outMapping.isInput).toBe(false);
		});

		it("creates a mapping with specified command ID", () => {
			const mapping = Mapping.create(MappingType.In, 123);

			expect(mapping.commandId).toBe(123);
			expect(mapping.command).toBeDefined();
		});
	});

	describe("basic properties", () => {
		it("provides access to type and direction", () => {
			const inMapping = Mapping.create(MappingType.In);
			const outMapping = Mapping.create(MappingType.Out);

			expect(inMapping.isInput).toBe(true);
			expect(inMapping.isOutput).toBe(false);
			expect(outMapping.isInput).toBe(false);
			expect(outMapping.isOutput).toBe(true);
		});

		it("allows setting comment", () => {
			const mapping = Mapping.create();
			expect(mapping.comment).toBe("");

			mapping.comment = "Test comment";
			expect(mapping.comment).toBe("Test comment");
			expect(mapping.rawData.settings.comment).toBe("Test comment");
		});

		it("allows setting command ID", () => {
			const mapping = Mapping.create();
			mapping.commandId = 456;

			expect(mapping.commandId).toBe(456);
			expect(mapping.command.id).toBe(456);
		});

		it("resolves command description", () => {
			// Command ID 1 = "Play/Pause" (common command)
			const mapping = Mapping.create(MappingType.In, 1);

			expect(mapping.command).toBeDefined();
			expect(mapping.commandName).toBeTruthy();
		});
	});

	describe("control settings", () => {
		it("allows setting control type", () => {
			const mapping = Mapping.create();
			mapping.controlType = MappingControlType.Fader;

			expect(mapping.controlType).toBe(MappingControlType.Fader);
		});

		it("allows setting interaction mode", () => {
			const mapping = Mapping.create();
			mapping.interactionMode = MappingInteractionMode.Toggle;

			expect(mapping.interactionMode).toBe(MappingInteractionMode.Toggle);
		});

		it("allows setting target deck", () => {
			const mapping = Mapping.create();
			mapping.target = MappingTargetDeck.DeckA;

			expect(mapping.target).toBe(MappingTargetDeck.DeckA);
		});

		it("allows toggling auto-repeat", () => {
			const mapping = Mapping.create();
			expect(mapping.autoRepeat).toBe(false);

			mapping.autoRepeat = true;
			expect(mapping.autoRepeat).toBe(true);
		});

		it("allows toggling invert", () => {
			const mapping = Mapping.create();
			expect(mapping.invert).toBe(false);

			mapping.invert = true;
			expect(mapping.invert).toBe(true);
		});

		it("allows toggling soft takeover", () => {
			const mapping = Mapping.create();
			expect(mapping.softTakeover).toBe(false);

			mapping.softTakeover = true;
			expect(mapping.softTakeover).toBe(true);
		});
	});

	describe("conditions", () => {
		it("starts with no conditions", () => {
			const mapping = Mapping.create();

			expect(mapping.condition1).toBeNull();
			expect(mapping.condition2).toBeNull();
			expect(mapping.hasConditions).toBe(false);
		});

		it("allows setting condition 1", () => {
			const mapping = Mapping.create();
			mapping.setCondition1(1, MappingTargetDeck.DeckA);

			const cond1 = mapping.condition1;
			expect(cond1).not.toBeNull();
			expect(cond1?.id).toBe(1);
			expect(cond1?.target).toBe(MappingTargetDeck.DeckA);
			expect(mapping.hasConditions).toBe(true);
		});

		it("allows setting condition 2", () => {
			const mapping = Mapping.create();
			mapping.setCondition2(2, MappingTargetDeck.DeckB);

			const cond2 = mapping.condition2;
			expect(cond2).not.toBeNull();
			expect(cond2?.id).toBe(2);
			expect(cond2?.target).toBe(MappingTargetDeck.DeckB);
			expect(mapping.hasConditions).toBe(true);
		});

		it("allows clearing condition 1", () => {
			const mapping = Mapping.create();
			mapping.setCondition1(1);
			expect(mapping.condition1).not.toBeNull();

			mapping.clearCondition1();
			expect(mapping.condition1).toBeNull();
		});

		it("allows clearing all conditions", () => {
			const mapping = Mapping.create();
			mapping.setCondition1(1);
			mapping.setCondition2(2);

			mapping.clearConditions();
			expect(mapping.condition1).toBeNull();
			expect(mapping.condition2).toBeNull();
			expect(mapping.hasConditions).toBe(false);
		});

		it("resolves condition descriptions", () => {
			const mapping = Mapping.create();
			// Condition ID 1 should be a valid condition
			mapping.setCondition1(1);

			const cond1 = mapping.condition1;
			expect(cond1).not.toBeNull();
			expect(cond1?.description).not.toBeNull();
		});
	});

	describe("copy()", () => {
		it("creates a deep copy", () => {
			const original = Mapping.create(MappingType.In, 123);
			original.comment = "Original";
			original.controlType = MappingControlType.Encoder;
			original.setCondition1(1);

			const copy = original.copy();

			// Verify it's a separate object
			expect(copy).not.toBe(original);
			expect(copy.rawData).not.toBe(original.rawData);

			// Verify values are copied
			expect(copy.type).toBe(original.type);
			expect(copy.commandId).toBe(original.commandId);
			expect(copy.comment).toBe(original.comment);
			expect(copy.controlType).toBe(original.controlType);
			expect(copy.condition1?.id).toBe(original.condition1?.id);
		});

		it("resets MIDI binding by default", () => {
			const original = Mapping.create();
			// Simulate having a binding ID
			original.rawData.midiNoteBindingId = 42;

			const copy = original.copy();

			expect(copy.id).toBe(-1); // Binding ID reset
			expect(copy.midiBinding).toBeNull();
		});

		it("can preserve MIDI binding if requested", () => {
			const original = Mapping.create();
			original.rawData.midiNoteBindingId = 42;

			const copy = original.copy(true);

			expect(copy.id).toBe(42);
		});

		it("does not affect original when modifying copy", () => {
			const original = Mapping.create();
			original.comment = "Original";

			const copy = original.copy();
			copy.comment = "Modified";

			expect(original.comment).toBe("Original");
			expect(copy.comment).toBe("Modified");
		});
	});
});

// ============================================================================
// Mapping Helper Functions Tests
// ============================================================================

describe("Mapping helper functions", () => {
	describe("parseMidiNoteString()", () => {
		it("parses CC note strings", () => {
			const binding = parseMidiNoteString("CC.00.064");

			expect(binding).not.toBeNull();
			expect(binding?.isCC).toBe(true);
			expect(binding?.channel).toBe(0);
			expect(binding?.noteNumber).toBe(64);
			expect(binding?.note).toBe("CC.00.064");
		});

		it("parses Note note strings", () => {
			const binding = parseMidiNoteString("Note.01.060");

			expect(binding).not.toBeNull();
			expect(binding?.isCC).toBe(false);
			expect(binding?.channel).toBe(1);
			expect(binding?.noteNumber).toBe(60);
		});

		it("handles invalid strings", () => {
			expect(parseMidiNoteString("")).toBeNull();
			expect(parseMidiNoteString("invalid")).toBeNull();
			expect(parseMidiNoteString("CC.00")).toBeNull();
			expect(parseMidiNoteString("CC.xx.064")).toBeNull();
		});
	});

	describe("createMidiNoteString()", () => {
		it("creates CC note strings", () => {
			const noteStr = createMidiNoteString(true, 0, 64);
			expect(noteStr).toBe("CC.00.064");
		});

		it("creates Note note strings", () => {
			const noteStr = createMidiNoteString(false, 15, 127);
			expect(noteStr).toBe("Note.15.127");
		});

		it("pads channel and note correctly", () => {
			const noteStr = createMidiNoteString(true, 1, 1);
			expect(noteStr).toBe("CC.01.001");
		});
	});

	describe("getTargetDeckName()", () => {
		it("returns readable deck names", () => {
			expect(getTargetDeckName(MappingTargetDeck.DeviceTarget)).toBe(
				"Device Target",
			);
			expect(getTargetDeckName(MappingTargetDeck.DeckA)).toBe("Deck A");
			expect(getTargetDeckName(MappingTargetDeck.DeckB)).toBe("Deck B");
			expect(getTargetDeckName(MappingTargetDeck.DeckC)).toBe("Deck C");
			expect(getTargetDeckName(MappingTargetDeck.DeckD)).toBe("Deck D");
		});
	});

	describe("getControlTypeName()", () => {
		it("is re-exported from controls module", () => {
			expect(typeof getControlTypeName).toBe("function");
		});
	});

	describe("getInteractionModeName()", () => {
		it("is re-exported from controls module", () => {
			expect(typeof getInteractionModeName).toBe("function");
		});
	});
});

// ============================================================================
// Device Class Tests
// ============================================================================

describe("Device", () => {
	describe("create()", () => {
		it("creates a new empty device", () => {
			const device = Device.create();

			expect(device).toBeInstanceOf(Device);
			expect(device.deviceType).toBe(DEVICE_TYPE_GENERIC_MIDI);
			expect(device.mappingCount).toBe(0);
		});

		it("creates device with custom type", () => {
			const device = Device.create("Traktor.Kontrol S4 MK3");

			expect(device.deviceType).toBe("Traktor.Kontrol S4 MK3");
		});

		it("creates device with Traktor version", () => {
			const device = Device.create(DEVICE_TYPE_GENERIC_MIDI, "3.11.0");

			expect(device.traktorVersion).toBe("3.11.0");
		});
	});

	describe("createGenericMidi()", () => {
		it("creates a generic MIDI device", () => {
			const device = Device.createGenericMidi();

			expect(device.deviceType).toBe(DEVICE_TYPE_GENERIC_MIDI);
			expect(device.isGenericMidi).toBe(true);
			expect(device.isKeyboard).toBe(false);
		});
	});

	describe("createKeyboard()", () => {
		it("creates a keyboard device", () => {
			const device = Device.createKeyboard();

			expect(device.deviceType).toBe(DEVICE_TYPE_GENERIC_KEYBOARD);
			expect(device.isKeyboard).toBe(true);
		});
	});

	describe("basic properties", () => {
		it("provides device type access", () => {
			const device = Device.createGenericMidi();

			expect(device.deviceType).toBe(DEVICE_TYPE_GENERIC_MIDI);
			expect(device.typeStr).toBe(DEVICE_TYPE_GENERIC_MIDI);
		});

		it("allows setting device type", () => {
			const device = Device.create();
			device.deviceType = "Custom Device";

			expect(device.deviceType).toBe("Custom Device");
		});

		it("allows setting keyboard flag", () => {
			const device = Device.create();
			expect(device.isKeyboard).toBe(false);

			device.isKeyboard = true;
			expect(device.isKeyboard).toBe(true);
		});

		it("allows setting comment", () => {
			const device = Device.create();
			expect(device.comment).toBe("");

			device.comment = "Test device";
			expect(device.comment).toBe("Test device");
		});

		it("allows setting ports", () => {
			const device = Device.create();

			device.inPort = "MIDI In Port";
			device.outPort = "MIDI Out Port";

			expect(device.inPort).toBe("MIDI In Port");
			expect(device.outPort).toBe("MIDI Out Port");
		});

		it("allows setting target", () => {
			const device = Device.create();
			device.target = DeviceTarget.FocusedDeck;

			expect(device.target).toBe(DeviceTarget.FocusedDeck);
		});

		it("allows setting Traktor version", () => {
			const device = Device.create();
			device.traktorVersion = "3.12.0";

			expect(device.traktorVersion).toBe("3.12.0");
		});
	});

	describe("revision", () => {
		it("provides revision number", () => {
			const device = Device.create();
			expect(typeof device.revision).toBe("number");
		});

		it("increments revision", () => {
			const device = Device.create();
			const initialRevision = device.revision;

			device.incrementRevision();

			expect(device.revision).toBe(initialRevision + 1);
		});
	});

	describe("mapping operations", () => {
		it("starts with empty mappings", () => {
			const device = Device.create();

			expect(device.mappings).toEqual([]);
			expect(device.mappingCount).toBe(0);
		});

		it("adds mappings", () => {
			const device = Device.create();
			const mapping = Mapping.create(MappingType.In, 1);

			device.addMapping(mapping);

			expect(device.mappingCount).toBe(1);
			expect(device.mappings[0]).toBe(mapping);
		});

		it("assigns binding IDs when adding mappings", () => {
			const device = Device.create();
			const mapping1 = Mapping.create();
			const mapping2 = Mapping.create();

			device.addMapping(mapping1);
			device.addMapping(mapping2);

			// Each mapping should have a unique binding ID
			expect(mapping1.id).toBeGreaterThan(0);
			expect(mapping2.id).toBeGreaterThan(0);
			expect(mapping1.id).not.toBe(mapping2.id);
		});

		it("inserts mapping at index", () => {
			const device = Device.create();
			const mapping1 = Mapping.create(MappingType.In, 1);
			const mapping2 = Mapping.create(MappingType.In, 2);
			const mapping3 = Mapping.create(MappingType.In, 3);

			device.addMapping(mapping1);
			device.addMapping(mapping3);
			device.insertMapping(1, mapping2);

			expect(device.mappings[0]?.commandId).toBe(1);
			expect(device.mappings[1]?.commandId).toBe(2);
			expect(device.mappings[2]?.commandId).toBe(3);
		});

		it("gets mapping by index", () => {
			const device = Device.create();
			const mapping = Mapping.create();
			device.addMapping(mapping);

			expect(device.getMapping(0)).toBe(mapping);
			expect(device.getMapping(99)).toBeUndefined();
		});

		it("gets mapping by ID", () => {
			const device = Device.create();
			const mapping = Mapping.create();
			device.addMapping(mapping);

			const found = device.getMappingById(mapping.id);
			expect(found).toBe(mapping);
		});

		it("removes mapping by ID", () => {
			const device = Device.create();
			const mapping = Mapping.create();
			device.addMapping(mapping);
			const id = mapping.id;

			const removed = device.removeMapping(id);

			expect(removed).toBe(true);
			expect(device.mappingCount).toBe(0);
		});

		it("removes mapping at index", () => {
			const device = Device.create();
			device.addMapping(Mapping.create());
			device.addMapping(Mapping.create());

			const removed = device.removeMappingAt(0);

			expect(removed).toBe(true);
			expect(device.mappingCount).toBe(1);
		});

		it("returns false when removing non-existent mapping", () => {
			const device = Device.create();

			expect(device.removeMapping(999)).toBe(false);
			expect(device.removeMappingAt(-1)).toBe(false);
			expect(device.removeMappingAt(0)).toBe(false);
		});

		it("moves mapping within the list", () => {
			const device = Device.create();
			const mapping1 = Mapping.create(MappingType.In, 1);
			const mapping2 = Mapping.create(MappingType.In, 2);
			const mapping3 = Mapping.create(MappingType.In, 3);

			device.addMapping(mapping1);
			device.addMapping(mapping2);
			device.addMapping(mapping3);

			// Move first mapping to end (remove at 0, insert at 2)
			// Start: [1, 2, 3] -> Remove at 0: [2, 3] -> Insert at 2: [2, 3, 1]
			device.moveMapping(0, 2);

			expect(device.mappings[0]?.commandId).toBe(2);
			expect(device.mappings[1]?.commandId).toBe(3);
			expect(device.mappings[2]?.commandId).toBe(1);
		});

		it("creates a new mapping with command", () => {
			const device = Device.create();
			const mapping = device.createMapping(123);

			expect(mapping.commandId).toBe(123);
		});
	});

	describe("syncToRawData()", () => {
		it("syncs mappings back to raw data", () => {
			const device = Device.create();
			const mapping = Mapping.create(MappingType.In, 42);
			device.addMapping(mapping);

			// Modify mapping
			mapping.comment = "Synced comment";

			device.syncToRawData();

			// Raw data should reflect the changes
			expect(device.rawData.data.mappings?.mappings[0]?.settings.comment).toBe(
				"Synced comment",
			);
		});
	});

	describe("copy()", () => {
		it("creates a deep copy with mappings", () => {
			const original = Device.create();
			original.comment = "Original device";
			original.addMapping(Mapping.create(MappingType.In, 1));
			original.addMapping(Mapping.create(MappingType.In, 2));

			const copy = original.copy();

			expect(copy).not.toBe(original);
			expect(copy.comment).toBe(original.comment);
			expect(copy.mappingCount).toBe(original.mappingCount);
		});

		it("resets revision for copy", () => {
			const original = Device.create();
			original.incrementRevision();
			original.incrementRevision();

			const copy = original.copy();

			expect(copy.revision).toBe(0);
		});

		it("can copy without mappings", () => {
			const original = Device.create();
			original.addMapping(Mapping.create());
			original.addMapping(Mapping.create());

			const copy = original.copy(false);

			expect(copy.mappingCount).toBe(0);
		});

		it("does not affect original when modifying copy", () => {
			const original = Device.create();
			original.comment = "Original";

			const copy = original.copy();
			copy.comment = "Modified";

			expect(original.comment).toBe("Original");
			expect(copy.comment).toBe("Modified");
		});
	});
});

// ============================================================================
// Device Helper Functions Tests
// ============================================================================

describe("Device helper functions", () => {
	describe("isGenericMidiDevice()", () => {
		it("returns true for generic MIDI", () => {
			expect(isGenericMidiDevice(DEVICE_TYPE_GENERIC_MIDI)).toBe(true);
			expect(isGenericMidiDevice("My Custom Controller")).toBe(true);
		});

		it("returns false for proprietary devices", () => {
			for (const deviceType of PROPRIETARY_DEVICE_TYPES) {
				expect(isGenericMidiDevice(deviceType)).toBe(false);
			}
		});
	});

	describe("getDeviceTypeName()", () => {
		it("returns generic MIDI name as-is", () => {
			expect(getDeviceTypeName(DEVICE_TYPE_GENERIC_MIDI)).toBe("Generic MIDI");
		});

		it("strips Traktor. prefix", () => {
			expect(getDeviceTypeName("Traktor.Kontrol S4 MK3")).toBe(
				"Kontrol S4 MK3",
			);
		});

		it("strips Pioneer. prefix", () => {
			expect(getDeviceTypeName("Pioneer.DDJ-T1")).toBe("DDJ-T1");
		});

		it("returns unknown types as-is", () => {
			expect(getDeviceTypeName("Custom Controller")).toBe("Custom Controller");
		});
	});

	describe("getDeviceTargetName()", () => {
		it("returns readable target names", () => {
			expect(getDeviceTargetName(DeviceTarget.None)).toBe("None");
			expect(getDeviceTargetName(DeviceTarget.FocusedDeck)).toBe("Focused Deck");
		});
	});

	describe("PROPRIETARY_DEVICE_TYPES", () => {
		it("contains known NI and Pioneer devices", () => {
			expect(PROPRIETARY_DEVICE_TYPES).toContain("Traktor.Kontrol S4 MK3");
			expect(PROPRIETARY_DEVICE_TYPES).toContain("Traktor.Kontrol S8");
			expect(PROPRIETARY_DEVICE_TYPES).toContain("Pioneer.DDJ-T1");
			expect(PROPRIETARY_DEVICE_TYPES).toContain("Generic Keyboard");
		});
	});
});

// ============================================================================
// Integration Tests with Real Fixtures
// ============================================================================

describe("Models with real TSI fixtures", () => {
	let loadedTsi: TsiFile;

	beforeAll(async () => {
		// Load a TSI file with multiple mappings
		const buffer = await loadFixture("encoder mode demo.tsi");
		loadedTsi = TsiFile.fromXml(buffer.toString("utf-8"));
	});

	it("wraps devices from loaded TSI file", () => {
		const devices = loadedTsi.devices;
		expect(devices.length).toBeGreaterThan(0);

		const firstDevice = devices[0];
		expect(firstDevice).toBeDefined();

		const device = Device.fromRawData(firstDevice);
		expect(device).toBeInstanceOf(Device);
		expect(device.deviceType).toBeTruthy();
	});

	it("wraps mappings from loaded device", () => {
		const devices = loadedTsi.devices;
		const firstDevice = devices[0];
		expect(firstDevice).toBeDefined();

		const device = Device.fromRawData(firstDevice);

		expect(device.mappingCount).toBeGreaterThan(0);

		for (const mapping of device.mappings) {
			expect(mapping).toBeInstanceOf(Mapping);
			expect(mapping.commandId).toBeGreaterThanOrEqual(0);
		}
	});

	it("resolves command names for mappings", () => {
		const firstDevice = loadedTsi.devices[0];
		expect(firstDevice).toBeDefined();

		const device = Device.fromRawData(firstDevice);

		// At least some mappings should have resolved command names
		const mappingsWithNames = device.mappings.filter(
			(m) => m.commandName && !m.commandName.startsWith("Unknown"),
		);

		expect(mappingsWithNames.length).toBeGreaterThan(0);
	});

	it("resolves MIDI bindings for mappings", () => {
		const firstDevice = loadedTsi.devices[0];
		expect(firstDevice).toBeDefined();

		const device = Device.fromRawData(firstDevice);

		// Check if any mappings have MIDI bindings
		const mappingsWithBindings = device.mappings.filter(
			(m) => m.hasMidiBinding,
		);

		// The encoder demo should have MIDI bindings
		if (mappingsWithBindings.length > 0) {
			for (const mapping of mappingsWithBindings) {
				expect(mapping.midiBinding).not.toBeNull();
				expect(mapping.midiBinding?.note).toBeTruthy();
			}
		}
	});

	it("preserves conditions from loaded mappings", async () => {
		// Load a file known to have conditions
		const buffer = await loadFixture(
			"timecode_mode__1st_abs__2nd_rel___3rd___4th_hap.tsi",
		);
		const tsi = TsiFile.fromXml(buffer.toString("utf-8"));
		const firstDevice = tsi.devices[0];
		expect(firstDevice).toBeDefined();

		const device = Device.fromRawData(firstDevice);

		// Check if any mappings have conditions
		const mappingsWithConditions = device.mappings.filter(
			(m) => m.hasConditions,
		);

		expect(mappingsWithConditions.length).toBeGreaterThan(0);
	});

	it("allows modifying loaded device and syncing back", () => {
		const firstDevice = loadedTsi.devices[0];
		expect(firstDevice).toBeDefined();

		const device = Device.fromRawData(firstDevice);
		const originalComment = device.comment;

		device.comment = "Modified by test";

		expect(device.rawData.data.comment).toBe("Modified by test");

		// Restore
		device.comment = originalComment;
	});

	it("can add new mappings to loaded device", () => {
		const firstDevice = loadedTsi.devices[0];
		expect(firstDevice).toBeDefined();

		const device = Device.fromRawData(firstDevice);
		const originalCount = device.mappingCount;

		const newMapping = Mapping.create(MappingType.In, 999);
		newMapping.comment = "New test mapping";
		device.addMapping(newMapping);

		expect(device.mappingCount).toBe(originalCount + 1);
		expect(device.mappings[device.mappingCount - 1]?.comment).toBe(
			"New test mapping",
		);
	});
});

// ============================================================================
// Additional Fixture Tests
// ============================================================================

describe("Models with various TSI fixtures", () => {
	it("handles TP3.0 new commands file", async () => {
		const buffer = await loadFixture("TP3.0 new commands.tsi");
		const tsi = TsiFile.fromXml(buffer.toString("utf-8"));

		expect(tsi.devices.length).toBeGreaterThan(0);

		const firstDevice = tsi.devices[0];
		expect(firstDevice).toBeDefined();

		const device = Device.fromRawData(firstDevice);
		expect(device.mappingCount).toBeGreaterThan(0);

		// All mappings should have valid command references
		for (const mapping of device.mappings) {
			expect(mapping.command).toBeDefined();
		}
	});

	it("handles favorites enum file", async () => {
		const buffer = await loadFixture(
			"favorites_enum__1st_none___2nd_1____3rd_12.tsi",
		);
		const tsi = TsiFile.fromXml(buffer.toString("utf-8"));

		const firstDevice = tsi.devices[0];
		expect(firstDevice).toBeDefined();

		const device = Device.fromRawData(firstDevice);

		// Check that mappings are properly wrapped
		expect(device.mappings.every((m) => m instanceof Mapping)).toBe(true);
	});

	it("handles fx_list_from_TK file", async () => {
		const buffer = await loadFixture("fx_list_from_TK.tsi");
		const tsi = TsiFile.fromXml(buffer.toString("utf-8"));

		const firstDevice = tsi.devices[0];
		expect(firstDevice).toBeDefined();

		const device = Device.fromRawData(firstDevice);
		expect(device).toBeInstanceOf(Device);
	});
});

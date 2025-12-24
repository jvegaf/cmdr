/**
 * Round-trip tests for TSI files
 *
 * AIDEV-NOTE: These tests verify that parsing and serializing TSI files
 * produces equivalent data. We test:
 * 1. Binary round-trip: parse → serialize → parse produces same data
 * 2. Full TSI round-trip: load → save → load produces same data
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	DeviceTarget,
	DeviceType,
	MappingControlType,
	MappingInteractionMode,
	MappingTargetDeck,
	MappingType,
	ValueUIType,
} from "../src/enums/index.js";
import {
	createDeviceFrame,
	type DeviceData,
	parseDeviceFromFrame,
} from "../src/format/Device.js";
import {
	createDeviceDataFrame,
	type DeviceDataData,
	parseDeviceDataFromFrame,
} from "../src/format/DeviceData.js";
import {
	createDeviceMappingsContainerFrame,
	type DeviceMappingsContainerData,
	parseDeviceMappingsContainerFromFrame,
} from "../src/format/DeviceMappingsContainer.js";
import {
	createMappingSettingsFrame,
	type MappingSettingsData,
	parseMappingSettingsFromFrame,
} from "../src/format/MappingSettings.js";
import {
	createMappingsContainerFrame,
	type MappingsContainerData,
	parseMappingsContainerFromFrame,
} from "../src/format/MappingsContainer.js";
import {
	createMidiNoteBindingFrame,
	type MidiNoteBindingData,
	parseMidiNoteBindingFromFrame,
} from "../src/format/MidiNoteBinding.js";
import { TsiFile } from "../src/models/TsiFile.js";

const FIXTURES_DIR = join(__dirname, "fixtures");

function loadFixture(filename: string): string {
	return readFileSync(join(FIXTURES_DIR, filename), "utf-8");
}

/**
 * Get all TSI fixture files
 */
function getFixtureFiles(): string[] {
	return readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".tsi"));
}

// Helper to compare Uint8Array
function compareUint8Arrays(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

describe("Binary Format Round-Trip", () => {
	describe("MappingSettings round-trip", () => {
		it("should round-trip default MappingSettings", () => {
			const original: MappingSettingsData = {
				deviceType: DeviceType.GenericMidi,
				controlType: MappingControlType.Button,
				interactionMode: MappingInteractionMode.Trigger,
				target: MappingTargetDeck.DeviceTarget,
				autoRepeat: false,
				invert: false,
				softTakeover: false,
				rotarySensitivity: 5.0,
				rotaryAcceleration: 0.0,
				encoderMode: 0,
				hasValueUI: false,
				valueUIType: ValueUIType.ComboBox,
				setValueTo: new Uint8Array([0, 0, 0, 0]),
				comment: "Test Comment",
				conditionOneId: 0,
				conditionOneTarget: MappingTargetDeck.DeviceTarget,
				conditionOneValue: new Uint8Array([0, 0, 0, 0]),
				conditionTwoId: 0,
				conditionTwoTarget: MappingTargetDeck.DeviceTarget,
				conditionTwoValue: new Uint8Array([0, 0, 0, 0]),
				ledMinControllerRangeType: ValueUIType.ComboBox,
				ledMinControllerRange: new Uint8Array([0, 0, 0, 0]),
				ledMaxControllerRangeType: ValueUIType.ComboBox,
				ledMaxControllerRange: new Uint8Array([0, 0, 0, 0]),
				ledMinMidiRange: 0,
				ledMaxMidiRange: 127,
				ledInvert: false,
				ledBlend: false,
				resolution: 0,
				useFactoryMap: false,
			};

			// Serialize
			const frame = createMappingSettingsFrame(original);

			// Parse back
			const parsed = parseMappingSettingsFromFrame(frame);

			// Compare core fields (excluding encoderMode which isn't serialized)
			expect(parsed.deviceType).toBe(original.deviceType);
			expect(parsed.controlType).toBe(original.controlType);
			expect(parsed.interactionMode).toBe(original.interactionMode);
			expect(parsed.target).toBe(original.target);
			expect(parsed.autoRepeat).toBe(original.autoRepeat);
			expect(parsed.invert).toBe(original.invert);
			expect(parsed.softTakeover).toBe(original.softTakeover);
			expect(parsed.rotarySensitivity).toBeCloseTo(
				original.rotarySensitivity,
				5,
			);
			expect(parsed.rotaryAcceleration).toBeCloseTo(
				original.rotaryAcceleration,
				5,
			);
			expect(parsed.hasValueUI).toBe(original.hasValueUI);
			expect(parsed.comment).toBe(original.comment);
			expect(parsed.ledMinMidiRange).toBe(original.ledMinMidiRange);
			expect(parsed.ledMaxMidiRange).toBe(original.ledMaxMidiRange);
		});

		it("should round-trip MappingSettings with comment", () => {
			const original: MappingSettingsData = {
				deviceType: DeviceType.GenericMidi,
				controlType: MappingControlType.Fader,
				interactionMode: MappingInteractionMode.Direct,
				target: MappingTargetDeck.DeckA,
				autoRepeat: true,
				invert: true,
				softTakeover: true,
				rotarySensitivity: 10.0,
				rotaryAcceleration: 0.5,
				encoderMode: 0,
				hasValueUI: true,
				valueUIType: ValueUIType.IntegerInput,
				setValueTo: new Uint8Array([0, 0, 0, 100]),
				comment: "This is a test mapping with special chars: äöü",
				conditionOneId: 5,
				conditionOneTarget: MappingTargetDeck.DeckB,
				conditionOneValue: new Uint8Array([0, 0, 0, 1]),
				conditionTwoId: 10,
				conditionTwoTarget: MappingTargetDeck.DeckC,
				conditionTwoValue: new Uint8Array([0, 0, 0, 2]),
				ledMinControllerRangeType: ValueUIType.IntegerInput,
				ledMinControllerRange: new Uint8Array([0, 0, 0, 0]),
				ledMaxControllerRangeType: ValueUIType.IntegerInput,
				ledMaxControllerRange: new Uint8Array([0, 0, 0, 127]),
				ledMinMidiRange: 0,
				ledMaxMidiRange: 127,
				ledInvert: true,
				ledBlend: true,
				resolution: 1,
				useFactoryMap: true,
			};

			const frame = createMappingSettingsFrame(original);
			const parsed = parseMappingSettingsFromFrame(frame);

			expect(parsed.comment).toBe(original.comment);
			expect(parsed.conditionOneId).toBe(original.conditionOneId);
			expect(parsed.conditionTwoId).toBe(original.conditionTwoId);
			expect(parsed.ledInvert).toBe(original.ledInvert);
			expect(parsed.ledBlend).toBe(original.ledBlend);
		});
	});

	describe("MidiNoteBinding round-trip", () => {
		it("should round-trip MidiNoteBinding", () => {
			const original: MidiNoteBindingData = {
				bindingId: 42,
				midiNote: "Ch01.CC.064",
			};

			const frame = createMidiNoteBindingFrame(original);
			const parsed = parseMidiNoteBindingFromFrame(frame);

			expect(parsed.bindingId).toBe(original.bindingId);
			expect(parsed.midiNote).toBe(original.midiNote);
		});
	});

	describe("MappingsContainer round-trip", () => {
		it("should round-trip empty MappingsContainer", () => {
			const original: MappingsContainerData = {
				mappings: [],
				midiBindings: [],
			};

			const frame = createMappingsContainerFrame(original);
			const parsed = parseMappingsContainerFromFrame(frame);

			expect(parsed.mappings.length).toBe(0);
			expect(parsed.midiBindings.length).toBe(0);
		});

		it("should round-trip MappingsContainer with data", () => {
			const original: MappingsContainerData = {
				mappings: [
					{
						midiNoteBindingId: 1,
						type: MappingType.In,
						traktorControlId: 100,
						settings: {
							deviceType: DeviceType.GenericMidi,
							controlType: MappingControlType.Button,
							interactionMode: MappingInteractionMode.Trigger,
							target: MappingTargetDeck.DeviceTarget,
							autoRepeat: false,
							invert: false,
							softTakeover: false,
							rotarySensitivity: 5.0,
							rotaryAcceleration: 0.0,
							encoderMode: 0,
							hasValueUI: false,
							valueUIType: ValueUIType.ComboBox,
							setValueTo: new Uint8Array([0, 0, 0, 0]),
							comment: "",
							conditionOneId: 0,
							conditionOneTarget: MappingTargetDeck.DeviceTarget,
							conditionOneValue: new Uint8Array([0, 0, 0, 0]),
							conditionTwoId: 0,
							conditionTwoTarget: MappingTargetDeck.DeviceTarget,
							conditionTwoValue: new Uint8Array([0, 0, 0, 0]),
							ledMinControllerRangeType: ValueUIType.ComboBox,
							ledMinControllerRange: new Uint8Array([0, 0, 0, 0]),
							ledMaxControllerRangeType: ValueUIType.ComboBox,
							ledMaxControllerRange: new Uint8Array([0, 0, 0, 0]),
							ledMinMidiRange: 0,
							ledMaxMidiRange: 127,
							ledInvert: false,
							ledBlend: false,
							resolution: 0,
							useFactoryMap: false,
						},
					},
				],
				midiBindings: [
					{
						bindingId: 1,
						midiNote: "Ch01.Note.C3",
					},
				],
			};

			const frame = createMappingsContainerFrame(original);
			const parsed = parseMappingsContainerFromFrame(frame);

			expect(parsed.mappings.length).toBe(1);
			expect(parsed.midiBindings.length).toBe(1);
			expect(parsed.mappings[0].traktorControlId).toBe(100);
			expect(parsed.midiBindings[0].midiNote).toBe("Ch01.Note.C3");
		});
	});

	describe("DeviceData round-trip", () => {
		it("should round-trip minimal DeviceData", () => {
			const original: DeviceDataData = {
				target: { deviceTarget: DeviceTarget.FocusedDeck },
				version: { version: "3.11.0", mappingFileRevision: 1 },
				ports: { inPortName: "All Ports", outPortName: "All Ports" },
			};

			const frame = createDeviceDataFrame(original);
			const parsed = parseDeviceDataFromFrame(frame);

			expect(parsed.target.deviceTarget).toBe(original.target.deviceTarget);
			expect(parsed.version.version).toBe(original.version.version);
			expect(parsed.version.mappingFileRevision).toBe(
				original.version.mappingFileRevision,
			);
			expect(parsed.ports.inPortName).toBe(original.ports.inPortName);
			expect(parsed.ports.outPortName).toBe(original.ports.outPortName);
		});

		it("should round-trip DeviceData with comment", () => {
			const original: DeviceDataData = {
				target: { deviceTarget: DeviceTarget.None },
				version: { version: "3.10.0", mappingFileRevision: 5 },
				comment: "Test device comment",
				ports: { inPortName: "MIDI In", outPortName: "MIDI Out" },
			};

			const frame = createDeviceDataFrame(original);
			const parsed = parseDeviceDataFromFrame(frame);

			expect(parsed.comment).toBe(original.comment);
		});
	});

	describe("Device round-trip", () => {
		it("should round-trip Device", () => {
			const original: DeviceData = {
				deviceType: "Generic MIDI",
				isKeyboard: false,
				data: {
					target: { deviceTarget: DeviceTarget.None },
					version: { version: "3.11.0", mappingFileRevision: 0 },
					ports: { inPortName: "None", outPortName: "None" },
				},
			};

			const frame = createDeviceFrame(original);
			const parsed = parseDeviceFromFrame(frame);

			expect(parsed.deviceType).toBe(original.deviceType);
			expect(parsed.data.version.version).toBe(original.data.version.version);
		});
	});

	describe("DeviceMappingsContainer round-trip", () => {
		it("should round-trip empty DeviceMappingsContainer", () => {
			const original: DeviceMappingsContainerData = {
				dioi: { unknown: 1 },
				devices: [],
			};

			const frame = createDeviceMappingsContainerFrame(original);
			const parsed = parseDeviceMappingsContainerFromFrame(frame);

			expect(parsed.dioi.unknown).toBe(1);
			expect(parsed.devices.length).toBe(0);
		});

		it("should round-trip DeviceMappingsContainer with device", () => {
			const original: DeviceMappingsContainerData = {
				dioi: { unknown: 1 },
				devices: [
					{
						deviceType: "Test Device",
						isKeyboard: false,
						data: {
							target: { deviceTarget: DeviceTarget.FocusedDeck },
							version: { version: "3.9.0", mappingFileRevision: 2 },
							ports: { inPortName: "Port A", outPortName: "Port B" },
						},
					},
				],
			};

			const frame = createDeviceMappingsContainerFrame(original);
			const parsed = parseDeviceMappingsContainerFromFrame(frame);

			expect(parsed.devices.length).toBe(1);
			expect(parsed.devices[0].deviceType).toBe("Test Device");
			expect(parsed.devices[0].data.target.deviceTarget).toBe(
				DeviceTarget.FocusedDeck,
			);
		});
	});
});

describe("TsiFile Round-Trip", () => {
	it("should round-trip an empty TsiFile", () => {
		const original = TsiFile.create();
		const xml = original.toXml();
		const parsed = TsiFile.fromXml(xml);

		expect(parsed.controllerDevices.length).toBe(0);
		expect(parsed.keyboardDevices.length).toBe(0);
	});

	it("should round-trip TsiFile basic structure", () => {
		const xml = loadFixture("encoder mode demo.tsi");
		const original = TsiFile.fromXml(xml);

		// Serialize and re-parse
		const serialized = original.toXml();
		const reparsed = TsiFile.fromXml(serialized);

		// Compare counts
		expect(reparsed.controllerDevices.length).toBe(
			original.controllerDevices.length,
		);
		expect(reparsed.keyboardDevices.length).toBe(
			original.keyboardDevices.length,
		);
		expect(reparsed.mappingCount).toBe(original.mappingCount);
	});

	describe("Fixture round-trips", () => {
		const fixtures = getFixtureFiles();

		for (const fixture of fixtures) {
			it(`should round-trip ${fixture}`, () => {
				const xml = loadFixture(fixture);
				const original = TsiFile.fromXml(xml);

				// Skip if no devices (can't verify much)
				if (original.devices.length === 0) {
					return;
				}

				// Serialize and re-parse
				const serialized = original.toXml();
				const reparsed = TsiFile.fromXml(serialized);

				// Verify device counts match
				expect(reparsed.controllerDevices.length).toBe(
					original.controllerDevices.length,
				);
				expect(reparsed.keyboardDevices.length).toBe(
					original.keyboardDevices.length,
				);

				// Verify mapping counts match
				expect(reparsed.mappingCount).toBe(original.mappingCount);

				// Verify device types match
				for (let i = 0; i < original.controllerDevices.length; i++) {
					expect(reparsed.controllerDevices[i].deviceType).toBe(
						original.controllerDevices[i].deviceType,
					);
				}

				// Verify first device's first mapping (if exists)
				if (original.controllerDevices.length > 0) {
					const origDevice = original.controllerDevices[0];
					const repDevice = reparsed.controllerDevices[0];

					if (origDevice.data.mappings?.mappings.length) {
						expect(repDevice.data.mappings?.mappings.length).toBe(
							origDevice.data.mappings.mappings.length,
						);

						const origMapping = origDevice.data.mappings.mappings[0];
						const repMapping = repDevice.data.mappings?.mappings[0];

						expect(repMapping?.traktorControlId).toBe(
							origMapping.traktorControlId,
						);
						expect(repMapping?.type).toBe(origMapping.type);
						expect(repMapping?.settings.comment).toBe(
							origMapping.settings.comment,
						);
					}
				}
			});
		}
	});
});

describe("Binary Bytes Comparison", () => {
	it("should produce identical bytes for simple data", () => {
		const binding: MidiNoteBindingData = {
			bindingId: 123,
			midiNote: "Ch05.CC.042",
		};

		// First serialization
		const frame1 = createMidiNoteBindingFrame(binding);

		// Parse and re-serialize
		const parsed = parseMidiNoteBindingFromFrame(frame1);
		const frame2 = createMidiNoteBindingFrame(parsed);

		// Compare bytes
		expect(compareUint8Arrays(frame1.data, frame2.data)).toBe(true);
	});

	it("should produce identical bytes for MappingsContainer", () => {
		const container: MappingsContainerData = {
			mappings: [],
			midiBindings: [
				{ bindingId: 1, midiNote: "Ch01.CC.001" },
				{ bindingId: 2, midiNote: "Ch01.Note.C3" },
			],
		};

		const frame1 = createMappingsContainerFrame(container);
		const parsed = parseMappingsContainerFromFrame(frame1);
		const frame2 = createMappingsContainerFrame(parsed);

		expect(compareUint8Arrays(frame1.data, frame2.data)).toBe(true);
	});
});

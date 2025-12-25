/**
 * Tests for FX Settings module
 *
 * AIDEV-NOTE: Tests cover:
 * - Effect enum and utilities
 * - FxSnapshot parsing and serialization
 * - FxSettings load/save from XML data
 */

import { describe, expect, it } from "vitest";
import {
	addEffect,
	buttonsToList,
	createDefaultButtonsSnapshot,
	createDefaultKnobsSnapshot,
	createEmptyFxSettings,
	createFxSnapshot,
	EFFECT_COUNT,
	EFFECT_DESCRIPTIONS,
	Effect,
	type FxButtonsSnapshot,
	type FxKnobsSnapshot,
	type FxSettingsData,
	getAllEffects,
	getButtonEntryName,
	getEffectDescription,
	getFxSnapshot,
	getParamEntryName,
	isEffectSelected,
	isValidEffect,
	knobsToList,
	loadFxSettings,
	parseButtonsFromList,
	parseKnobsFromList,
	removeEffect,
	saveFxSettings,
	setFxSnapshot,
	type TsiXmlData,
	type TsiXmlEntry,
} from "../src/index";

describe("Effect enum", () => {
	it("should have expected number of effects", () => {
		// AIDEV-NOTE: There are ~40 effects in Traktor (not counting NoEffect)
		expect(EFFECT_COUNT).toBeGreaterThan(35);
		expect(EFFECT_COUNT).toBeLessThan(50);
	});

	it("should have correct effect IDs for known effects", () => {
		expect(Effect.NoEffect).toBe(0);
		expect(Effect.Flanger).toBe(1);
		expect(Effect.Filter).toBe(9);
		expect(Effect.Delay).toBe(13);
		expect(Effect.Reverb).toBe(19);
		expect(Effect.Wormhole).toBe(42);
		expect(Effect.FlightTest).toBe(89);
	});

	it("should have descriptions for all effects", () => {
		const allEffects = getAllEffects();
		for (const effect of allEffects) {
			expect(EFFECT_DESCRIPTIONS[effect]).toBeDefined();
			expect(EFFECT_DESCRIPTIONS[effect].length).toBeGreaterThan(0);
		}
	});

	describe("getEffectDescription", () => {
		it("should return correct description for known effects", () => {
			expect(getEffectDescription(Effect.Flanger)).toBe("Flanger");
			expect(getEffectDescription(Effect.Filter)).toBe("Filter");
			expect(getEffectDescription(Effect.Reverb)).toBe("Reverb");
			expect(getEffectDescription(Effect.Wormhole)).toBe("Wormhole");
		});

		it("should return unknown description for invalid effect", () => {
			expect(getEffectDescription(999 as Effect)).toBe("Unknown Effect (999)");
		});
	});

	describe("getAllEffects", () => {
		it("should return all effects except NoEffect", () => {
			const effects = getAllEffects();
			expect(effects).not.toContain(Effect.NoEffect);
			expect(effects).toContain(Effect.Flanger);
			expect(effects).toContain(Effect.Reverb);
		});
	});

	describe("isValidEffect", () => {
		it("should return true for valid effect IDs", () => {
			expect(isValidEffect(0)).toBe(true); // NoEffect
			expect(isValidEffect(1)).toBe(true); // Flanger
			expect(isValidEffect(19)).toBe(true); // Reverb
		});

		it("should return false for invalid effect IDs", () => {
			expect(isValidEffect(-1)).toBe(false);
			expect(isValidEffect(999)).toBe(false);
			expect(isValidEffect(20)).toBe(false); // Gap in effect IDs
		});
	});
});

describe("FxSnapshot", () => {
	describe("createDefaultButtonsSnapshot", () => {
		it("should create snapshot with all buttons off", () => {
			const buttons = createDefaultButtonsSnapshot();
			expect(buttons.buttonGroupMode).toBe(0);
			expect(buttons.button1).toBe(0);
			expect(buttons.button2).toBe(0);
			expect(buttons.button3).toBe(0);
			expect(buttons.onOff).toBe(0);
		});
	});

	describe("createDefaultKnobsSnapshot", () => {
		it("should create snapshot with all knobs at zero", () => {
			const knobs = createDefaultKnobsSnapshot();
			expect(knobs.knobGroupMode).toBe(0);
			expect(knobs.knob1).toBe(0);
			expect(knobs.knob2).toBe(0);
			expect(knobs.knob3).toBe(0);
			expect(knobs.dryWet).toBe(0);
		});
	});

	describe("createFxSnapshot", () => {
		it("should create snapshot with effect only", () => {
			const snapshot = createFxSnapshot(Effect.Flanger);
			expect(snapshot.effect).toBe(Effect.Flanger);
			expect(snapshot.buttons).toBeUndefined();
			expect(snapshot.knobs).toBeUndefined();
		});

		it("should create snapshot with buttons and knobs", () => {
			const buttons: FxButtonsSnapshot = {
				buttonGroupMode: 1,
				button1: 0,
				button2: 1,
				button3: 0,
				onOff: 1,
			};
			const knobs: FxKnobsSnapshot = {
				knobGroupMode: 0.5,
				knob1: 0.25,
				knob2: 0.75,
				knob3: 1.0,
				dryWet: 0.5,
			};
			const snapshot = createFxSnapshot(Effect.Reverb, buttons, knobs);
			expect(snapshot.effect).toBe(Effect.Reverb);
			expect(snapshot.buttons).toEqual(buttons);
			expect(snapshot.knobs).toEqual(knobs);
		});
	});

	describe("parseButtonsFromList", () => {
		it("should parse valid button list", () => {
			const values = [1, 0, 1, 0, 1]; // [GroupMode, B3, B2, B1, OnOff]
			const buttons = parseButtonsFromList(values);
			expect(buttons).toBeDefined();
			expect(buttons?.buttonGroupMode).toBe(1);
			expect(buttons?.button3).toBe(0);
			expect(buttons?.button2).toBe(1);
			expect(buttons?.button1).toBe(0);
			expect(buttons?.onOff).toBe(1);
		});

		it("should return undefined for invalid length", () => {
			expect(parseButtonsFromList([])).toBeUndefined();
			expect(parseButtonsFromList([1, 2, 3])).toBeUndefined();
			expect(parseButtonsFromList([1, 2, 3, 4, 5, 6])).toBeUndefined();
		});
	});

	describe("parseKnobsFromList", () => {
		it("should parse valid knob list", () => {
			const values = [0.5, 0.25, 0.75, 1.0, 0.5]; // [GroupMode, K3, K2, K1, DryWet]
			const knobs = parseKnobsFromList(values);
			expect(knobs).toBeDefined();
			expect(knobs?.knobGroupMode).toBe(0.5);
			expect(knobs?.knob3).toBe(0.25);
			expect(knobs?.knob2).toBe(0.75);
			expect(knobs?.knob1).toBe(1.0);
			expect(knobs?.dryWet).toBe(0.5);
		});

		it("should return undefined for invalid length", () => {
			expect(parseKnobsFromList([])).toBeUndefined();
			expect(parseKnobsFromList([0.5])).toBeUndefined();
		});
	});

	describe("buttonsToList", () => {
		it("should convert buttons to list in correct order", () => {
			const buttons: FxButtonsSnapshot = {
				buttonGroupMode: 1,
				button3: 0,
				button2: 1,
				button1: 0,
				onOff: 1,
			};
			const list = buttonsToList(buttons);
			expect(list).toEqual([1, 0, 1, 0, 1]);
		});
	});

	describe("knobsToList", () => {
		it("should convert knobs to list in correct order", () => {
			const knobs: FxKnobsSnapshot = {
				knobGroupMode: 0.5,
				knob3: 0.25,
				knob2: 0.75,
				knob1: 1.0,
				dryWet: 0.5,
			};
			const list = knobsToList(knobs);
			expect(list).toEqual([0.5, 0.25, 0.75, 1.0, 0.5]);
		});
	});

	describe("getButtonEntryName", () => {
		it("should generate correct entry name", () => {
			expect(getButtonEntryName(Effect.Flanger)).toBe("DEFAULT_BUTTON_FX1");
			expect(getButtonEntryName(Effect.Reverb)).toBe("DEFAULT_BUTTON_FX19");
			expect(getButtonEntryName(Effect.Wormhole)).toBe("DEFAULT_BUTTON_FX42");
		});
	});

	describe("getParamEntryName", () => {
		it("should generate correct entry name", () => {
			expect(getParamEntryName(Effect.Flanger)).toBe("DEFAULT_PARAM_FX1");
			expect(getParamEntryName(Effect.Reverb)).toBe("DEFAULT_PARAM_FX19");
			expect(getParamEntryName(Effect.Wormhole)).toBe("DEFAULT_PARAM_FX42");
		});
	});
});

describe("FxSettings", () => {
	describe("createEmptyFxSettings", () => {
		it("should create empty settings", () => {
			const settings = createEmptyFxSettings();
			expect(settings.effects).toEqual([]);
			expect(settings.snapshots.size).toBe(0);
		});
	});

	describe("addEffect / removeEffect / isEffectSelected", () => {
		it("should add and remove effects", () => {
			const settings = createEmptyFxSettings();

			expect(isEffectSelected(settings, Effect.Flanger)).toBe(false);

			addEffect(settings, Effect.Flanger);
			expect(isEffectSelected(settings, Effect.Flanger)).toBe(true);
			expect(settings.effects).toContain(Effect.Flanger);

			addEffect(settings, Effect.Reverb);
			expect(settings.effects).toHaveLength(2);

			// Adding same effect twice should not duplicate
			addEffect(settings, Effect.Flanger);
			expect(settings.effects).toHaveLength(2);

			removeEffect(settings, Effect.Flanger);
			expect(isEffectSelected(settings, Effect.Flanger)).toBe(false);
			expect(settings.effects).toHaveLength(1);

			// Removing non-existent effect should be safe
			removeEffect(settings, Effect.Delay);
			expect(settings.effects).toHaveLength(1);
		});
	});

	describe("setFxSnapshot / getFxSnapshot", () => {
		it("should set and get snapshots", () => {
			const settings = createEmptyFxSettings();
			const snapshot = createFxSnapshot(
				Effect.Reverb,
				createDefaultButtonsSnapshot(),
				createDefaultKnobsSnapshot(),
			);

			setFxSnapshot(settings, snapshot);
			expect(getFxSnapshot(settings, Effect.Reverb)).toEqual(snapshot);
			expect(getFxSnapshot(settings, Effect.Flanger)).toBeUndefined();
		});

		it("should replace existing snapshot", () => {
			const settings = createEmptyFxSettings();
			const snapshot1 = createFxSnapshot(Effect.Reverb, {
				buttonGroupMode: 0,
				button1: 0,
				button2: 0,
				button3: 0,
				onOff: 0,
			});
			const snapshot2 = createFxSnapshot(Effect.Reverb, {
				buttonGroupMode: 1,
				button1: 1,
				button2: 1,
				button3: 1,
				onOff: 1,
			});

			setFxSnapshot(settings, snapshot1);
			setFxSnapshot(settings, snapshot2);

			const retrieved = getFxSnapshot(settings, Effect.Reverb);
			expect(retrieved?.buttons?.buttonGroupMode).toBe(1);
		});
	});

	describe("loadFxSettings / saveFxSettings", () => {
		function createMockXmlData(): TsiXmlData {
			const entries = new Map<string, TsiXmlEntry>();
			return { entries, devices: [] };
		}

		it("should return null if no FX selection entry", () => {
			const xmlData = createMockXmlData();
			const settings = loadFxSettings(xmlData);
			expect(settings).toBeNull();
		});

		it("should load effects from selection entry", () => {
			const xmlData = createMockXmlData();
			xmlData.entries.set("Audio.FX.Selection", {
				name: "Audio.FX.Selection",
				type: "4",
				value: "1;9;19", // Flanger, Filter, Reverb
			});

			const settings = loadFxSettings(xmlData);
			expect(settings).not.toBeNull();
			expect(settings?.effects).toHaveLength(3);
			expect(settings?.effects).toContain(Effect.Flanger);
			expect(settings?.effects).toContain(Effect.Filter);
			expect(settings?.effects).toContain(Effect.Reverb);
		});

		it("should filter out invalid effect IDs", () => {
			const xmlData = createMockXmlData();
			xmlData.entries.set("Audio.FX.Selection", {
				name: "Audio.FX.Selection",
				type: "4",
				value: "1;999;19", // Flanger, Invalid, Reverb
			});

			const settings = loadFxSettings(xmlData);
			expect(settings?.effects).toHaveLength(2);
			expect(settings?.effects).not.toContain(999);
		});

		it("should load snapshots from button/param entries", () => {
			const xmlData = createMockXmlData();
			xmlData.entries.set("Audio.FX.Selection", {
				name: "Audio.FX.Selection",
				type: "4",
				value: "1", // Flanger
			});
			xmlData.entries.set("DEFAULT_BUTTON_FX1", {
				name: "DEFAULT_BUTTON_FX1",
				type: "4",
				value: "1;0;1;0;1", // [GroupMode, B3, B2, B1, OnOff]
			});
			xmlData.entries.set("DEFAULT_PARAM_FX1", {
				name: "DEFAULT_PARAM_FX1",
				type: "6",
				value: "0.5;0.25;0.75;1;0.5", // [GroupMode, K3, K2, K1, DryWet]
			});

			const settings = loadFxSettings(xmlData);
			const snapshot = settings?.snapshots.get(Effect.Flanger);

			expect(snapshot).toBeDefined();
			expect(snapshot?.buttons?.buttonGroupMode).toBe(1);
			expect(snapshot?.buttons?.onOff).toBe(1);
			expect(snapshot?.knobs?.knobGroupMode).toBe(0.5);
			expect(snapshot?.knobs?.dryWet).toBe(0.5);
		});

		it("should save settings to XML data", () => {
			const settings: FxSettingsData = {
				effects: [Effect.Flanger, Effect.Reverb],
				snapshots: new Map([
					[
						Effect.Flanger,
						{
							effect: Effect.Flanger,
							buttons: {
								buttonGroupMode: 1,
								button3: 0,
								button2: 1,
								button1: 0,
								onOff: 1,
							},
							knobs: {
								knobGroupMode: 0.5,
								knob3: 0.25,
								knob2: 0.75,
								knob1: 1.0,
								dryWet: 0.5,
							},
						},
					],
				]),
			};

			const xmlData = createMockXmlData();
			saveFxSettings(settings, xmlData);

			// Check selection entry
			const selectionEntry = xmlData.entries.get("Audio.FX.Selection");
			expect(selectionEntry).toBeDefined();
			expect(selectionEntry?.value).toBe("1;19");
			expect(selectionEntry?.type).toBe("4");

			// Check button entry
			const buttonEntry = xmlData.entries.get("DEFAULT_BUTTON_FX1");
			expect(buttonEntry).toBeDefined();
			expect(buttonEntry?.value).toBe("1;0;1;0;1");

			// Check param entry
			const paramEntry = xmlData.entries.get("DEFAULT_PARAM_FX1");
			expect(paramEntry).toBeDefined();
			expect(paramEntry?.value).toBe("0.5;0.25;0.75;1;0.5");
		});

		it("should handle empty effects list", () => {
			const settings = createEmptyFxSettings();
			const xmlData = createMockXmlData();
			saveFxSettings(settings, xmlData);

			const selectionEntry = xmlData.entries.get("Audio.FX.Selection");
			expect(selectionEntry?.value).toBe("");
		});

		it("should round-trip settings correctly", () => {
			const originalSettings: FxSettingsData = {
				effects: [Effect.Delay, Effect.Filter92, Effect.Wormhole],
				snapshots: new Map([
					[
						Effect.Delay,
						{
							effect: Effect.Delay,
							buttons: {
								buttonGroupMode: 0,
								button3: 1,
								button2: 0,
								button1: 1,
								onOff: 1,
							},
							knobs: {
								knobGroupMode: 0.3,
								knob3: 0.6,
								knob2: 0.9,
								knob1: 0.1,
								dryWet: 0.8,
							},
						},
					],
				]),
			};

			// Save
			const xmlData = createMockXmlData();
			saveFxSettings(originalSettings, xmlData);

			// Load
			const loadedSettings = loadFxSettings(xmlData);

			expect(loadedSettings?.effects).toEqual(originalSettings.effects);

			const delaySnapshot = loadedSettings?.snapshots.get(Effect.Delay);
			expect(delaySnapshot?.buttons).toEqual(
				originalSettings.snapshots.get(Effect.Delay)?.buttons,
			);
			expect(delaySnapshot?.knobs).toEqual(
				originalSettings.snapshots.get(Effect.Delay)?.knobs,
			);
		});
	});
});

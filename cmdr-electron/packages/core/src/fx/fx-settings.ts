/**
 * FX Settings - Manages effect selections and default snapshots
 *
 * AIDEV-NOTE: FxSettings represents the FX configuration in a TSI file.
 * It contains:
 * - The list of selected effects (Audio.FX.Selection entry)
 * - Default button/knob snapshots for each effect
 *
 * XML Entry Format:
 * - Audio.FX.Selection: List of effect IDs separated by semicolons
 * - DEFAULT_BUTTON_FX{id}: List of 5 integers
 * - DEFAULT_PARAM_FX{id}: List of 5 floats
 *
 * @see cmdr/cmdr.TsiLib/FxSettings.cs
 */

import type { TsiXmlData, TsiXmlEntry } from "../xml/TsiXmlParser";
import { type Effect, getAllEffects, isValidEffect } from "./effect";
import {
	createFxSnapshot,
	type FxSnapshot,
	getButtonEntryName,
	getParamEntryName,
	parseButtonsFromList,
	parseKnobsFromList,
} from "./fx-snapshot";

/** XML entry name for effect selection list */
const AUDIO_FX_SELECTION_ENTRY = "Audio.FX.Selection";

/**
 * FX Settings data structure.
 */
export interface FxSettingsData {
	/** List of selected effects (order matters for FX slots) */
	effects: Effect[];
	/** Default parameter snapshots for each effect */
	snapshots: Map<Effect, FxSnapshot>;
}

/**
 * Create empty FX settings with no effects selected.
 */
export function createEmptyFxSettings(): FxSettingsData {
	return {
		effects: [],
		snapshots: new Map(),
	};
}

/**
 * Parse a semicolon-separated list of integers.
 */
function parseIntegerList(value: string): number[] {
	if (!value || value.trim() === "") {
		return [];
	}
	return value.split(";").map((s) => Number.parseInt(s.trim(), 10));
}

/**
 * Parse a semicolon-separated list of floats.
 */
function parseFloatList(value: string): number[] {
	if (!value || value.trim() === "") {
		return [];
	}
	return value.split(";").map((s) => Number.parseFloat(s.trim()));
}

/**
 * Encode a list of integers to semicolon-separated string.
 */
function encodeIntegerList(values: number[]): string {
	return values.join(";");
}

/**
 * Encode a list of floats to semicolon-separated string.
 */
function encodeFloatList(values: number[]): string {
	return values.join(";");
}

/**
 * Load FX settings from parsed TSI XML data.
 *
 * @param xmlData - Parsed TSI XML data
 * @returns FxSettingsData or null if no FX selection entry found
 */
export function loadFxSettings(xmlData: TsiXmlData): FxSettingsData | null {
	const fxSelectionEntry = xmlData.entries.get(AUDIO_FX_SELECTION_ENTRY);
	if (!fxSelectionEntry) {
		return null;
	}

	// Parse effect selection list
	const effectIds = parseIntegerList(fxSelectionEntry.value);
	const effects = effectIds.filter(isValidEffect) as Effect[];

	// Load snapshots for all available effects
	const snapshots = new Map<Effect, FxSnapshot>();
	const allEffects = getAllEffects();

	for (const effect of allEffects) {
		const snapshot = loadFxSnapshot(effect, xmlData);
		if (snapshot) {
			snapshots.set(effect, snapshot);
		}
	}

	return {
		effects,
		snapshots,
	};
}

/**
 * Load an FxSnapshot for a specific effect from XML data.
 */
function loadFxSnapshot(
	effect: Effect,
	xmlData: TsiXmlData,
): FxSnapshot | null {
	const buttonEntryName = getButtonEntryName(effect);
	const paramEntryName = getParamEntryName(effect);

	const buttonEntry = xmlData.entries.get(buttonEntryName);
	const paramEntry = xmlData.entries.get(paramEntryName);

	// Need at least one of button or param entry
	if (!buttonEntry && !paramEntry) {
		return null;
	}

	const buttons = buttonEntry
		? parseButtonsFromList(parseIntegerList(buttonEntry.value))
		: undefined;
	const knobs = paramEntry
		? parseKnobsFromList(parseFloatList(paramEntry.value))
		: undefined;

	return createFxSnapshot(effect, buttons, knobs);
}

/**
 * Save FX settings to TSI XML data.
 * This modifies the entries map in-place.
 *
 * @param settings - FX settings to save
 * @param xmlData - TSI XML data to update
 */
export function saveFxSettings(
	settings: FxSettingsData,
	xmlData: TsiXmlData,
): void {
	// Save effect selection list
	// AIDEV-NOTE: Type "4" is ListOfInteger in TSI XML format
	const fxSelectionEntry: TsiXmlEntry = {
		name: AUDIO_FX_SELECTION_ENTRY,
		type: "4", // ListOfInteger
		value: encodeIntegerList(settings.effects),
	};
	xmlData.entries.set(AUDIO_FX_SELECTION_ENTRY, fxSelectionEntry);

	// Save snapshots
	for (const snapshot of settings.snapshots.values()) {
		saveFxSnapshot(snapshot, xmlData);
	}
}

/**
 * Save an FxSnapshot to XML data.
 */
function saveFxSnapshot(snapshot: FxSnapshot, xmlData: TsiXmlData): void {
	// Save button defaults
	if (snapshot.buttons) {
		const buttonEntryName = getButtonEntryName(snapshot.effect);
		const buttonValues = [
			snapshot.buttons.buttonGroupMode,
			snapshot.buttons.button3,
			snapshot.buttons.button2,
			snapshot.buttons.button1,
			snapshot.buttons.onOff,
		];
		const buttonEntry: TsiXmlEntry = {
			name: buttonEntryName,
			type: "4", // ListOfInteger
			value: encodeIntegerList(buttonValues),
		};
		xmlData.entries.set(buttonEntryName, buttonEntry);
	}

	// Save parameter defaults
	if (snapshot.knobs) {
		const paramEntryName = getParamEntryName(snapshot.effect);
		const paramValues = [
			snapshot.knobs.knobGroupMode,
			snapshot.knobs.knob3,
			snapshot.knobs.knob2,
			snapshot.knobs.knob1,
			snapshot.knobs.dryWet,
		];
		const paramEntry: TsiXmlEntry = {
			name: paramEntryName,
			type: "6", // ListOfFloat
			value: encodeFloatList(paramValues),
		};
		xmlData.entries.set(paramEntryName, paramEntry);
	}
}

/**
 * Set a snapshot in the FX settings.
 * This replaces any existing snapshot for the same effect.
 */
export function setFxSnapshot(
	settings: FxSettingsData,
	snapshot: FxSnapshot,
): void {
	settings.snapshots.set(snapshot.effect, snapshot);
}

/**
 * Get a snapshot for a specific effect.
 */
export function getFxSnapshot(
	settings: FxSettingsData,
	effect: Effect,
): FxSnapshot | undefined {
	return settings.snapshots.get(effect);
}

/**
 * Add an effect to the selection list.
 */
export function addEffect(settings: FxSettingsData, effect: Effect): void {
	if (!settings.effects.includes(effect)) {
		settings.effects.push(effect);
	}
}

/**
 * Remove an effect from the selection list.
 */
export function removeEffect(settings: FxSettingsData, effect: Effect): void {
	const index = settings.effects.indexOf(effect);
	if (index !== -1) {
		settings.effects.splice(index, 1);
	}
}

/**
 * Check if an effect is selected.
 */
export function isEffectSelected(
	settings: FxSettingsData,
	effect: Effect,
): boolean {
	return settings.effects.includes(effect);
}

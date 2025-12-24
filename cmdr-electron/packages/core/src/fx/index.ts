/**
 * FX Module - Effect management for Traktor TSI files
 *
 * AIDEV-NOTE: This module provides:
 * - Effect enum with all Traktor effects
 * - FxSnapshot for default button/knob values per effect
 * - FxSettings for managing effect selections and snapshots
 *
 * @see cmdr/cmdr.TsiLib/FxSettings.cs
 * @see cmdr/cmdr.TsiLib/FxSnapshot.cs
 * @see cmdr/cmdr.TsiLib/Enums/Effect.cs
 */

// Effect enum and utilities
export {
	EFFECT_COUNT,
	EFFECT_DESCRIPTIONS,
	Effect,
	getAllEffects,
	getEffectDescription,
	isValidEffect,
} from "./effect";
// FX Settings management
export type { FxSettingsData } from "./fx-settings";
export {
	addEffect,
	createEmptyFxSettings,
	getFxSnapshot,
	isEffectSelected,
	loadFxSettings,
	removeEffect,
	saveFxSettings,
	setFxSnapshot,
} from "./fx-settings";
// FX Snapshot types and utilities
export type {
	FxButtonsSnapshot,
	FxKnobsSnapshot,
	FxSnapshot,
} from "./fx-snapshot";
export {
	buttonsToList,
	createDefaultButtonsSnapshot,
	createDefaultKnobsSnapshot,
	createFxSnapshot,
	getButtonEntryName,
	getParamEntryName,
	knobsToList,
	parseButtonsFromList,
	parseKnobsFromList,
} from "./fx-snapshot";

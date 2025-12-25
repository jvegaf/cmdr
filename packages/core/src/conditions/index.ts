/**
 * Conditions Module - Traktor Condition Definitions and Metadata
 *
 * AIDEV-NOTE: This module provides the complete conditions system for Traktor TSI files.
 * Conditions allow MIDI mappings to be conditional on Traktor's current state.
 *
 * It includes:
 * - ConditionType: Type of condition value (Enum or Int)
 * - KnownConditions: All ~80 Traktor condition IDs
 * - CONDITION_METADATA: Lookup table mapping condition IDs to their descriptions
 * - Condition value enums: OnOff, ModifierValue, SlotState, etc.
 * - Helper functions for condition lookup and filtering
 *
 * @example
 * import {
 *   KnownConditions,
 *   getConditionDescription,
 *   getConditionsByCategory,
 *   ModifierValue,
 *   getConditionValueDescription,
 * } from './conditions';
 *
 * // Get a specific condition
 * const modifier1 = getConditionDescription(KnownConditions.Modifier_Modifier1);
 *
 * // Get all conditions in a category
 * const modifierConditions = getConditionsByCategory(Categories.Modifier);
 *
 * // Get human-readable value description
 * const valueDesc = getConditionValueDescription("ModifierValue", ModifierValue.Value_3);
 */

// Re-export from commands for convenience (conditions use these too)
export { Categories, getCategoryDescription } from "../commands/categories";
export { getTargetTypeDescription, TargetType } from "../commands/target-type";
// Types and interfaces
export type {
	ConditionDescription,
	ConditionDescriptionInput,
} from "./condition-description";
export { createConditionDescription } from "./condition-description";
// Metadata and helpers
export {
	CONDITION_METADATA,
	getAllKnownConditionIds,
	getConditionDescription,
	getConditionDescriptionOrUnknown,
	getConditionsByCategory,
	getConditionsByTargetType,
	getKnownConditionsCount,
	isKnownCondition,
} from "./condition-metadata";
// Enums
export { ConditionType, getConditionTypeDescription } from "./condition-types";
export type { ConditionValueEnumType } from "./condition-value-enums";
// Condition value enums
export {
	CAPTURE_SOURCE_DESCRIPTIONS,
	// Enums
	CaptureSource,
	CONDITION_VALUE_DESCRIPTIONS,
	CUE_LOOP_MOVE_MODE_DESCRIPTIONS,
	CueLoopMoveMode,
	DECK_FLAVOR_DESCRIPTIONS,
	DeckFlavor,
	FX_UNIT_MODE_DESCRIPTIONS,
	FXUnitMode,
	// Description lookup function
	getConditionValueDescription,
	HOTCUE_TYPE_DESCRIPTIONS,
	HotcueType,
	MODIFIER_VALUE_DESCRIPTIONS,
	ModifierValue,
	ON_OFF_DESCRIPTIONS,
	OnOff,
	PLAY_MODE_DESCRIPTIONS,
	PlayMode,
	SAMPLE_DESCRIPTIONS,
	SAMPLE_PAGE_DESCRIPTIONS,
	Sample,
	SamplePage,
	SLOT_CELL_STATE_DESCRIPTIONS,
	SLOT_STATE_DESCRIPTIONS,
	SLOT_TRIGGER_TYPE_DESCRIPTIONS,
	SlotCellState,
	SlotState,
	SlotTriggerType,
	TEMPO_RANGE_DESCRIPTIONS,
	TempoRange,
} from "./condition-value-enums";
export { KNOWN_CONDITIONS_COUNT, KnownConditions } from "./known-conditions";

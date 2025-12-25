/**
 * Condition Metadata - Main metadata registry and helper functions
 *
 * AIDEV-NOTE: This file contains the main CONDITION_METADATA registry mapping condition
 * IDs to their descriptions, plus helper functions for looking up and filtering conditions.
 *
 * The metadata follows the same pattern as the commands system:
 * - CONDITION_METADATA: Record<number, ConditionDescriptionInput>
 * - Helper functions for lookup and filtering
 *
 * @see cmdr/cmdr.TsiLib/Conditions/Interpretation/KnownConditions.cs
 * @see cmdr/cmdr.TsiLib/Conditions/All.cs
 */

import { Categories } from "../commands/categories";
import { TargetType } from "../commands/target-type";
import {
  type ConditionDescription,
  type ConditionDescriptionInput,
  createConditionDescription,
} from "./condition-description";
import { CONDITION_METADATA_SLOTS } from "./condition-metadata-slots";
import { ConditionType } from "./condition-types";
import { KnownConditions } from "./known-conditions";

// ============================================================================
// Main Condition Metadata (non-slot conditions)
// ============================================================================

/**
 * Metadata for all conditions except the 64 slot cell state conditions.
 * The slot conditions are imported from condition-metadata-slots.ts.
 */
const CONDITION_METADATA_MAIN: Record<number, ConditionDescriptionInput> = {
  // ============================================================================
  // Deck Common Conditions
  // ============================================================================

  [KnownConditions.DeckCommon_TempoRange]: {
    name: "Tempo Range",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    conditionType: ConditionType.Enum,
    valueEnumType: "TempoRange",
  },

  [KnownConditions.DeckCommon_PlayPause]: {
    name: "Play/Pause (Deck Common)",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    conditionType: ConditionType.Enum,
    valueEnumType: "OnOff",
  },

  [KnownConditions.DeckCommon_IsInActiveLoop]: {
    name: "Is In Active Loop",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    conditionType: ConditionType.Enum,
    valueEnumType: "OnOff",
  },

  [KnownConditions.DeckCommon_Timecode_ScratchControlOn]: {
    name: "Scratch Control On",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    conditionType: ConditionType.Enum,
    valueEnumType: "OnOff",
  },

  [KnownConditions.DeckCommon_DeckFlavor]: {
    name: "Deck Flavor",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    conditionType: ConditionType.Enum,
    valueEnumType: "DeckFlavor",
  },

  // ============================================================================
  // Remix Deck Conditions
  // ============================================================================

  [KnownConditions.RemixDeck_SlotState]: {
    name: "Slot State",
    category: Categories.RemixDeck,
    targetType: TargetType.Slot,
    conditionType: ConditionType.Enum,
    valueEnumType: "SlotState",
  },

  [KnownConditions.RemixDeck_SlotPlayMode]: {
    name: "Slot Play Mode",
    category: Categories.RemixDeck,
    targetType: TargetType.Slot,
    conditionType: ConditionType.Enum,
    valueEnumType: "PlayMode",
  },

  [KnownConditions.RemixDeck_SamplePageSelector]: {
    name: "Sample Page Selector",
    category: Categories.RemixDeck,
    targetType: TargetType.Remix,
    conditionType: ConditionType.Enum,
    valueEnumType: "SamplePage",
  },

  [KnownConditions.RemixDeck_CaptureSource]: {
    name: "Capture Source",
    category: Categories.RemixDeck,
    targetType: TargetType.Remix,
    conditionType: ConditionType.Enum,
    valueEnumType: "CaptureSource",
  },

  [KnownConditions.RemixDeck_SlotTriggerType]: {
    name: "Slot Trigger Type",
    category: Categories.RemixDeck,
    targetType: TargetType.Slot,
    conditionType: ConditionType.Enum,
    valueEnumType: "SlotTriggerType",
  },

  // ============================================================================
  // Remix Deck Step Sequencer Conditions
  // ============================================================================

  [KnownConditions.RemixDeck_StepSequencer_CurrentStep]: {
    name: "Current Step",
    category: Categories.RemixDeck_StepSequencer,
    targetType: TargetType.Slot,
    conditionType: ConditionType.Enum,
    valueEnumType: "Sample",
  },

  // ============================================================================
  // Track Deck Conditions - Hotcue Types
  // ============================================================================

  [KnownConditions.TrackDeck_Cue_Hotcue1Type]: {
    name: "Hotcue 1 Type",
    category: Categories.TrackDeck,
    targetType: TargetType.Track,
    conditionType: ConditionType.Enum,
    valueEnumType: "HotcueType",
  },

  [KnownConditions.TrackDeck_Cue_Hotcue2Type]: {
    name: "Hotcue 2 Type",
    category: Categories.TrackDeck,
    targetType: TargetType.Track,
    conditionType: ConditionType.Enum,
    valueEnumType: "HotcueType",
  },

  [KnownConditions.TrackDeck_Cue_Hotcue3Type]: {
    name: "Hotcue 3 Type",
    category: Categories.TrackDeck,
    targetType: TargetType.Track,
    conditionType: ConditionType.Enum,
    valueEnumType: "HotcueType",
  },

  [KnownConditions.TrackDeck_Cue_Hotcue4Type]: {
    name: "Hotcue 4 Type",
    category: Categories.TrackDeck,
    targetType: TargetType.Track,
    conditionType: ConditionType.Enum,
    valueEnumType: "HotcueType",
  },

  [KnownConditions.TrackDeck_Cue_Hotcue5Type]: {
    name: "Hotcue 5 Type",
    category: Categories.TrackDeck,
    targetType: TargetType.Track,
    conditionType: ConditionType.Enum,
    valueEnumType: "HotcueType",
  },

  [KnownConditions.TrackDeck_Cue_Hotcue6Type]: {
    name: "Hotcue 6 Type",
    category: Categories.TrackDeck,
    targetType: TargetType.Track,
    conditionType: ConditionType.Enum,
    valueEnumType: "HotcueType",
  },

  [KnownConditions.TrackDeck_Cue_Hotcue7Type]: {
    name: "Hotcue 7 Type",
    category: Categories.TrackDeck,
    targetType: TargetType.Track,
    conditionType: ConditionType.Enum,
    valueEnumType: "HotcueType",
  },

  [KnownConditions.TrackDeck_Cue_Hotcue8Type]: {
    name: "Hotcue 8 Type",
    category: Categories.TrackDeck,
    targetType: TargetType.Track,
    conditionType: ConditionType.Enum,
    valueEnumType: "HotcueType",
  },

  [KnownConditions.TrackDeck_Cue_LoopMoveMode]: {
    name: "Cue/Loop Move Mode",
    category: Categories.TrackDeck,
    targetType: TargetType.Track,
    conditionType: ConditionType.Enum,
    valueEnumType: "CueLoopMoveMode",
  },

  // ============================================================================
  // FX Unit Conditions
  // ============================================================================

  [KnownConditions.FXUnit_FXUnitMode]: {
    name: "FX Unit Mode",
    category: Categories.FXUnit,
    targetType: TargetType.FX,
    conditionType: ConditionType.Enum,
    valueEnumType: "FXUnitMode",
  },

  // ============================================================================
  // Modifier Conditions (M1-M8)
  // ============================================================================

  [KnownConditions.Modifier_Modifier1]: {
    name: "M1",
    category: Categories.Modifier,
    targetType: TargetType.Global,
    conditionType: ConditionType.Enum,
    valueEnumType: "ModifierValue",
  },

  [KnownConditions.Modifier_Modifier2]: {
    name: "M2",
    category: Categories.Modifier,
    targetType: TargetType.Global,
    conditionType: ConditionType.Enum,
    valueEnumType: "ModifierValue",
  },

  [KnownConditions.Modifier_Modifier3]: {
    name: "M3",
    category: Categories.Modifier,
    targetType: TargetType.Global,
    conditionType: ConditionType.Enum,
    valueEnumType: "ModifierValue",
  },

  [KnownConditions.Modifier_Modifier4]: {
    name: "M4",
    category: Categories.Modifier,
    targetType: TargetType.Global,
    conditionType: ConditionType.Enum,
    valueEnumType: "ModifierValue",
  },

  [KnownConditions.Modifier_Modifier5]: {
    name: "M5",
    category: Categories.Modifier,
    targetType: TargetType.Global,
    conditionType: ConditionType.Enum,
    valueEnumType: "ModifierValue",
  },

  [KnownConditions.Modifier_Modifier6]: {
    name: "M6",
    category: Categories.Modifier,
    targetType: TargetType.Global,
    conditionType: ConditionType.Enum,
    valueEnumType: "ModifierValue",
  },

  [KnownConditions.Modifier_Modifier7]: {
    name: "M7",
    category: Categories.Modifier,
    targetType: TargetType.Global,
    conditionType: ConditionType.Enum,
    valueEnumType: "ModifierValue",
  },

  [KnownConditions.Modifier_Modifier8]: {
    name: "M8",
    category: Categories.Modifier,
    targetType: TargetType.Global,
    conditionType: ConditionType.Enum,
    valueEnumType: "ModifierValue",
  },
};

// ============================================================================
// Combined Condition Metadata
// ============================================================================

/**
 * Complete metadata registry for all known Traktor conditions.
 * Maps condition ID to its description input (without the ID itself).
 *
 * AIDEV-NOTE: This combines the main conditions with the slot cell state conditions.
 * Use the helper functions below for type-safe lookups.
 */
export const CONDITION_METADATA: Record<number, ConditionDescriptionInput> = {
  ...CONDITION_METADATA_MAIN,
  ...CONDITION_METADATA_SLOTS,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a condition ID is known (has metadata).
 *
 * @param id - The condition ID to check
 * @returns true if the condition is known
 */
export function isKnownCondition(id: number): boolean {
  return id in CONDITION_METADATA;
}

/**
 * Get the description for a condition by ID.
 * Returns undefined if the condition is not known.
 *
 * @param id - The condition ID to look up
 * @returns ConditionDescription or undefined
 */
export function getConditionDescription(id: number): ConditionDescription | undefined {
  const input = CONDITION_METADATA[id];
  if (!input) {
    return undefined;
  }
  return createConditionDescription(id, input);
}

/**
 * Get the description for a condition by ID, returning an "Unknown" condition
 * if the ID is not recognized.
 *
 * @param id - The condition ID to look up
 * @returns ConditionDescription (never undefined)
 */
export function getConditionDescriptionOrUnknown(id: number): ConditionDescription {
  const description = getConditionDescription(id);
  if (description) {
    return description;
  }

  // Return an "Unknown Condition" placeholder
  return {
    id,
    name: `Unknown Condition ${id}`,
    category: Categories.Unknown,
    targetType: TargetType.Global,
    conditionType: ConditionType.Int,
    valueEnumType: undefined,
  };
}

/**
 * Get all conditions in a specific category.
 *
 * @param category - The category to filter by
 * @returns Array of ConditionDescriptions in that category
 */
export function getConditionsByCategory(category: Categories): ConditionDescription[] {
  const results: ConditionDescription[] = [];

  for (const [idStr, input] of Object.entries(CONDITION_METADATA)) {
    if (input.category === category) {
      const id = Number.parseInt(idStr, 10);
      results.push(createConditionDescription(id, input));
    }
  }

  return results;
}

/**
 * Get all conditions with a specific target type.
 *
 * @param targetType - The target type to filter by
 * @returns Array of ConditionDescriptions with that target type
 */
export function getConditionsByTargetType(targetType: TargetType): ConditionDescription[] {
  const results: ConditionDescription[] = [];

  for (const [idStr, input] of Object.entries(CONDITION_METADATA)) {
    if (input.targetType === targetType) {
      const id = Number.parseInt(idStr, 10);
      results.push(createConditionDescription(id, input));
    }
  }

  return results;
}

/**
 * Get all known condition IDs.
 *
 * @returns Array of all known condition IDs
 */
export function getAllKnownConditionIds(): number[] {
  return Object.keys(CONDITION_METADATA).map((k) => Number.parseInt(k, 10));
}

/**
 * Get the total count of known conditions.
 *
 * @returns Number of known conditions
 */
export function getKnownConditionsCount(): number {
  return Object.keys(CONDITION_METADATA).length;
}

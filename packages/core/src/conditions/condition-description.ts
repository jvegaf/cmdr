/**
 * Condition Description - Interface describing a Traktor condition
 *
 * AIDEV-NOTE: This interface mirrors the C# ConditionDescription struct.
 * Conditions are used to make MIDI mappings conditional on Traktor's state.
 * Each condition has:
 * - A unique ID
 * - A display name
 * - A category for organization
 * - A target type (Global, Track, Remix, FX, Slot)
 * - A condition type (Enum or Int)
 * - An optional value enum type specifying which values are valid
 *
 * @see cmdr/cmdr.TsiLib/Conditions/Interpretation/ConditionDescription.cs
 */

import type { Categories } from "../commands/categories";
import type { TargetType } from "../commands/target-type";
import type { ConditionType } from "./condition-types";
import type { ConditionValueEnumType } from "./condition-value-enums";

/**
 * Full description of a condition, including its computed ID.
 * This is what gets returned from lookup functions.
 */
export interface ConditionDescription {
  /** Unique condition ID (from KnownConditions enum) */
  id: number;

  /** Human-readable display name */
  name: string;

  /** Category for organizing conditions in the UI */
  category: Categories;

  /** Target type determines which assignment options are available */
  targetType: TargetType;

  /** Type of value this condition uses (Enum or Int) */
  conditionType: ConditionType;

  /**
   * For Enum conditions, identifies which enum type defines the valid values.
   * Undefined for Int conditions.
   */
  valueEnumType?: ConditionValueEnumType;
}

/**
 * Input type for defining condition metadata (ID is provided separately as the key).
 * Used when building the CONDITION_METADATA lookup table.
 */
export interface ConditionDescriptionInput {
  /** Human-readable display name */
  name: string;

  /** Category for organizing conditions in the UI */
  category: Categories;

  /** Target type determines which assignment options are available */
  targetType: TargetType;

  /** Type of value this condition uses (Enum or Int) */
  conditionType: ConditionType;

  /**
   * For Enum conditions, identifies which enum type defines the valid values.
   * Undefined for Int conditions.
   */
  valueEnumType?: ConditionValueEnumType;
}

/**
 * Create a full ConditionDescription from an ID and input data.
 *
 * @param id - The condition ID
 * @param input - The condition metadata (without ID)
 * @returns Complete ConditionDescription with ID included
 */
export function createConditionDescription(
  id: number,
  input: ConditionDescriptionInput,
): ConditionDescription {
  return {
    id,
    name: input.name,
    category: input.category,
    targetType: input.targetType,
    conditionType: input.conditionType,
    valueEnumType: input.valueEnumType,
  };
}

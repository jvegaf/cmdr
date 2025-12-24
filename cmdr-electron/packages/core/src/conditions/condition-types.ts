/**
 * Condition Types - Types of conditions in Traktor TSI files
 *
 * AIDEV-NOTE: This enum defines the type of value a condition can have.
 * Conditions are simpler than commands - they either have an enum value
 * (e.g., OnOff, ModifierValue) or an integer value.
 *
 * @see cmdr/cmdr.TsiLib/Conditions/EnumCondition.cs
 * @see cmdr/cmdr.TsiLib/Conditions/IntCondition.cs
 */

/**
 * The type of value a condition uses.
 *
 * - Enum: Condition value is one of a predefined set (e.g., OnOff, ModifierValue 0-7)
 * - Int: Condition value is an integer (rarely used)
 */
export enum ConditionType {
  /** Enum-based condition (most common) */
  Enum = "Enum",
  /** Integer-based condition (rare) */
  Int = "Int",
}

/**
 * Get a human-readable description for a condition type
 */
export function getConditionTypeDescription(conditionType: ConditionType): string {
  switch (conditionType) {
    case ConditionType.Enum:
      return "Enumerated value";
    case ConditionType.Int:
      return "Integer value";
    default:
      return "Unknown";
  }
}

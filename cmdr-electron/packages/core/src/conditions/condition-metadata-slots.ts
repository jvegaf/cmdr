/**
 * Condition Metadata - Slot Cell State Conditions
 *
 * AIDEV-NOTE: This file contains metadata for all 64 Remix Deck Slot Cell State conditions
 * (IDs 665-728). These are separated into their own file to keep condition-metadata.ts clean.
 *
 * Each slot (1-4) has 16 cells, and each cell has a state condition.
 * All use the SlotCellState enum (Empty, Loaded, Playing, Waiting).
 *
 * @see cmdr/cmdr.TsiLib/Conditions/Interpretation/KnownConditions.cs
 */

import { Categories } from "../commands/categories";
import { TargetType } from "../commands/target-type";
import type { ConditionDescriptionInput } from "./condition-description";
import { ConditionType } from "./condition-types";
import { KnownConditions } from "./known-conditions";

/**
 * Map slot number to the correct category.
 * AIDEV-NOTE: Using a Map ensures type safety for the slot lookup.
 */
const SLOT_CATEGORY_MAP = new Map<number, Categories>([
  [1, Categories.RemixDeck_DirectMapping_Slot1],
  [2, Categories.RemixDeck_DirectMapping_Slot2],
  [3, Categories.RemixDeck_DirectMapping_Slot3],
  [4, Categories.RemixDeck_DirectMapping_Slot4],
]);

/**
 * Helper function to create a Slot Cell State condition entry.
 */
function slotCellStateCondition(
  slot: 1 | 2 | 3 | 4,
  cell: number,
): ConditionDescriptionInput {
  const category = SLOT_CATEGORY_MAP.get(slot);
  if (!category) {
    throw new Error(`Invalid slot number: ${slot}`);
  }

  return {
    name: `Slot ${slot} Cell ${cell} State`,
    category,
    targetType: TargetType.Remix,
    conditionType: ConditionType.Enum,
    valueEnumType: "SlotCellState",
  };
}

/**
 * Metadata for all 64 Slot Cell State conditions (IDs 665-728).
 * Organized by slot (1-4) with 16 cells each.
 */
export const CONDITION_METADATA_SLOTS: Record<number, ConditionDescriptionInput> = {
  // ============================================================================
  // Slot 1, Cells 1-16 (IDs 665-680)
  // ============================================================================
  [KnownConditions.RemixDeck_DirectMapping_Slot1_Slot1Cell1State]: slotCellStateCondition(1, 1),
  [KnownConditions.RemixDeck_DirectMapping_Slot1_Slot1Cell2State]: slotCellStateCondition(1, 2),
  [KnownConditions.RemixDeck_DirectMapping_Slot1_Slot1Cell3State]: slotCellStateCondition(1, 3),
  [KnownConditions.RemixDeck_DirectMapping_Slot1_Slot1Cell4State]: slotCellStateCondition(1, 4),
  [KnownConditions.RemixDeck_DirectMapping_Slot1_Slot1Cell5State]: slotCellStateCondition(1, 5),
  [KnownConditions.RemixDeck_DirectMapping_Slot1_Slot1Cell6State]: slotCellStateCondition(1, 6),
  [KnownConditions.RemixDeck_DirectMapping_Slot1_Slot1Cell7State]: slotCellStateCondition(1, 7),
  [KnownConditions.RemixDeck_DirectMapping_Slot1_Slot1Cell8State]: slotCellStateCondition(1, 8),
  [KnownConditions.RemixDeck_DirectMapping_Slot1_Slot1Cell9State]: slotCellStateCondition(1, 9),
  [KnownConditions.RemixDeck_DirectMapping_Slot1_Slot1Cell10State]: slotCellStateCondition(1, 10),
  [KnownConditions.RemixDeck_DirectMapping_Slot1_Slot1Cell11State]: slotCellStateCondition(1, 11),
  [KnownConditions.RemixDeck_DirectMapping_Slot1_Slot1Cell12State]: slotCellStateCondition(1, 12),
  [KnownConditions.RemixDeck_DirectMapping_Slot1_Slot1Cell13State]: slotCellStateCondition(1, 13),
  [KnownConditions.RemixDeck_DirectMapping_Slot1_Slot1Cell14State]: slotCellStateCondition(1, 14),
  [KnownConditions.RemixDeck_DirectMapping_Slot1_Slot1Cell15State]: slotCellStateCondition(1, 15),
  [KnownConditions.RemixDeck_DirectMapping_Slot1_Slot1Cell16State]: slotCellStateCondition(1, 16),

  // ============================================================================
  // Slot 2, Cells 1-16 (IDs 681-696)
  // ============================================================================
  [KnownConditions.RemixDeck_DirectMapping_Slot2_Slot2Cell1State]: slotCellStateCondition(2, 1),
  [KnownConditions.RemixDeck_DirectMapping_Slot2_Slot2Cell2State]: slotCellStateCondition(2, 2),
  [KnownConditions.RemixDeck_DirectMapping_Slot2_Slot2Cell3State]: slotCellStateCondition(2, 3),
  [KnownConditions.RemixDeck_DirectMapping_Slot2_Slot2Cell4State]: slotCellStateCondition(2, 4),
  [KnownConditions.RemixDeck_DirectMapping_Slot2_Slot2Cell5State]: slotCellStateCondition(2, 5),
  [KnownConditions.RemixDeck_DirectMapping_Slot2_Slot2Cell6State]: slotCellStateCondition(2, 6),
  [KnownConditions.RemixDeck_DirectMapping_Slot2_Slot2Cell7State]: slotCellStateCondition(2, 7),
  [KnownConditions.RemixDeck_DirectMapping_Slot2_Slot2Cell8State]: slotCellStateCondition(2, 8),
  [KnownConditions.RemixDeck_DirectMapping_Slot2_Slot2Cell9State]: slotCellStateCondition(2, 9),
  [KnownConditions.RemixDeck_DirectMapping_Slot2_Slot2Cell10State]: slotCellStateCondition(2, 10),
  [KnownConditions.RemixDeck_DirectMapping_Slot2_Slot2Cell11State]: slotCellStateCondition(2, 11),
  [KnownConditions.RemixDeck_DirectMapping_Slot2_Slot2Cell12State]: slotCellStateCondition(2, 12),
  [KnownConditions.RemixDeck_DirectMapping_Slot2_Slot2Cell13State]: slotCellStateCondition(2, 13),
  [KnownConditions.RemixDeck_DirectMapping_Slot2_Slot2Cell14State]: slotCellStateCondition(2, 14),
  [KnownConditions.RemixDeck_DirectMapping_Slot2_Slot2Cell15State]: slotCellStateCondition(2, 15),
  [KnownConditions.RemixDeck_DirectMapping_Slot2_Slot2Cell16State]: slotCellStateCondition(2, 16),

  // ============================================================================
  // Slot 3, Cells 1-16 (IDs 697-712)
  // ============================================================================
  [KnownConditions.RemixDeck_DirectMapping_Slot3_Slot3Cell1State]: slotCellStateCondition(3, 1),
  [KnownConditions.RemixDeck_DirectMapping_Slot3_Slot3Cell2State]: slotCellStateCondition(3, 2),
  [KnownConditions.RemixDeck_DirectMapping_Slot3_Slot3Cell3State]: slotCellStateCondition(3, 3),
  [KnownConditions.RemixDeck_DirectMapping_Slot3_Slot3Cell4State]: slotCellStateCondition(3, 4),
  [KnownConditions.RemixDeck_DirectMapping_Slot3_Slot3Cell5State]: slotCellStateCondition(3, 5),
  [KnownConditions.RemixDeck_DirectMapping_Slot3_Slot3Cell6State]: slotCellStateCondition(3, 6),
  [KnownConditions.RemixDeck_DirectMapping_Slot3_Slot3Cell7State]: slotCellStateCondition(3, 7),
  [KnownConditions.RemixDeck_DirectMapping_Slot3_Slot3Cell8State]: slotCellStateCondition(3, 8),
  [KnownConditions.RemixDeck_DirectMapping_Slot3_Slot3Cell9State]: slotCellStateCondition(3, 9),
  [KnownConditions.RemixDeck_DirectMapping_Slot3_Slot3Cell10State]: slotCellStateCondition(3, 10),
  [KnownConditions.RemixDeck_DirectMapping_Slot3_Slot3Cell11State]: slotCellStateCondition(3, 11),
  [KnownConditions.RemixDeck_DirectMapping_Slot3_Slot3Cell12State]: slotCellStateCondition(3, 12),
  [KnownConditions.RemixDeck_DirectMapping_Slot3_Slot3Cell13State]: slotCellStateCondition(3, 13),
  [KnownConditions.RemixDeck_DirectMapping_Slot3_Slot3Cell14State]: slotCellStateCondition(3, 14),
  [KnownConditions.RemixDeck_DirectMapping_Slot3_Slot3Cell15State]: slotCellStateCondition(3, 15),
  [KnownConditions.RemixDeck_DirectMapping_Slot3_Slot3Cell16State]: slotCellStateCondition(3, 16),

  // ============================================================================
  // Slot 4, Cells 1-16 (IDs 713-728)
  // ============================================================================
  [KnownConditions.RemixDeck_DirectMapping_Slot4_Slot4Cell1State]: slotCellStateCondition(4, 1),
  [KnownConditions.RemixDeck_DirectMapping_Slot4_Slot4Cell2State]: slotCellStateCondition(4, 2),
  [KnownConditions.RemixDeck_DirectMapping_Slot4_Slot4Cell3State]: slotCellStateCondition(4, 3),
  [KnownConditions.RemixDeck_DirectMapping_Slot4_Slot4Cell4State]: slotCellStateCondition(4, 4),
  [KnownConditions.RemixDeck_DirectMapping_Slot4_Slot4Cell5State]: slotCellStateCondition(4, 5),
  [KnownConditions.RemixDeck_DirectMapping_Slot4_Slot4Cell6State]: slotCellStateCondition(4, 6),
  [KnownConditions.RemixDeck_DirectMapping_Slot4_Slot4Cell7State]: slotCellStateCondition(4, 7),
  [KnownConditions.RemixDeck_DirectMapping_Slot4_Slot4Cell8State]: slotCellStateCondition(4, 8),
  [KnownConditions.RemixDeck_DirectMapping_Slot4_Slot4Cell9State]: slotCellStateCondition(4, 9),
  [KnownConditions.RemixDeck_DirectMapping_Slot4_Slot4Cell10State]: slotCellStateCondition(4, 10),
  [KnownConditions.RemixDeck_DirectMapping_Slot4_Slot4Cell11State]: slotCellStateCondition(4, 11),
  [KnownConditions.RemixDeck_DirectMapping_Slot4_Slot4Cell12State]: slotCellStateCondition(4, 12),
  [KnownConditions.RemixDeck_DirectMapping_Slot4_Slot4Cell13State]: slotCellStateCondition(4, 13),
  [KnownConditions.RemixDeck_DirectMapping_Slot4_Slot4Cell14State]: slotCellStateCondition(4, 14),
  [KnownConditions.RemixDeck_DirectMapping_Slot4_Slot4Cell15State]: slotCellStateCondition(4, 15),
  [KnownConditions.RemixDeck_DirectMapping_Slot4_Slot4Cell16State]: slotCellStateCondition(4, 16),
};

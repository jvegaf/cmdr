/**
 * Tests for the Conditions System
 *
 * AIDEV-NOTE: These tests verify the conditions module:
 * - KnownConditions enum values
 * - Condition metadata lookup functions
 * - Condition value enums and descriptions
 * - Category filtering
 */

import { describe, expect, it } from "vitest";
import {
  Categories,
  CONDITION_METADATA,
  ConditionType,
  CueLoopMoveMode,
  DeckFlavor,
  FXUnitMode,
  getAllKnownConditionIds,
  getConditionDescription,
  getConditionDescriptionOrUnknown,
  getConditionsByCategory,
  getConditionsByTargetType,
  getConditionValueDescription,
  getKnownConditionsCount,
  HotcueType,
  isKnownCondition,
  KNOWN_CONDITIONS_COUNT,
  KnownConditions,
  ModifierValue,
  OnOff,
  PlayMode,
  SamplePage,
  SlotCellState,
  SlotState,
  SlotTriggerType,
  TargetType,
  TempoRange,
} from "../src/conditions/index.js";

describe("KnownConditions enum", () => {
  it("should have the correct ID for Modifier_Modifier1", () => {
    expect(KnownConditions.Modifier_Modifier1).toBe(2548);
  });

  it("should have the correct ID for DeckCommon_TempoRange", () => {
    expect(KnownConditions.DeckCommon_TempoRange).toBe(19);
  });

  it("should have the correct ID for FXUnit_FXUnitMode", () => {
    expect(KnownConditions.FXUnit_FXUnitMode).toBe(2301);
  });

  it("should have slot cell state conditions in the correct range", () => {
    expect(KnownConditions.RemixDeck_DirectMapping_Slot1_Slot1Cell1State).toBe(665);
    expect(KnownConditions.RemixDeck_DirectMapping_Slot4_Slot4Cell16State).toBe(728);
  });

  it("should have 8 modifier conditions", () => {
    const modifierIds = [
      KnownConditions.Modifier_Modifier1,
      KnownConditions.Modifier_Modifier2,
      KnownConditions.Modifier_Modifier3,
      KnownConditions.Modifier_Modifier4,
      KnownConditions.Modifier_Modifier5,
      KnownConditions.Modifier_Modifier6,
      KnownConditions.Modifier_Modifier7,
      KnownConditions.Modifier_Modifier8,
    ];
    expect(modifierIds).toHaveLength(8);
    // IDs should be consecutive: 2548-2555
    expect(modifierIds[0]).toBe(2548);
    expect(modifierIds[7]).toBe(2555);
  });
});

describe("Condition metadata lookup", () => {
  it("should return metadata for known condition (Modifier M1)", () => {
    const desc = getConditionDescription(KnownConditions.Modifier_Modifier1);
    expect(desc).toBeDefined();
    expect(desc?.name).toBe("M1");
    expect(desc?.category).toBe(Categories.Modifier);
    expect(desc?.targetType).toBe(TargetType.Global);
    expect(desc?.conditionType).toBe(ConditionType.Enum);
    expect(desc?.valueEnumType).toBe("ModifierValue");
  });

  it("should return metadata for DeckCommon_TempoRange", () => {
    const desc = getConditionDescription(KnownConditions.DeckCommon_TempoRange);
    expect(desc).toBeDefined();
    expect(desc?.name).toBe("Tempo Range");
    expect(desc?.category).toBe(Categories.DeckCommon);
    expect(desc?.targetType).toBe(TargetType.Track);
    expect(desc?.valueEnumType).toBe("TempoRange");
  });

  it("should return metadata for slot cell state condition", () => {
    const desc = getConditionDescription(
      KnownConditions.RemixDeck_DirectMapping_Slot1_Slot1Cell1State,
    );
    expect(desc).toBeDefined();
    expect(desc?.name).toBe("Slot 1 Cell 1 State");
    expect(desc?.category).toBe(Categories.RemixDeck_DirectMapping_Slot1);
    expect(desc?.targetType).toBe(TargetType.Remix);
    expect(desc?.valueEnumType).toBe("SlotCellState");
  });

  it("should return undefined for unknown condition", () => {
    const desc = getConditionDescription(99999);
    expect(desc).toBeUndefined();
  });

  it("should return unknown placeholder for unknown condition with OrUnknown function", () => {
    const desc = getConditionDescriptionOrUnknown(99999);
    expect(desc).toBeDefined();
    expect(desc.name).toBe("Unknown Condition 99999");
    expect(desc.category).toBe(Categories.Unknown);
    expect(desc.conditionType).toBe(ConditionType.Int);
  });

  it("should correctly identify known conditions", () => {
    expect(isKnownCondition(KnownConditions.Modifier_Modifier1)).toBe(true);
    expect(isKnownCondition(KnownConditions.FXUnit_FXUnitMode)).toBe(true);
    expect(isKnownCondition(99999)).toBe(false);
  });
});

describe("Condition filtering", () => {
  it("should get all modifier conditions", () => {
    const modifiers = getConditionsByCategory(Categories.Modifier);
    expect(modifiers).toHaveLength(8);
    expect(modifiers.map((c) => c.name)).toEqual([
      "M1",
      "M2",
      "M3",
      "M4",
      "M5",
      "M6",
      "M7",
      "M8",
    ]);
  });

  it("should get all DeckCommon conditions", () => {
    const deckCommon = getConditionsByCategory(Categories.DeckCommon);
    expect(deckCommon.length).toBeGreaterThanOrEqual(5);
    const names = deckCommon.map((c) => c.name);
    expect(names).toContain("Tempo Range");
    expect(names).toContain("Play/Pause (Deck Common)");
    expect(names).toContain("Is In Active Loop");
    expect(names).toContain("Deck Flavor");
  });

  it("should get conditions by target type", () => {
    const globalConditions = getConditionsByTargetType(TargetType.Global);
    // All modifier conditions are global
    expect(globalConditions.length).toBeGreaterThanOrEqual(8);

    const fxConditions = getConditionsByTargetType(TargetType.FX);
    // FX Unit Mode is the only FX condition
    expect(fxConditions).toHaveLength(1);
    expect(fxConditions[0].name).toBe("FX Unit Mode");
  });

  it("should get 16 conditions for each slot category", () => {
    const slot1 = getConditionsByCategory(Categories.RemixDeck_DirectMapping_Slot1);
    const slot2 = getConditionsByCategory(Categories.RemixDeck_DirectMapping_Slot2);
    const slot3 = getConditionsByCategory(Categories.RemixDeck_DirectMapping_Slot3);
    const slot4 = getConditionsByCategory(Categories.RemixDeck_DirectMapping_Slot4);

    expect(slot1).toHaveLength(16);
    expect(slot2).toHaveLength(16);
    expect(slot3).toHaveLength(16);
    expect(slot4).toHaveLength(16);
  });
});

describe("Condition value enums", () => {
  it("should have correct OnOff values", () => {
    expect(OnOff.Off).toBe(0);
    expect(OnOff.On).toBe(1);
  });

  it("should have correct ModifierValue values", () => {
    expect(ModifierValue.Value_0).toBe(0);
    expect(ModifierValue.Value_7).toBe(7);
  });

  it("should have correct TempoRange values", () => {
    expect(TempoRange.Percent_2).toBe(0);
    expect(TempoRange.Percent_100).toBe(13);
  });

  it("should have correct SlotState values", () => {
    expect(SlotState.Empty).toBe(0);
    expect(SlotState.Paused).toBe(1);
    expect(SlotState.Playing).toBe(2);
  });

  it("should have correct SlotCellState values", () => {
    expect(SlotCellState.Empty).toBe(0);
    expect(SlotCellState.Loaded).toBe(1);
    expect(SlotCellState.Playing).toBe(2);
    expect(SlotCellState.Waiting).toBe(3);
  });

  it("should have correct PlayMode values", () => {
    expect(PlayMode.OneShot).toBe(0);
    expect(PlayMode.Looped).toBe(1);
  });

  it("should have correct SamplePage values", () => {
    expect(SamplePage.Page1).toBe(0);
    expect(SamplePage.Page4).toBe(3);
  });

  it("should have correct SlotTriggerType values", () => {
    expect(SlotTriggerType.Latched).toBe(0);
    expect(SlotTriggerType.Gated).toBe(1);
  });

  it("should have correct FXUnitMode values", () => {
    expect(FXUnitMode.Group).toBe(0);
    expect(FXUnitMode.Single).toBe(1);
  });

  it("should have correct DeckFlavor values", () => {
    expect(DeckFlavor.TrackDeck).toBe(0);
    expect(DeckFlavor.RemixDeck).toBe(1);
    expect(DeckFlavor.StemDeck).toBe(2);
    expect(DeckFlavor.LiveInput).toBe(3);
  });

  it("should have correct HotcueType values", () => {
    expect(HotcueType.None).toBe(-1);
    expect(HotcueType.Cue).toBe(0);
    expect(HotcueType.Loop).toBe(5);
  });

  it("should have correct CueLoopMoveMode values", () => {
    expect(CueLoopMoveMode.Beatjump).toBe(0);
    expect(CueLoopMoveMode.Loop).toBe(1);
    expect(CueLoopMoveMode.LoopIn).toBe(2);
    expect(CueLoopMoveMode.LoopOut).toBe(3);
  });
});

describe("Condition value descriptions", () => {
  it("should get correct OnOff descriptions", () => {
    expect(getConditionValueDescription("OnOff", OnOff.Off)).toBe("Off");
    expect(getConditionValueDescription("OnOff", OnOff.On)).toBe("On");
  });

  it("should get correct ModifierValue descriptions", () => {
    expect(getConditionValueDescription("ModifierValue", ModifierValue.Value_0)).toBe("0");
    expect(getConditionValueDescription("ModifierValue", ModifierValue.Value_7)).toBe("7");
  });

  it("should get correct TempoRange descriptions", () => {
    expect(getConditionValueDescription("TempoRange", TempoRange.Percent_2)).toBe("2%");
    expect(getConditionValueDescription("TempoRange", TempoRange.Percent_100)).toBe("100%");
  });

  it("should get correct SlotState descriptions", () => {
    expect(getConditionValueDescription("SlotState", SlotState.Empty)).toBe("Empty");
    expect(getConditionValueDescription("SlotState", SlotState.Playing)).toBe("Playing");
  });

  it("should get correct DeckFlavor descriptions", () => {
    expect(getConditionValueDescription("DeckFlavor", DeckFlavor.TrackDeck)).toBe("Track Deck");
    expect(getConditionValueDescription("DeckFlavor", DeckFlavor.StemDeck)).toBe("Stem Deck");
  });

  it("should handle unknown values gracefully", () => {
    expect(getConditionValueDescription("OnOff", 99)).toBe("Unknown (99)");
  });
});

describe("Condition metadata statistics", () => {
  it("should have metadata for all known conditions", () => {
    const allIds = getAllKnownConditionIds();
    expect(allIds.length).toBe(getKnownConditionsCount());

    // Verify each ID has valid metadata
    for (const id of allIds) {
      const desc = getConditionDescription(id);
      expect(desc).toBeDefined();
      expect(desc?.id).toBe(id);
      expect(desc?.name).toBeTruthy();
    }
  });

  it("should have at least 80 known conditions (64 slot + ~20 other)", () => {
    const count = getKnownConditionsCount();
    expect(count).toBeGreaterThanOrEqual(80);
  });

  it("KNOWN_CONDITIONS_COUNT should match metadata count", () => {
    expect(KNOWN_CONDITIONS_COUNT).toBe(getKnownConditionsCount());
  });

  it("should have 64 slot cell state conditions", () => {
    const slotConditions = [
      ...getConditionsByCategory(Categories.RemixDeck_DirectMapping_Slot1),
      ...getConditionsByCategory(Categories.RemixDeck_DirectMapping_Slot2),
      ...getConditionsByCategory(Categories.RemixDeck_DirectMapping_Slot3),
      ...getConditionsByCategory(Categories.RemixDeck_DirectMapping_Slot4),
    ];
    expect(slotConditions).toHaveLength(64);
  });

  it("CONDITION_METADATA should be a non-empty object", () => {
    expect(Object.keys(CONDITION_METADATA).length).toBeGreaterThan(0);
  });
});

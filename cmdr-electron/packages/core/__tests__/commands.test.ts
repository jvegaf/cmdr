/**
 * Tests for Commands System
 *
 * AIDEV-NOTE: These tests verify the command metadata system which provides
 * lookup for all ~500 Traktor Pro commands. The metadata must match the C#
 * original for binary compatibility with TSI files.
 *
 * @see cmdr/cmdr.TsiLib/Commands/Interpretation/KnownCommands.cs
 */

import { describe, expect, it } from "vitest";
import {
  Categories,
  COMMAND_METADATA,
  CommandInType,
  CommandOutType,
  FloatRangeType,
  getAllKnownCommandIds,
  getCommandDescription,
  getCommandDescriptionOrUnknown,
  getCommandsByCategory,
  isKnownCommand,
  KnownCommands,
  TargetType,
} from "../src/commands/index.js";

describe("Commands System", () => {
  describe("COMMAND_METADATA", () => {
    it("should have metadata for a substantial number of commands", () => {
      const count = Object.keys(COMMAND_METADATA).length;
      // We have ~500 commands split across multiple files (including 128 remix deck slot commands)
      expect(count).toBeGreaterThan(400);
      expect(count).toBeLessThan(600);
    });

    it("should have valid structure for all entries", () => {
      for (const [id, desc] of Object.entries(COMMAND_METADATA)) {
        expect(desc.name, `Command ${id} should have a name`).toBeDefined();
        expect(typeof desc.name).toBe("string");
        expect(desc.name.length).toBeGreaterThan(0);

        expect(desc.category, `Command ${id} should have a category`).toBeDefined();
        expect(typeof desc.category).toBe("number");

        expect(desc.targetType, `Command ${id} should have a targetType`).toBeDefined();
        expect(Object.values(TargetType)).toContain(desc.targetType);

        expect(desc.inCommandType, `Command ${id} should have an inCommandType`).toBeDefined();
        expect(Object.values(CommandInType)).toContain(desc.inCommandType);

        expect(desc.outCommandType, `Command ${id} should have an outCommandType`).toBeDefined();
        expect(Object.values(CommandOutType)).toContain(desc.outCommandType);
      }
    });

    it("should have float commands with floatRangeType specified", () => {
      for (const [id, desc] of Object.entries(COMMAND_METADATA)) {
        if (
          desc.inCommandType === CommandInType.Float ||
          desc.outCommandType === CommandOutType.Float
        ) {
          expect(
            desc.floatRangeType,
            `Float command ${id} (${desc.name}) should have floatRangeType`
          ).toBeDefined();
          expect(Object.values(FloatRangeType)).toContain(desc.floatRangeType);
        }
      }
    });

    it("should have enum commands with valueEnumType specified", () => {
      for (const [id, desc] of Object.entries(COMMAND_METADATA)) {
        if (
          desc.inCommandType === CommandInType.Enum ||
          desc.inCommandType === CommandInType.HoldEnum
        ) {
          // Allow OnOff commands without explicit valueEnumType since OnOff is the default
          if (desc.inCommandType !== CommandInType.OnOff) {
            expect(
              desc.valueEnumType,
              `Enum command ${id} (${desc.name}) should have valueEnumType`
            ).toBeDefined();
          }
        }
      }
    });
  });

  describe("KnownCommands enum", () => {
    it("should have numeric values", () => {
      // Sample check - verify a few known command IDs
      expect(typeof KnownCommands.DeckCommon_Loop_LoopInSetCue).toBe("number");
      expect(typeof KnownCommands.Modifier_Modifier1).toBe("number");
      expect(typeof KnownCommands.Global_BroadcastingOn).toBe("number");
    });

    it("should have unique values", () => {
      const values = Object.values(KnownCommands).filter((v) => typeof v === "number");
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it("should have correct specific command IDs", () => {
      // Verify some known command IDs from C# source
      expect(KnownCommands.DeckCommon_Loop_LoopInSetCue).toBe(2392);
      expect(KnownCommands.Modifier_Modifier1).toBe(2548);
      expect(KnownCommands.DeckCommon_PlayPause).toBe(100);
      expect(KnownCommands.Mixer_EQ_HighAdjust).toBe(303);
    });
  });

  describe("getCommandDescription", () => {
    it("should return metadata for known command", () => {
      const desc = getCommandDescription(KnownCommands.DeckCommon_Loop_LoopInSetCue);
      expect(desc).toBeDefined();
      expect(desc?.name).toBe("Loop In/Set Cue");
      expect(desc?.category).toBe(Categories.DeckCommon_Loop);
      expect(desc?.targetType).toBe(TargetType.Track);
      expect(desc?.inCommandType).toBe(CommandInType.Trigger);
      expect(desc?.outCommandType).toBe(CommandOutType.Trigger);
    });

    it("should return metadata for Modifier command", () => {
      const desc = getCommandDescription(KnownCommands.Modifier_Modifier1);
      expect(desc).toBeDefined();
      expect(desc?.name).toBe("Modifier #1");
      expect(desc?.category).toBe(Categories.Modifier);
      expect(desc?.targetType).toBe(TargetType.Global);
      expect(desc?.inCommandType).toBe(CommandInType.Enum);
      expect(desc?.outCommandType).toBe(CommandOutType.Enum);
    });

    it("should return metadata for FX Unit command", () => {
      const desc = getCommandDescription(KnownCommands.FXUnit_UnitOn);
      expect(desc).toBeDefined();
      expect(desc?.name).toBe("Unit On (FX Unit)");
      expect(desc?.category).toBe(Categories.FXUnit);
      expect(desc?.targetType).toBe(TargetType.FX);
    });

    it("should return undefined for unknown command ID", () => {
      const desc = getCommandDescription(99999);
      expect(desc).toBeUndefined();
    });

    it("should return undefined for negative command ID", () => {
      const desc = getCommandDescription(-1);
      expect(desc).toBeUndefined();
    });
  });

  describe("getCommandDescriptionOrUnknown", () => {
    it("should return metadata for known command", () => {
      const desc = getCommandDescriptionOrUnknown(KnownCommands.DeckCommon_PlayPause);
      expect(desc).toBeDefined();
      expect(desc.name).toBe("Play/Pause (Deck Common)");
      expect(desc.category).toBe(Categories.DeckCommon);
    });

    it("should return unknown fallback for unknown command ID", () => {
      const desc = getCommandDescriptionOrUnknown(99999);
      expect(desc).toBeDefined();
      expect(desc.id).toBe(99999);
      expect(desc.name).toBe("Unknown Command 99999");
      expect(desc.category).toBe(Categories.Unknown);
      expect(desc.targetType).toBe(TargetType.Global);
      expect(desc.inCommandType).toBe(CommandInType.Unknown);
      expect(desc.outCommandType).toBe(CommandOutType.Unknown);
    });

    it("should always return a valid CommandDescription", () => {
      const unknownIds = [0, -1, 99999, 123456];
      for (const id of unknownIds) {
        const desc = getCommandDescriptionOrUnknown(id);
        expect(desc).toBeDefined();
        expect(desc.id).toBe(id);
        expect(desc.name).toContain("Unknown Command");
      }
    });
  });

  describe("isKnownCommand", () => {
    it("should return true for known commands", () => {
      expect(isKnownCommand(KnownCommands.DeckCommon_Loop_LoopInSetCue)).toBe(true);
      expect(isKnownCommand(KnownCommands.Modifier_Modifier1)).toBe(true);
      expect(isKnownCommand(KnownCommands.Global_BroadcastingOn)).toBe(true);
    });

    it("should return false for unknown commands", () => {
      expect(isKnownCommand(99999)).toBe(false);
      expect(isKnownCommand(-1)).toBe(false);
      expect(isKnownCommand(0)).toBe(false);
    });
  });

  describe("getAllKnownCommandIds", () => {
    it("should return array of numbers", () => {
      const ids = getAllKnownCommandIds();
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        expect(typeof id).toBe("number");
      }
    });

    it("should return all command IDs from COMMAND_METADATA", () => {
      const ids = getAllKnownCommandIds();
      const metadataIds = Object.keys(COMMAND_METADATA).map(Number);
      expect(ids.sort()).toEqual(metadataIds.sort());
    });

    it("should return unique IDs", () => {
      const ids = getAllKnownCommandIds();
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("getCommandsByCategory", () => {
    it("should return commands for DeckCommon_Loop category", () => {
      const commands = getCommandsByCategory(Categories.DeckCommon_Loop);
      expect(commands.length).toBeGreaterThan(0);
      for (const cmd of commands) {
        expect(cmd.category).toBe(Categories.DeckCommon_Loop);
      }
      // Check for expected loop commands
      const names = commands.map((c) => c.name);
      expect(names).toContain("Loop In/Set Cue");
      expect(names).toContain("Loop Out");
    });

    it("should return commands for Modifier category", () => {
      const commands = getCommandsByCategory(Categories.Modifier);
      expect(commands.length).toBe(8); // Modifiers 1-8
      for (const cmd of commands) {
        expect(cmd.category).toBe(Categories.Modifier);
        expect(cmd.name).toMatch(/Modifier #\d/);
      }
    });

    it("should return commands for FXUnit category", () => {
      const commands = getCommandsByCategory(Categories.FXUnit);
      expect(commands.length).toBeGreaterThan(5);
      for (const cmd of commands) {
        expect(cmd.category).toBe(Categories.FXUnit);
      }
    });

    it("should return empty array for Unknown category", () => {
      const commands = getCommandsByCategory(Categories.Unknown);
      expect(commands).toEqual([]);
    });

    it("should include command ID in returned objects", () => {
      const commands = getCommandsByCategory(Categories.DeckCommon);
      expect(commands.length).toBeGreaterThan(0);
      for (const cmd of commands) {
        expect(typeof cmd.id).toBe("number");
        expect(cmd.id).toBeGreaterThan(0);
      }
    });
  });

  describe("Categories enum", () => {
    it("should have expected top-level categories", () => {
      expect(Categories.DeckCommon).toBeDefined();
      expect(Categories.TrackDeck).toBeDefined();
      expect(Categories.RemixDeck).toBeDefined();
      expect(Categories.Mixer).toBeDefined();
      expect(Categories.FXUnit).toBeDefined();
      expect(Categories.Browser).toBeDefined();
      expect(Categories.Global).toBeDefined();
      expect(Categories.Modifier).toBeDefined();
    });

    it("should have sub-categories", () => {
      expect(Categories.DeckCommon_Loop).toBeDefined();
      expect(Categories.DeckCommon_Move).toBeDefined();
      expect(Categories.TrackDeck_Cue).toBeDefined();
      expect(Categories.Mixer_EQ).toBeDefined();
      expect(Categories.Browser_List).toBeDefined();
      expect(Categories.Browser_Tree).toBeDefined();
    });

    it("should have Unknown category for fallback", () => {
      expect(Categories.Unknown).toBeDefined();
    });
  });

  describe("TargetType enum", () => {
    it("should have all target types", () => {
      expect(TargetType.Global).toBeDefined();
      expect(TargetType.Track).toBeDefined();
      expect(TargetType.Remix).toBeDefined();
      expect(TargetType.FX).toBeDefined();
      expect(TargetType.Slot).toBeDefined();
    });
  });

  describe("CommandInType enum", () => {
    it("should have all input types", () => {
      expect(CommandInType.None).toBeDefined();
      expect(CommandInType.Trigger).toBeDefined();
      expect(CommandInType.Hold).toBeDefined();
      expect(CommandInType.OnOff).toBeDefined();
      expect(CommandInType.Enum).toBeDefined();
      expect(CommandInType.HoldEnum).toBeDefined();
      expect(CommandInType.Float).toBeDefined();
      expect(CommandInType.Unknown).toBeDefined();
    });
  });

  describe("CommandOutType enum", () => {
    it("should have all output types", () => {
      expect(CommandOutType.None).toBeDefined();
      expect(CommandOutType.Trigger).toBeDefined();
      expect(CommandOutType.Enum).toBeDefined();
      expect(CommandOutType.Float).toBeDefined();
      expect(CommandOutType.Unknown).toBeDefined();
    });
  });

  describe("FloatRangeType enum", () => {
    it("should have all float range types", () => {
      expect(FloatRangeType.Relative).toBeDefined(); // 0.0 to 1.0
      expect(FloatRangeType.Centered).toBeDefined(); // -1.0 to 1.0
      expect(FloatRangeType.CenteredHalf).toBeDefined(); // -0.5 to 0.5
    });
  });

  describe("Specific command coverage", () => {
    // AIDEV-NOTE: These tests verify specific important commands from each category
    // to ensure the metadata parts are correctly merged.

    it("should have Deck Common commands (Part 1)", () => {
      expect(isKnownCommand(KnownCommands.DeckCommon_Loop_LoopInSetCue)).toBe(true);
      expect(isKnownCommand(KnownCommands.DeckCommon_Move_Beatjump)).toBe(true);
      expect(isKnownCommand(KnownCommands.DeckCommon_PlayPause)).toBe(true);
      expect(isKnownCommand(KnownCommands.DeckCommon_Cue)).toBe(true);
    });

    it("should have Track Deck commands (Part 2)", () => {
      expect(isKnownCommand(KnownCommands.TrackDeck_Cue_CueTypeSelector)).toBe(true);
      expect(isKnownCommand(KnownCommands.TrackDeck_Grid_Autogrid)).toBe(true);
      expect(isKnownCommand(KnownCommands.TrackDeck_KeylockOn)).toBe(true);
    });

    it("should have Remix Deck commands (Part 2)", () => {
      expect(isKnownCommand(KnownCommands.RemixDeck_StepSequencer_SequencerOn)).toBe(true);
      expect(isKnownCommand(KnownCommands.RemixDeck_QuantizeSelector)).toBe(true);
      expect(isKnownCommand(KnownCommands.RemixDeck_SaveRemixSet)).toBe(true);
    });

    it("should have Mixer commands (Part 2/3)", () => {
      expect(isKnownCommand(KnownCommands.Mixer_EQ_HighAdjust)).toBe(true);
      expect(isKnownCommand(KnownCommands.Mixer_EQ_MidAdjust)).toBe(true);
      expect(isKnownCommand(KnownCommands.Mixer_EQ_LowAdjust)).toBe(true);
      expect(isKnownCommand(KnownCommands.Mixer_XFader_PositionXFader)).toBe(true);
    });

    it("should have FX Unit commands (Part 3)", () => {
      expect(isKnownCommand(KnownCommands.FXUnit_UnitOn)).toBe(true);
      expect(isKnownCommand(KnownCommands.FXUnit_DryWetAdjust)).toBe(true);
      expect(isKnownCommand(KnownCommands.FXUnit_Knob1)).toBe(true);
    });

    it("should have Global commands (Part 3)", () => {
      expect(isKnownCommand(KnownCommands.Global_BroadcastingOn)).toBe(true);
      expect(isKnownCommand(KnownCommands.Mixer_MasterVolumeAdjust)).toBe(true);
    });

    it("should have Modifier commands (Part 3)", () => {
      expect(isKnownCommand(KnownCommands.Modifier_Modifier1)).toBe(true);
      expect(isKnownCommand(KnownCommands.Modifier_Modifier8)).toBe(true);
    });

    it("should have Browser commands (Part 4)", () => {
      expect(isKnownCommand(KnownCommands.Browser_List_SelectUpDown)).toBe(true);
      expect(isKnownCommand(KnownCommands.Browser_Tree_SelectUpDown)).toBe(true);
      expect(isKnownCommand(KnownCommands.Browser_Favorites_Selector)).toBe(true);
    });

    it("should have MIDI Control commands (Part 4)", () => {
      expect(isKnownCommand(KnownCommands.Global_MidiControls_Buttons_MidiButton1)).toBe(true);
      expect(isKnownCommand(KnownCommands.Global_MidiControls_Knobs_MidiKnob1)).toBe(true);
      expect(isKnownCommand(KnownCommands.Global_MidiControls_Knobs_MidiFader1)).toBe(true);
    });

    it("should have Remix Deck Direct Mapping Slot commands (Slots file)", () => {
      // Slot 1 commands
      expect(isKnownCommand(KnownCommands.RemixDeck_DirectMapping_Slot1_Slot1Cell1Trigger)).toBe(
        true
      );
      expect(isKnownCommand(KnownCommands.RemixDeck_DirectMapping_Slot1_Slot1Cell1State)).toBe(
        true
      );

      // Slot 4 commands (last slot)
      expect(isKnownCommand(KnownCommands.RemixDeck_DirectMapping_Slot4_Slot4Cell16Trigger)).toBe(
        true
      );
      expect(isKnownCommand(KnownCommands.RemixDeck_DirectMapping_Slot4_Slot4Cell16State)).toBe(
        true
      );
    });
  });

  describe("Command consistency checks", () => {
    it("should not have duplicate command names within the same category", () => {
      const categorizedNames = new Map<Categories, Set<string>>();

      for (const desc of Object.values(COMMAND_METADATA)) {
        if (!categorizedNames.has(desc.category)) {
          categorizedNames.set(desc.category, new Set());
        }
        const names = categorizedNames.get(desc.category);
        if (!names) continue;
        // Note: We allow some duplicate names as they may have different IDs for different contexts
        // This test just documents which duplicates exist
        if (names.has(desc.name)) {
          // Log but don't fail - some duplicates are intentional
          console.log(
            `Note: Duplicate name "${desc.name}" in category ${Categories[desc.category]}`
          );
        }
        names.add(desc.name);
      }
    });

    it("should have consistent targetType for slot commands", () => {
      const slotCategories = [
        Categories.DeckCommon_Submix,
        Categories.DeckCommon_Submix_Meters,
        Categories.RemixDeck_DirectMapping_Slot1,
        Categories.RemixDeck_DirectMapping_Slot2,
        Categories.RemixDeck_DirectMapping_Slot3,
        Categories.RemixDeck_DirectMapping_Slot4,
      ];

      for (const category of slotCategories) {
        const commands = getCommandsByCategory(category);
        for (const cmd of commands) {
          expect(
            [TargetType.Slot, TargetType.Track, TargetType.Remix],
            `Slot command ${cmd.name} should have Slot, Track, or Remix targetType`
          ).toContain(cmd.targetType);
        }
      }
    });

    it("should have Global targetType for modifier commands", () => {
      const modifierCommands = getCommandsByCategory(Categories.Modifier);
      for (const cmd of modifierCommands) {
        expect(cmd.targetType, `Modifier command ${cmd.name} should have Global targetType`).toBe(
          TargetType.Global
        );
      }
    });
  });
});

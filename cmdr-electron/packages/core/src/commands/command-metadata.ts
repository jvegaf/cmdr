/**
 * Command Metadata - Maps command IDs to their descriptions
 *
 * AIDEV-NOTE: This is the central registry of all Traktor commands.
 * Each entry maps a KnownCommands enum value to its CommandDescriptionInput.
 * This file contains the complete metadata for all ~300 commands.
 *
 * The metadata is split into multiple files for maintainability:
 * - command-metadata.ts (this file): Deck Common commands + merge all parts
 * - command-metadata-part2.ts: Track Deck, Remix Deck, Mixer EQ/XFader
 * - command-metadata-part3.ts: Mixer main/meters, FX Unit, Global, Layout, Modifier, etc.
 * - command-metadata-part4.ts: Browser (List, Tree, Favorites), MIDI Controls
 * - command-metadata-slots.ts: Remix Deck Direct Mapping Slots (128 commands)
 *
 * Values MUST match the C# CommandDescriptionAttribute exactly.
 *
 * @see cmdr/cmdr.TsiLib/Commands/Interpretation/KnownCommands.cs
 */

import { Categories } from "./categories";
import type { CommandDescription, CommandDescriptionInput } from "./command-description";
import { COMMAND_METADATA_PART2 } from "./command-metadata-part2";
import { COMMAND_METADATA_PART3 } from "./command-metadata-part3";
import { COMMAND_METADATA_PART4 } from "./command-metadata-part4";
import { COMMAND_METADATA_SLOTS } from "./command-metadata-slots";
import { CommandInType, CommandOutType, FloatRangeType } from "./command-types";
import { KnownCommands } from "./known-commands";
import { TargetType } from "./target-type";

/**
 * Part 1: Deck Common commands (Loop, Move, Freeze Mode, Timecode, Submix, Main)
 */
const COMMAND_METADATA_PART1: Record<number, CommandDescriptionInput> = {
  // ===========================================================================
  // DECK COMMON - LOOP
  // ===========================================================================
  [KnownCommands.DeckCommon_Loop_LoopInSetCue]: {
    name: "Loop In/Set Cue",
    category: Categories.DeckCommon_Loop,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Trigger,
    outCommandType: CommandOutType.Trigger,
  },
  [KnownCommands.DeckCommon_Loop_LoopOut]: {
    name: "Loop Out",
    category: Categories.DeckCommon_Loop,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Trigger,
    outCommandType: CommandOutType.Trigger,
  },
  [KnownCommands.DeckCommon_Loop_LoopSizeSelector]: {
    name: "Loop Size Selector",
    category: Categories.DeckCommon_Loop,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Enum,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "LoopSize",
  },
  [KnownCommands.DeckCommon_Loop_LoopSet]: {
    name: "Loop Set",
    category: Categories.DeckCommon_Loop,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Hold,
    outCommandType: CommandOutType.Trigger,
  },
  [KnownCommands.DeckCommon_Loop_LoopSizeSelectSet]: {
    name: "Loop Size Select + Set",
    category: Categories.DeckCommon_Loop,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Enum,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "LoopSize",
  },
  [KnownCommands.DeckCommon_Loop_BackwardLoopSizeSelectSet]: {
    name: "Backward Loop Size Select + Set",
    category: Categories.DeckCommon_Loop,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Enum,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "LoopSize",
  },
  [KnownCommands.DeckCommon_Loop_LoopActiveOn]: {
    name: "Loop Active On",
    category: Categories.DeckCommon_Loop,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },

  // ===========================================================================
  // DECK COMMON - MOVE
  // ===========================================================================
  [KnownCommands.DeckCommon_Move_SizeSelectorCueLoop]: {
    name: "Size Selector (Deck Common Move)",
    category: Categories.DeckCommon_Move,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Enum,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "CuePointOrLoopMoveSize",
  },
  [KnownCommands.DeckCommon_Move_ModeSelector]: {
    name: "Mode Selector (Deck Common Move)",
    category: Categories.DeckCommon_Move,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Enum,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "MoveMode",
  },
  [KnownCommands.DeckCommon_Move_Move]: {
    name: "Move",
    category: Categories.DeckCommon_Move,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Enum,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "MoveDirection",
  },
  [KnownCommands.DeckCommon_Move_Beatjump]: {
    name: "Beatjump",
    category: Categories.DeckCommon_Move,
    targetType: TargetType.Track,
    inCommandType: CommandInType.HoldEnum,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "MoveSize",
  },

  // ===========================================================================
  // DECK COMMON - FREEZE MODE
  // ===========================================================================
  [KnownCommands.DeckCommon_FreezeMode_FreezeModeOn]: {
    name: "Freeze Mode On",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_FreezeMode_FreezeSliceSizeAdjust]: {
    name: "Freeze Slice Size Adjust",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Enum,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "FreezeSliceSize",
  },
  [KnownCommands.DeckCommon_FreezeMode_FreezeSliceCountAdjust]: {
    name: "Freeze Slice Count Adjust",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Enum,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "FreezeSliceCount",
  },
  // Freeze Mode Slice Triggers (1-16)
  [KnownCommands.DeckCommon_FreezeMode_SliceTrigger1]: {
    name: "Slice Trigger 1 (Freeze Mode)",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_FreezeMode_SliceTrigger2]: {
    name: "Slice Trigger 2 (Freeze Mode)",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_FreezeMode_SliceTrigger3]: {
    name: "Slice Trigger 3 (Freeze Mode)",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_FreezeMode_SliceTrigger4]: {
    name: "Slice Trigger 4 (Freeze Mode)",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_FreezeMode_SliceTrigger5]: {
    name: "Slice Trigger 5 (Freeze Mode)",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_FreezeMode_SliceTrigger6]: {
    name: "Slice Trigger 6 (Freeze Mode)",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_FreezeMode_SliceTrigger7]: {
    name: "Slice Trigger 7 (Freeze Mode)",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_FreezeMode_SliceTrigger8]: {
    name: "Slice Trigger 8 (Freeze Mode)",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_FreezeMode_SliceTrigger9]: {
    name: "Slice Trigger 9 (Freeze Mode)",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_FreezeMode_SliceTrigger10]: {
    name: "Slice Trigger 10 (Freeze Mode)",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_FreezeMode_SliceTrigger11]: {
    name: "Slice Trigger 11 (Freeze Mode)",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_FreezeMode_SliceTrigger12]: {
    name: "Slice Trigger 12 (Freeze Mode)",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_FreezeMode_SliceTrigger13]: {
    name: "Slice Trigger 13 (Freeze Mode)",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_FreezeMode_SliceTrigger14]: {
    name: "Slice Trigger 14 (Freeze Mode)",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_FreezeMode_SliceTrigger15]: {
    name: "Slice Trigger 15 (Freeze Mode)",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_FreezeMode_SliceTrigger16]: {
    name: "Slice Trigger 16 (Freeze Mode)",
    category: Categories.DeckCommon_FreezeMode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },

  // ===========================================================================
  // DECK COMMON - TIMECODE
  // ===========================================================================
  [KnownCommands.DeckCommon_Timecode_ScratchControlOn]: {
    name: "Scratch Control On",
    category: Categories.DeckCommon_Timecode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Enum,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "ScratchControl",
  },
  [KnownCommands.DeckCommon_Timecode_PlaybackModeIntRelAbs]: {
    name: "Playback Mode Int/Rel/Abs",
    category: Categories.DeckCommon_Timecode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Enum,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "PlaybackMode",
  },
  [KnownCommands.DeckCommon_Timecode_PlatterScopeViewSelector]: {
    name: "Platter/Scope View Selector",
    category: Categories.DeckCommon_Timecode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Enum,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "PlatterScopeView",
  },
  [KnownCommands.DeckCommon_Timecode_Calibrate]: {
    name: "Calibrate",
    category: Categories.DeckCommon_Timecode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Trigger,
    outCommandType: CommandOutType.Trigger,
  },
  [KnownCommands.DeckCommon_Timecode_ResetTempoOffset]: {
    name: "Reset Tempo Offset",
    category: Categories.DeckCommon_Timecode,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Trigger,
    outCommandType: CommandOutType.Trigger,
  },

  // ===========================================================================
  // DECK COMMON - SUBMIX
  // ===========================================================================
  [KnownCommands.RemixDeck_SlotVolumeAdjust]: {
    name: "Slot Volume Adjust (Submix)",
    category: Categories.DeckCommon_Submix,
    targetType: TargetType.Slot,
    inCommandType: CommandInType.Float,
    outCommandType: CommandOutType.Float,
    floatRangeType: FloatRangeType.Relative,
  },
  [KnownCommands.RemixDeck_SlotFilterOn]: {
    name: "Slot Filter On (Submix)",
    category: Categories.DeckCommon_Submix,
    targetType: TargetType.Slot,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.RemixDeck_SlotFilterAdjust]: {
    name: "Slot Filter Adjust (Submix)",
    category: Categories.DeckCommon_Submix,
    targetType: TargetType.Slot,
    inCommandType: CommandInType.Float,
    outCommandType: CommandOutType.Float,
    floatRangeType: FloatRangeType.Centered,
  },
  [KnownCommands.RemixDeck_SlotMuteOn]: {
    name: "Slot Mute On (Submix)",
    category: Categories.DeckCommon_Submix,
    targetType: TargetType.Slot,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_Submix_SlotFXOn]: {
    name: "Slot FX On (Submix)",
    category: Categories.DeckCommon_Submix,
    targetType: TargetType.Slot,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_Submix_SlotFXAmount]: {
    name: "Slot FX Amount (Submix)",
    category: Categories.DeckCommon_Submix,
    targetType: TargetType.Slot,
    inCommandType: CommandInType.Float,
    outCommandType: CommandOutType.Float,
    floatRangeType: FloatRangeType.Relative,
  },

  // ===========================================================================
  // DECK COMMON - SUBMIX METERS
  // ===========================================================================
  [KnownCommands.DeckCommon_Submix_Meters_SlotPreFaderLevelL]: {
    name: "Slot Pre-Fader Level (L)",
    category: Categories.DeckCommon_Submix_Meters,
    targetType: TargetType.Slot,
    inCommandType: CommandInType.None,
    outCommandType: CommandOutType.Float,
    floatRangeType: FloatRangeType.Relative,
  },
  [KnownCommands.DeckCommon_Submix_Meters_SlotPreFaderLevelR]: {
    name: "Slot Pre-Fader Level (R)",
    category: Categories.DeckCommon_Submix_Meters,
    targetType: TargetType.Slot,
    inCommandType: CommandInType.None,
    outCommandType: CommandOutType.Float,
    floatRangeType: FloatRangeType.Relative,
  },
  [KnownCommands.DeckCommon_Submix_Meters_SlotPreFaderLevelLR]: {
    name: "Slot Pre-Fader Level (L+R)",
    category: Categories.DeckCommon_Submix_Meters,
    targetType: TargetType.Slot,
    inCommandType: CommandInType.None,
    outCommandType: CommandOutType.Float,
    floatRangeType: FloatRangeType.Relative,
  },

  // ===========================================================================
  // DECK COMMON - MAIN
  // ===========================================================================
  [KnownCommands.DeckCommon_LoadNext]: {
    name: "Load Next",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Trigger,
    outCommandType: CommandOutType.Trigger,
  },
  [KnownCommands.DeckCommon_LoadPrevious]: {
    name: "Load Previous",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Trigger,
    outCommandType: CommandOutType.Trigger,
  },
  [KnownCommands.DeckCommon_LoadSelected]: {
    name: "Load Selected (Deck Common)",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Trigger,
    outCommandType: CommandOutType.Trigger,
  },
  [KnownCommands.DeckCommon_Unload]: {
    name: "Unload (Deck Common)",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Trigger,
    outCommandType: CommandOutType.Trigger,
  },
  [KnownCommands.DeckCommon_PlayPause]: {
    name: "Play/Pause (Deck Common)",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_Cue]: {
    name: "Cue",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_CupCuePlay]: {
    name: "CUP (Cue Play)",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_SeekPosition]: {
    name: "Seek Position (Deck Common)",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Float,
    outCommandType: CommandOutType.Float,
    floatRangeType: FloatRangeType.Relative,
  },
  [KnownCommands.DeckCommon_JogTouchOn]: {
    name: "Jog Touch On",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_JogTurn]: {
    name: "Jog Turn",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Float,
    outCommandType: CommandOutType.Float,
    floatRangeType: FloatRangeType.Centered,
  },
  [KnownCommands.DeckCommon_Scratch]: {
    name: "Scratch (dug)",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Float,
    outCommandType: CommandOutType.Float,
    floatRangeType: FloatRangeType.Centered,
  },
  [KnownCommands.DeckCommon_SetAsTempoMaster]: {
    name: "Set As Tempo Master",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Trigger,
    outCommandType: CommandOutType.Trigger,
  },
  [KnownCommands.DeckCommon_SyncOn]: {
    name: "Sync On",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_PhaseSync]: {
    name: "Phase Sync",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Trigger,
    outCommandType: CommandOutType.Trigger,
  },
  [KnownCommands.DeckCommon_TempoSync]: {
    name: "Tempo Sync",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Trigger,
    outCommandType: CommandOutType.Trigger,
  },
  [KnownCommands.DeckCommon_TempoBend]: {
    name: "Tempo Bend",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.HoldEnum,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "UpDown",
  },
  [KnownCommands.DeckCommon_TempoBendStepless]: {
    name: "Tempo Bend (stepless)",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Float,
    outCommandType: CommandOutType.Float,
    floatRangeType: FloatRangeType.Centered,
  },
  [KnownCommands.DeckCommon_TempoAdjust]: {
    name: "Tempo Adjust",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Float,
    outCommandType: CommandOutType.Float,
    floatRangeType: FloatRangeType.Centered,
  },
  [KnownCommands.DeckCommon_TempoRangeSelector]: {
    name: "Tempo Range Selector",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Enum,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "TempoRange",
  },
  [KnownCommands.DeckCommon_AnalyzeLoadedTrack]: {
    name: "Analyze Loaded Track",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Trigger,
    outCommandType: CommandOutType.Trigger,
  },
  [KnownCommands.DeckCommon_DeckFlavorSelector]: {
    name: "Deck Flavor Selector",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Enum,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "DeckFlavor",
  },
  [KnownCommands.DeckCommon_DeckSizeSelector]: {
    name: "Deck Size Selector",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Enum,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "DeckSize",
  },
  [KnownCommands.DeckCommon_AdvancedPanelToggle]: {
    name: "Advanced Panel Toggle",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_AdvancedPanelTabSelector]: {
    name: "Advanced Panel Tab Selector",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.Enum,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "AdvancedPanelTab",
  },
  [KnownCommands.DeckCommon_FluxModeOn]: {
    name: "Flux Mode On",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_FluxState]: {
    name: "Flux State",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.None,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "FluxState",
  },
  [KnownCommands.DeckCommon_FluxReversePlaybackOn]: {
    name: "Flux Reverse Playback On",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_ReversePlaybackOn]: {
    name: "Reverse Playback On",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.OnOff,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_Phase]: {
    name: "Phase",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.None,
    outCommandType: CommandOutType.Float,
    floatRangeType: FloatRangeType.CenteredHalf,
  },
  [KnownCommands.DeckCommon_BeatPhase]: {
    name: "Beat Phase",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.None,
    outCommandType: CommandOutType.Float,
    floatRangeType: FloatRangeType.CenteredHalf,
  },
  [KnownCommands.DeckCommon_DeckIsLoaded]: {
    name: "Deck Is Loaded",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.None,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
  [KnownCommands.DeckCommon_IsInActiveLoop]: {
    name: "Is In Active Loop",
    category: Categories.DeckCommon,
    targetType: TargetType.Track,
    inCommandType: CommandInType.None,
    outCommandType: CommandOutType.Enum,
    valueEnumType: "OnOff",
  },
};

/**
 * Complete metadata map for all known Traktor commands.
 * Key is the command ID (from KnownCommands enum).
 *
 * AIDEV-NOTE: This merges all metadata parts into a single lookup table.
 * Total: ~300 commands covering all Traktor Pro functionality.
 */
export const COMMAND_METADATA: Record<number, CommandDescriptionInput> = {
  ...COMMAND_METADATA_PART1,
  ...COMMAND_METADATA_PART2,
  ...COMMAND_METADATA_PART3,
  ...COMMAND_METADATA_PART4,
  ...COMMAND_METADATA_SLOTS,
};

/**
 * Get command description by ID.
 * Returns undefined for unknown command IDs.
 */
export function getCommandDescription(id: number): CommandDescription | undefined {
  const input = COMMAND_METADATA[id];
  if (!input) {
    return undefined;
  }
  return {
    id,
    ...input,
  };
}

/**
 * Get command description by ID, with fallback for unknown commands.
 * Always returns a CommandDescription, using Unknown category for unrecognized IDs.
 */
export function getCommandDescriptionOrUnknown(id: number): CommandDescription {
  const description = getCommandDescription(id);
  if (description) {
    return description;
  }
  // Return unknown command description
  return {
    id,
    name: `Unknown Command ${id}`,
    category: Categories.Unknown,
    targetType: TargetType.Global,
    inCommandType: CommandInType.Unknown,
    outCommandType: CommandOutType.Unknown,
  };
}

/**
 * Check if a command ID is known (has metadata)
 */
export function isKnownCommand(id: number): boolean {
  return id in COMMAND_METADATA;
}

/**
 * Get all command IDs that have metadata
 */
export function getAllKnownCommandIds(): number[] {
  return Object.keys(COMMAND_METADATA).map(Number);
}

/**
 * Get all commands for a specific category
 */
export function getCommandsByCategory(category: Categories): CommandDescription[] {
  return Object.entries(COMMAND_METADATA)
    .filter(([, desc]) => desc.category === category)
    .map(([id, desc]) => ({ id: Number(id), ...desc }));
}

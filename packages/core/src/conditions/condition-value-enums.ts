/**
 * Condition Value Enums - All enums used as condition values in Traktor TSI files
 *
 * AIDEV-NOTE: These enums represent the possible values for each condition type.
 * They are derived from the C# enums in cmdr.TsiLib.Enums namespace.
 * Each condition is associated with one of these value types.
 *
 * @see cmdr/cmdr.TsiLib/Enums/
 */

// ============================================================================
// Basic On/Off enum (used by many conditions)
// ============================================================================

/**
 * On/Off toggle value
 * Used by: Play/Pause, Is In Active Loop, Scratch Control On
 */
export enum OnOff {
  Off = 0,
  On = 1,
}

export const ON_OFF_DESCRIPTIONS: Record<OnOff, string> = {
  [OnOff.Off]: "Off",
  [OnOff.On]: "On",
};

// ============================================================================
// Tempo Range enum
// ============================================================================

/**
 * Tempo range percentage values
 * Used by: DeckCommon_TempoRange condition
 */
export enum TempoRange {
  Percent_2 = 0,
  Percent_4 = 1,
  Percent_6 = 2,
  Percent_8 = 3,
  Percent_10 = 4,
  Percent_12 = 5,
  Percent_14 = 6,
  Percent_16 = 7,
  Percent_18 = 8,
  Percent_20 = 9,
  Percent_25 = 10,
  Percent_35 = 11,
  Percent_50 = 12,
  Percent_100 = 13,
}

export const TEMPO_RANGE_DESCRIPTIONS: Record<TempoRange, string> = {
  [TempoRange.Percent_2]: "2%",
  [TempoRange.Percent_4]: "4%",
  [TempoRange.Percent_6]: "6%",
  [TempoRange.Percent_8]: "8%",
  [TempoRange.Percent_10]: "10%",
  [TempoRange.Percent_12]: "12%",
  [TempoRange.Percent_14]: "14%",
  [TempoRange.Percent_16]: "16%",
  [TempoRange.Percent_18]: "18%",
  [TempoRange.Percent_20]: "20%",
  [TempoRange.Percent_25]: "25%",
  [TempoRange.Percent_35]: "35%",
  [TempoRange.Percent_50]: "50%",
  [TempoRange.Percent_100]: "100%",
};

// ============================================================================
// Slot State enum (Remix Deck slot state)
// ============================================================================

/**
 * State of a slot in a Remix Deck
 * Used by: RemixDeck_SlotState condition
 */
export enum SlotState {
  Empty = 0,
  Paused = 1,
  Playing = 2,
}

export const SLOT_STATE_DESCRIPTIONS: Record<SlotState, string> = {
  [SlotState.Empty]: "Empty",
  [SlotState.Paused]: "Paused",
  [SlotState.Playing]: "Playing",
};

// ============================================================================
// Play Mode enum
// ============================================================================

/**
 * Playback mode for slots
 * Used by: RemixDeck_SlotPlayMode condition
 */
export enum PlayMode {
  OneShot = 0,
  Looped = 1,
}

export const PLAY_MODE_DESCRIPTIONS: Record<PlayMode, string> = {
  [PlayMode.OneShot]: "One Shot",
  [PlayMode.Looped]: "Looped",
};

// ============================================================================
// Slot Cell State enum
// ============================================================================

/**
 * State of a cell in a Remix Deck slot
 * Used by: All 64 Slot Cell State conditions (IDs 665-728)
 */
export enum SlotCellState {
  Empty = 0,
  Loaded = 1,
  Playing = 2,
  Waiting = 3,
}

export const SLOT_CELL_STATE_DESCRIPTIONS: Record<SlotCellState, string> = {
  [SlotCellState.Empty]: "Empty",
  [SlotCellState.Loaded]: "Loaded",
  [SlotCellState.Playing]: "Playing",
  [SlotCellState.Waiting]: "Waiting",
};

// ============================================================================
// Sample Page enum
// ============================================================================

/**
 * Sample page in Remix Deck
 * Used by: RemixDeck_SamplePageSelector condition
 */
export enum SamplePage {
  Page1 = 0,
  Page2 = 1,
  Page3 = 2,
  Page4 = 3,
}

export const SAMPLE_PAGE_DESCRIPTIONS: Record<SamplePage, string> = {
  [SamplePage.Page1]: "Page 1",
  [SamplePage.Page2]: "Page 2",
  [SamplePage.Page3]: "Page 3",
  [SamplePage.Page4]: "Page 4",
};

// ============================================================================
// Sample enum (Step Sequencer)
// ============================================================================

/**
 * Sample/step number in Step Sequencer
 * Used by: RemixDeck_StepSequencer_CurrentStep condition
 */
export enum Sample {
  Sample_1 = 0,
  Sample_2 = 1,
  Sample_3 = 2,
  Sample_4 = 3,
  Sample_5 = 4,
  Sample_6 = 5,
  Sample_7 = 6,
  Sample_8 = 7,
  Sample_9 = 8,
  Sample_10 = 9,
  Sample_11 = 10,
  Sample_12 = 11,
  Sample_13 = 12,
  Sample_14 = 13,
  Sample_15 = 14,
  Sample_16 = 15,
}

export const SAMPLE_DESCRIPTIONS: Record<Sample, string> = {
  [Sample.Sample_1]: "1",
  [Sample.Sample_2]: "2",
  [Sample.Sample_3]: "3",
  [Sample.Sample_4]: "4",
  [Sample.Sample_5]: "5",
  [Sample.Sample_6]: "6",
  [Sample.Sample_7]: "7",
  [Sample.Sample_8]: "8",
  [Sample.Sample_9]: "9",
  [Sample.Sample_10]: "10",
  [Sample.Sample_11]: "11",
  [Sample.Sample_12]: "12",
  [Sample.Sample_13]: "13",
  [Sample.Sample_14]: "14",
  [Sample.Sample_15]: "15",
  [Sample.Sample_16]: "16",
};

// ============================================================================
// Capture Source enum
// ============================================================================

/**
 * Source for capturing in Remix Deck
 * Used by: RemixDeck_CaptureSource condition
 */
export enum CaptureSource {
  DeckA = 0,
  DeckB = 1,
  DeckC = 2,
  DeckD = 3,
  LoopRecorder = 4,
}

export const CAPTURE_SOURCE_DESCRIPTIONS: Record<CaptureSource, string> = {
  [CaptureSource.DeckA]: "Deck A",
  [CaptureSource.DeckB]: "Deck B",
  [CaptureSource.DeckC]: "Deck C",
  [CaptureSource.DeckD]: "Deck D",
  [CaptureSource.LoopRecorder]: "Loop Recorder",
};

// ============================================================================
// Slot Trigger Type enum
// ============================================================================

/**
 * Trigger type for slots
 * Used by: RemixDeck_SlotTriggerType condition
 */
export enum SlotTriggerType {
  Latched = 0,
  Gated = 1,
}

export const SLOT_TRIGGER_TYPE_DESCRIPTIONS: Record<SlotTriggerType, string> = {
  [SlotTriggerType.Latched]: "Latched",
  [SlotTriggerType.Gated]: "Gated",
};

// ============================================================================
// FX Unit Mode enum
// ============================================================================

/**
 * FX Unit mode (Group or Single effect)
 * Used by: FXUnit_FXUnitMode condition
 */
export enum FXUnitMode {
  Group = 0,
  Single = 1,
}

export const FX_UNIT_MODE_DESCRIPTIONS: Record<FXUnitMode, string> = {
  [FXUnitMode.Group]: "Group",
  [FXUnitMode.Single]: "Single",
};

// ============================================================================
// Deck Flavor enum
// ============================================================================

/**
 * Type of deck
 * Used by: DeckCommon_DeckFlavor condition
 */
export enum DeckFlavor {
  TrackDeck = 0,
  RemixDeck = 1,
  StemDeck = 2,
  LiveInput = 3,
}

export const DECK_FLAVOR_DESCRIPTIONS: Record<DeckFlavor, string> = {
  [DeckFlavor.TrackDeck]: "Track Deck",
  [DeckFlavor.RemixDeck]: "Remix Deck",
  [DeckFlavor.StemDeck]: "Stem Deck",
  [DeckFlavor.LiveInput]: "Live Input",
};

// ============================================================================
// Hotcue Type enum
// ============================================================================

/**
 * Type of hotcue
 * Used by: TrackDeck_Cue_Hotcue1Type through TrackDeck_Cue_Hotcue8Type conditions
 */
export enum HotcueType {
  None = -1,
  Cue = 0,
  FadeIn = 1,
  FadeOut = 2,
  Load = 3,
  Grid = 4,
  Loop = 5,
}

export const HOTCUE_TYPE_DESCRIPTIONS: Record<HotcueType, string> = {
  [HotcueType.None]: "None",
  [HotcueType.Cue]: "Cue",
  [HotcueType.FadeIn]: "Fade-In",
  [HotcueType.FadeOut]: "Fade-Out",
  [HotcueType.Load]: "Load",
  [HotcueType.Grid]: "Grid",
  [HotcueType.Loop]: "Loop",
};

// ============================================================================
// Cue/Loop Move Mode enum
// ============================================================================

/**
 * Cue/Loop move mode
 * Used by: TrackDeck_Cue_LoopMoveMode condition
 */
export enum CueLoopMoveMode {
  Beatjump = 0,
  Loop = 1,
  LoopIn = 2,
  LoopOut = 3,
}

export const CUE_LOOP_MOVE_MODE_DESCRIPTIONS: Record<CueLoopMoveMode, string> = {
  [CueLoopMoveMode.Beatjump]: "Beatjump",
  [CueLoopMoveMode.Loop]: "Loop",
  [CueLoopMoveMode.LoopIn]: "Loop In",
  [CueLoopMoveMode.LoopOut]: "Loop Out",
};

// ============================================================================
// Modifier Value enum
// ============================================================================

/**
 * Value for modifier conditions (0-7)
 * Used by: Modifier_Modifier1 through Modifier_Modifier8 conditions
 */
export enum ModifierValue {
  Value_0 = 0,
  Value_1 = 1,
  Value_2 = 2,
  Value_3 = 3,
  Value_4 = 4,
  Value_5 = 5,
  Value_6 = 6,
  Value_7 = 7,
}

export const MODIFIER_VALUE_DESCRIPTIONS: Record<ModifierValue, string> = {
  [ModifierValue.Value_0]: "0",
  [ModifierValue.Value_1]: "1",
  [ModifierValue.Value_2]: "2",
  [ModifierValue.Value_3]: "3",
  [ModifierValue.Value_4]: "4",
  [ModifierValue.Value_5]: "5",
  [ModifierValue.Value_6]: "6",
  [ModifierValue.Value_7]: "7",
};

// ============================================================================
// Condition Value Enum Type identifier
// ============================================================================

/**
 * String identifiers for condition value enum types.
 * Used in ConditionDescription to reference which enum type a condition uses.
 */
export type ConditionValueEnumType =
  | "OnOff"
  | "TempoRange"
  | "SlotState"
  | "PlayMode"
  | "SlotCellState"
  | "SamplePage"
  | "Sample"
  | "CaptureSource"
  | "SlotTriggerType"
  | "FXUnitMode"
  | "DeckFlavor"
  | "HotcueType"
  | "CueLoopMoveMode"
  | "ModifierValue";

/**
 * Map of enum type names to their description lookup tables.
 * Useful for getting human-readable values at runtime.
 */
export const CONDITION_VALUE_DESCRIPTIONS: Record<
  ConditionValueEnumType,
  Record<number, string>
> = {
  OnOff: ON_OFF_DESCRIPTIONS,
  TempoRange: TEMPO_RANGE_DESCRIPTIONS,
  SlotState: SLOT_STATE_DESCRIPTIONS,
  PlayMode: PLAY_MODE_DESCRIPTIONS,
  SlotCellState: SLOT_CELL_STATE_DESCRIPTIONS,
  SamplePage: SAMPLE_PAGE_DESCRIPTIONS,
  Sample: SAMPLE_DESCRIPTIONS,
  CaptureSource: CAPTURE_SOURCE_DESCRIPTIONS,
  SlotTriggerType: SLOT_TRIGGER_TYPE_DESCRIPTIONS,
  FXUnitMode: FX_UNIT_MODE_DESCRIPTIONS,
  DeckFlavor: DECK_FLAVOR_DESCRIPTIONS,
  HotcueType: HOTCUE_TYPE_DESCRIPTIONS,
  CueLoopMoveMode: CUE_LOOP_MOVE_MODE_DESCRIPTIONS,
  ModifierValue: MODIFIER_VALUE_DESCRIPTIONS,
};

/**
 * Get a human-readable description for a condition value.
 *
 * @param enumType - The type of enum (e.g., "OnOff", "ModifierValue")
 * @param value - The numeric value
 * @returns Human-readable description or "Unknown" if not found
 */
export function getConditionValueDescription(
  enumType: ConditionValueEnumType,
  value: number,
): string {
  const descriptions = CONDITION_VALUE_DESCRIPTIONS[enumType];
  return descriptions?.[value] ?? `Unknown (${value})`;
}

/**
 * Categories - Command categories for organizing Traktor commands
 *
 * AIDEV-NOTE: This enum matches the C# enum from cmdr.TsiLib.Categories.
 * Categories are hierarchical and use underscores to represent the hierarchy
 * (e.g., DeckCommon_Loop = "Deck Common->Loop").
 *
 * @see cmdr/cmdr.TsiLib/Categories.cs
 */

/**
 * Command categories for organizing and displaying Traktor commands.
 * Categories follow a hierarchical structure using underscores as separators.
 */
export enum Categories {
  /** Unknown/unrecognized category */
  Unknown = 0,

  /** Root level - special category for global entries */
  Root = 1,

  // ===== Global =====
  /** Global commands */
  Global = 2,
  /** Global->MIDI Controls */
  Global_MidiControls = 3,
  /** Global->MIDI Controls->Buttons */
  Global_MidiControls_Buttons = 4,
  /** Global->MIDI Controls->Knobs */
  Global_MidiControls_Knobs = 5,
  /** Global->MIDI Controls->Faders */
  Global_MidiControls_Faders = 6,

  // ===== Mixer =====
  /** Mixer commands */
  Mixer = 7,
  /** Mixer->X-Fader */
  Mixer_XFader = 8,
  /** Mixer->EQ */
  Mixer_EQ = 9,
  /** Mixer->Meters */
  Mixer_Meters = 10,

  // ===== Layout =====
  /** Layout commands */
  Layout = 11,

  // ===== Deck Common =====
  /** Deck Common commands */
  DeckCommon = 12,
  /** Deck Common->Loop */
  DeckCommon_Loop = 13,
  /** Deck Common->Move */
  DeckCommon_Move = 14,
  /** Deck Common->Freeze Mode */
  DeckCommon_FreezeMode = 15,
  /** Deck Common->Timecode */
  DeckCommon_Timecode = 16,
  /** Deck Common->Submix */
  DeckCommon_Submix = 17,
  /** Deck Common->Submix->Meters */
  DeckCommon_Submix_Meters = 18,

  // ===== Audio Recorder =====
  /** Audio Recorder commands */
  AudioRecorder = 19,

  // ===== Master Clock =====
  /** Master Clock commands */
  MasterClock = 20,
  /** Master Clock->Ableton Link */
  MasterClock_AbletonLink = 21,

  // ===== Preview Player =====
  /** Preview Player commands */
  PreviewPlayer = 22,

  // ===== Track Deck =====
  /** Track Deck commands */
  TrackDeck = 23,
  /** Track Deck->Cue */
  TrackDeck_Cue = 24,
  /** Track Deck->Grid */
  TrackDeck_Grid = 25,

  // ===== Remix Deck =====
  /** Remix Deck commands */
  RemixDeck = 26,
  /** Remix Deck->Legacy */
  RemixDeck_Legacy = 27,
  /** Remix Deck->Direct Mapping */
  RemixDeck_DirectMapping = 28,
  /** Remix Deck->Direct Mapping->Slot1 */
  RemixDeck_DirectMapping_Slot1 = 29,
  /** Remix Deck->Direct Mapping->Slot2 */
  RemixDeck_DirectMapping_Slot2 = 30,
  /** Remix Deck->Direct Mapping->Slot3 */
  RemixDeck_DirectMapping_Slot3 = 31,
  /** Remix Deck->Direct Mapping->Slot4 */
  RemixDeck_DirectMapping_Slot4 = 32,
  /** Remix Deck->Step Sequencer */
  RemixDeck_StepSequencer = 33,

  // ===== Loop Recorder =====
  /** Loop Recorder commands */
  LoopRecorder = 34,

  // ===== FX Unit =====
  /** FX Unit commands */
  FXUnit = 35,

  // ===== Modifier =====
  /** Modifier commands */
  Modifier = 36,

  // ===== Browser =====
  /** Browser commands */
  Browser = 37,
  /** Browser->Tree */
  Browser_Tree = 38,
  /** Browser->List */
  Browser_List = 39,
  /** Browser->Favorites */
  Browser_Favorites = 40,
}

/**
 * Human-readable descriptions for each category (matching C# [Description] attributes)
 */
export const CATEGORY_DESCRIPTIONS: Record<Categories, string> = {
  [Categories.Unknown]: "Unknown",
  [Categories.Root]: "Root",
  [Categories.Global]: "Global",
  [Categories.Global_MidiControls]: "Global->MIDI Controls",
  [Categories.Global_MidiControls_Buttons]: "Global->MIDI Controls->Buttons",
  [Categories.Global_MidiControls_Knobs]: "Global->MIDI Controls->Knobs",
  [Categories.Global_MidiControls_Faders]: "Global->MIDI Controls->Faders",
  [Categories.Mixer]: "Mixer",
  [Categories.Mixer_XFader]: "Mixer->X-Fader",
  [Categories.Mixer_EQ]: "Mixer->EQ",
  [Categories.Mixer_Meters]: "Mixer->Meters",
  [Categories.Layout]: "Layout",
  [Categories.DeckCommon]: "Deck Common",
  [Categories.DeckCommon_Loop]: "Deck Common->Loop",
  [Categories.DeckCommon_Move]: "Deck Common->Move",
  [Categories.DeckCommon_FreezeMode]: "Deck Common->Freeze Mode",
  [Categories.DeckCommon_Timecode]: "Deck Common->Timecode",
  [Categories.DeckCommon_Submix]: "Deck Common->Submix",
  [Categories.DeckCommon_Submix_Meters]: "Deck Common->Submix->Meters",
  [Categories.AudioRecorder]: "Audio Recorder",
  [Categories.MasterClock]: "Master Clock",
  [Categories.MasterClock_AbletonLink]: "Master Clock->Ableton Link",
  [Categories.PreviewPlayer]: "Preview Player",
  [Categories.TrackDeck]: "Track Deck",
  [Categories.TrackDeck_Cue]: "Track Deck->Cue",
  [Categories.TrackDeck_Grid]: "Track Deck->Grid",
  [Categories.RemixDeck]: "Remix Deck",
  [Categories.RemixDeck_Legacy]: "Remix Deck->Legacy",
  [Categories.RemixDeck_DirectMapping]: "Remix Deck->Direct Mapping",
  [Categories.RemixDeck_DirectMapping_Slot1]: "Remix Deck->Direct Mapping->Slot1",
  [Categories.RemixDeck_DirectMapping_Slot2]: "Remix Deck->Direct Mapping->Slot2",
  [Categories.RemixDeck_DirectMapping_Slot3]: "Remix Deck->Direct Mapping->Slot3",
  [Categories.RemixDeck_DirectMapping_Slot4]: "Remix Deck->Direct Mapping->Slot4",
  [Categories.RemixDeck_StepSequencer]: "Remix Deck->Step Sequencer",
  [Categories.LoopRecorder]: "Loop Recorder",
  [Categories.FXUnit]: "FX Unit",
  [Categories.Modifier]: "Modifier",
  [Categories.Browser]: "Browser",
  [Categories.Browser_Tree]: "Browser->Tree",
  [Categories.Browser_List]: "Browser->List",
  [Categories.Browser_Favorites]: "Browser->Favorites",
};

/**
 * Get the human-readable description for a category
 */
export function getCategoryDescription(category: Categories): string {
  return CATEGORY_DESCRIPTIONS[category] ?? "Unknown";
}

/**
 * Get the parent category (if any) for a given category.
 * Returns undefined for top-level categories.
 */
export function getParentCategory(category: Categories): Categories | undefined {
  // Map subcategories to their parents
  const parentMap: Partial<Record<Categories, Categories>> = {
    // Global subcategories
    [Categories.Global_MidiControls]: Categories.Global,
    [Categories.Global_MidiControls_Buttons]: Categories.Global_MidiControls,
    [Categories.Global_MidiControls_Knobs]: Categories.Global_MidiControls,
    [Categories.Global_MidiControls_Faders]: Categories.Global_MidiControls,

    // Mixer subcategories
    [Categories.Mixer_XFader]: Categories.Mixer,
    [Categories.Mixer_EQ]: Categories.Mixer,
    [Categories.Mixer_Meters]: Categories.Mixer,

    // Deck Common subcategories
    [Categories.DeckCommon_Loop]: Categories.DeckCommon,
    [Categories.DeckCommon_Move]: Categories.DeckCommon,
    [Categories.DeckCommon_FreezeMode]: Categories.DeckCommon,
    [Categories.DeckCommon_Timecode]: Categories.DeckCommon,
    [Categories.DeckCommon_Submix]: Categories.DeckCommon,
    [Categories.DeckCommon_Submix_Meters]: Categories.DeckCommon_Submix,

    // Master Clock subcategories
    [Categories.MasterClock_AbletonLink]: Categories.MasterClock,

    // Track Deck subcategories
    [Categories.TrackDeck_Cue]: Categories.TrackDeck,
    [Categories.TrackDeck_Grid]: Categories.TrackDeck,

    // Remix Deck subcategories
    [Categories.RemixDeck_Legacy]: Categories.RemixDeck,
    [Categories.RemixDeck_DirectMapping]: Categories.RemixDeck,
    [Categories.RemixDeck_DirectMapping_Slot1]: Categories.RemixDeck_DirectMapping,
    [Categories.RemixDeck_DirectMapping_Slot2]: Categories.RemixDeck_DirectMapping,
    [Categories.RemixDeck_DirectMapping_Slot3]: Categories.RemixDeck_DirectMapping,
    [Categories.RemixDeck_DirectMapping_Slot4]: Categories.RemixDeck_DirectMapping,
    [Categories.RemixDeck_StepSequencer]: Categories.RemixDeck,

    // Browser subcategories
    [Categories.Browser_Tree]: Categories.Browser,
    [Categories.Browser_List]: Categories.Browser,
    [Categories.Browser_Favorites]: Categories.Browser,
  };

  return parentMap[category];
}

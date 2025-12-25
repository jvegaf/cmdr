/**
 * Known Conditions - All Traktor condition IDs
 *
 * AIDEV-NOTE: This enum contains all known Traktor condition IDs extracted from
 * cmdr.TsiLib.Conditions.Interpretation.KnownConditions. The enum names follow
 * the C# naming convention for easy cross-reference.
 *
 * Conditions are organized by category:
 * - DeckCommon: Tempo Range, Play/Pause, Is In Active Loop, Scratch Control, Deck Flavor
 * - RemixDeck: Slot State, Slot Play Mode, Sample Page, Capture Source, Slot Trigger Type
 * - RemixDeck_DirectMapping_Slot1-4: 64 Cell State conditions (IDs 665-728)
 * - RemixDeck_StepSequencer: Current Step
 * - TrackDeck: Hotcue 1-8 Type, Cue/Loop Move Mode
 * - FXUnit: FX Unit Mode
 * - Modifier: M1-M8
 *
 * @see cmdr/cmdr.TsiLib/Conditions/Interpretation/KnownConditions.cs
 */

/* eslint-disable @typescript-eslint/prefer-literal-enum-member */

/**
 * All known Traktor condition IDs.
 *
 * The numeric values are the actual condition IDs used in TSI files.
 * Names follow the pattern: Category_SubCategory_Name
 */
export enum KnownConditions {
  // ============================================================================
  // Deck Common Conditions
  // ============================================================================

  /** Tempo Range condition - what tempo range the deck is set to */
  DeckCommon_TempoRange = 19,

  /** Play/Pause state of the deck */
  DeckCommon_PlayPause = 100,

  /** Whether the deck is currently in an active loop */
  DeckCommon_IsInActiveLoop = 203,

  /** Whether scratch control (timecode) is enabled */
  DeckCommon_Timecode_ScratchControlOn = 2288,

  /** Type of deck (Track, Remix, Stem, Live Input) */
  DeckCommon_DeckFlavor = 2302,

  // ============================================================================
  // Remix Deck Conditions
  // ============================================================================

  /** State of a slot (Empty, Paused, Playing) */
  RemixDeck_SlotState = 247,

  /** Play mode of a slot (One Shot, Looped) */
  RemixDeck_SlotPlayMode = 265,

  /** Current sample page (1-4) */
  RemixDeck_SamplePageSelector = 733,

  /** Capture source (Deck A-D, Loop Recorder) */
  RemixDeck_CaptureSource = 2002,

  /** Slot trigger type (Latched, Gated) */
  RemixDeck_SlotTriggerType = 2003,

  // ============================================================================
  // Remix Deck Slot Cell State Conditions (IDs 665-728)
  // Slot 1, Cells 1-16
  // ============================================================================

  RemixDeck_DirectMapping_Slot1_Slot1Cell1State = 665,
  RemixDeck_DirectMapping_Slot1_Slot1Cell2State = 666,
  RemixDeck_DirectMapping_Slot1_Slot1Cell3State = 667,
  RemixDeck_DirectMapping_Slot1_Slot1Cell4State = 668,
  RemixDeck_DirectMapping_Slot1_Slot1Cell5State = 669,
  RemixDeck_DirectMapping_Slot1_Slot1Cell6State = 670,
  RemixDeck_DirectMapping_Slot1_Slot1Cell7State = 671,
  RemixDeck_DirectMapping_Slot1_Slot1Cell8State = 672,
  RemixDeck_DirectMapping_Slot1_Slot1Cell9State = 673,
  RemixDeck_DirectMapping_Slot1_Slot1Cell10State = 674,
  RemixDeck_DirectMapping_Slot1_Slot1Cell11State = 675,
  RemixDeck_DirectMapping_Slot1_Slot1Cell12State = 676,
  RemixDeck_DirectMapping_Slot1_Slot1Cell13State = 677,
  RemixDeck_DirectMapping_Slot1_Slot1Cell14State = 678,
  RemixDeck_DirectMapping_Slot1_Slot1Cell15State = 679,
  RemixDeck_DirectMapping_Slot1_Slot1Cell16State = 680,

  // ============================================================================
  // Slot 2, Cells 1-16
  // ============================================================================

  RemixDeck_DirectMapping_Slot2_Slot2Cell1State = 681,
  RemixDeck_DirectMapping_Slot2_Slot2Cell2State = 682,
  RemixDeck_DirectMapping_Slot2_Slot2Cell3State = 683,
  RemixDeck_DirectMapping_Slot2_Slot2Cell4State = 684,
  RemixDeck_DirectMapping_Slot2_Slot2Cell5State = 685,
  RemixDeck_DirectMapping_Slot2_Slot2Cell6State = 686,
  RemixDeck_DirectMapping_Slot2_Slot2Cell7State = 687,
  RemixDeck_DirectMapping_Slot2_Slot2Cell8State = 688,
  RemixDeck_DirectMapping_Slot2_Slot2Cell9State = 689,
  RemixDeck_DirectMapping_Slot2_Slot2Cell10State = 690,
  RemixDeck_DirectMapping_Slot2_Slot2Cell11State = 691,
  RemixDeck_DirectMapping_Slot2_Slot2Cell12State = 692,
  RemixDeck_DirectMapping_Slot2_Slot2Cell13State = 693,
  RemixDeck_DirectMapping_Slot2_Slot2Cell14State = 694,
  RemixDeck_DirectMapping_Slot2_Slot2Cell15State = 695,
  RemixDeck_DirectMapping_Slot2_Slot2Cell16State = 696,

  // ============================================================================
  // Slot 3, Cells 1-16
  // ============================================================================

  RemixDeck_DirectMapping_Slot3_Slot3Cell1State = 697,
  RemixDeck_DirectMapping_Slot3_Slot3Cell2State = 698,
  RemixDeck_DirectMapping_Slot3_Slot3Cell3State = 699,
  RemixDeck_DirectMapping_Slot3_Slot3Cell4State = 700,
  RemixDeck_DirectMapping_Slot3_Slot3Cell5State = 701,
  RemixDeck_DirectMapping_Slot3_Slot3Cell6State = 702,
  RemixDeck_DirectMapping_Slot3_Slot3Cell7State = 703,
  RemixDeck_DirectMapping_Slot3_Slot3Cell8State = 704,
  RemixDeck_DirectMapping_Slot3_Slot3Cell9State = 705,
  RemixDeck_DirectMapping_Slot3_Slot3Cell10State = 706,
  RemixDeck_DirectMapping_Slot3_Slot3Cell11State = 707,
  RemixDeck_DirectMapping_Slot3_Slot3Cell12State = 708,
  RemixDeck_DirectMapping_Slot3_Slot3Cell13State = 709,
  RemixDeck_DirectMapping_Slot3_Slot3Cell14State = 710,
  RemixDeck_DirectMapping_Slot3_Slot3Cell15State = 711,
  RemixDeck_DirectMapping_Slot3_Slot3Cell16State = 712,

  // ============================================================================
  // Slot 4, Cells 1-16
  // ============================================================================

  RemixDeck_DirectMapping_Slot4_Slot4Cell1State = 713,
  RemixDeck_DirectMapping_Slot4_Slot4Cell2State = 714,
  RemixDeck_DirectMapping_Slot4_Slot4Cell3State = 715,
  RemixDeck_DirectMapping_Slot4_Slot4Cell4State = 716,
  RemixDeck_DirectMapping_Slot4_Slot4Cell5State = 717,
  RemixDeck_DirectMapping_Slot4_Slot4Cell6State = 718,
  RemixDeck_DirectMapping_Slot4_Slot4Cell7State = 719,
  RemixDeck_DirectMapping_Slot4_Slot4Cell8State = 720,
  RemixDeck_DirectMapping_Slot4_Slot4Cell9State = 721,
  RemixDeck_DirectMapping_Slot4_Slot4Cell10State = 722,
  RemixDeck_DirectMapping_Slot4_Slot4Cell11State = 723,
  RemixDeck_DirectMapping_Slot4_Slot4Cell12State = 724,
  RemixDeck_DirectMapping_Slot4_Slot4Cell13State = 725,
  RemixDeck_DirectMapping_Slot4_Slot4Cell14State = 726,
  RemixDeck_DirectMapping_Slot4_Slot4Cell15State = 727,
  RemixDeck_DirectMapping_Slot4_Slot4Cell16State = 728,

  // ============================================================================
  // Remix Deck Step Sequencer Conditions
  // ============================================================================

  /** Current step in the step sequencer (1-16) */
  RemixDeck_StepSequencer_CurrentStep = 736,

  // ============================================================================
  // Track Deck Conditions - Hotcue Types
  // ============================================================================

  /** Type of Hotcue 1 (None, Cue, Fade-In, Fade-Out, Load, Grid, Loop) */
  TrackDeck_Cue_Hotcue1Type = 2333,

  /** Type of Hotcue 2 */
  TrackDeck_Cue_Hotcue2Type = 2334,

  /** Type of Hotcue 3 */
  TrackDeck_Cue_Hotcue3Type = 2335,

  /** Type of Hotcue 4 */
  TrackDeck_Cue_Hotcue4Type = 2336,

  /** Type of Hotcue 5 */
  TrackDeck_Cue_Hotcue5Type = 2337,

  /** Type of Hotcue 6 */
  TrackDeck_Cue_Hotcue6Type = 2338,

  /** Type of Hotcue 7 */
  TrackDeck_Cue_Hotcue7Type = 2339,

  /** Type of Hotcue 8 */
  TrackDeck_Cue_Hotcue8Type = 2340,

  /** Cue/Loop Move Mode (Beatjump, Loop, Loop In, Loop Out) */
  TrackDeck_Cue_LoopMoveMode = 2391,

  // ============================================================================
  // FX Unit Conditions
  // ============================================================================

  /** FX Unit Mode (Group or Single) */
  FXUnit_FXUnitMode = 2301,

  // ============================================================================
  // Modifier Conditions (M1-M8)
  // ============================================================================

  /** Modifier 1 value (0-7) */
  Modifier_Modifier1 = 2548,

  /** Modifier 2 value (0-7) */
  Modifier_Modifier2 = 2549,

  /** Modifier 3 value (0-7) */
  Modifier_Modifier3 = 2550,

  /** Modifier 4 value (0-7) */
  Modifier_Modifier4 = 2551,

  /** Modifier 5 value (0-7) */
  Modifier_Modifier5 = 2552,

  /** Modifier 6 value (0-7) */
  Modifier_Modifier6 = 2553,

  /** Modifier 7 value (0-7) */
  Modifier_Modifier7 = 2554,

  /** Modifier 8 value (0-7) */
  Modifier_Modifier8 = 2555,
}

/**
 * Total count of known conditions
 */
export const KNOWN_CONDITIONS_COUNT = Object.keys(KnownConditions).filter(
  (k) => !Number.isNaN(Number(k)),
).length;

/**
 * Effect Enum - All Traktor effects
 *
 * AIDEV-NOTE: This enum defines all available effects in Traktor Pro.
 * The IDs correspond to the internal Traktor effect IDs used in TSI files.
 * Some IDs are missing (gaps) because older effects were removed.
 *
 * Effects are organized into:
 * - Standard Effects (Flanger, Filter, Delay, Reverb, etc.)
 * - Macro Effects (Wormhole, Zzzurp, etc.)
 *
 * @see cmdr/cmdr.TsiLib/Enums/Effect.cs
 */

/* eslint-disable @typescript-eslint/prefer-literal-enum-member */

/**
 * All available Traktor effects.
 * The numeric values are the internal Traktor effect IDs.
 */
export enum Effect {
  /** No effect selected */
  NoEffect = 0,

  // ============================================================================
  // Flanger Effects
  // ============================================================================

  Flanger = 1,
  FlangerPulse = 2,
  FlangerFlux = 3,

  // ============================================================================
  // Phaser Effects
  // ============================================================================

  Phaser = 4,
  PhaserPulse = 5,
  PhaserFlux = 6,

  // ============================================================================
  // Filter Effects
  // ============================================================================

  FilterLFO = 7,
  FilterPulse = 8,
  Filter = 9,
  Filter92LFO = 10,
  Filter92Pulse = 11,
  Filter92 = 12,

  // ============================================================================
  // Delay & Time Effects
  // ============================================================================

  Delay = 13,
  Beatmasher2 = 14,
  ReverseGrain = 15,
  TurntableFX = 16,

  // ============================================================================
  // Modulation Effects
  // ============================================================================

  Gater = 17,

  // ============================================================================
  // Reverb Effects
  // ============================================================================

  Iceverb = 18,
  Reverb = 19,

  // Gap: IDs 20-23 (old effects, removed)

  // ============================================================================
  // Lo-Fi & Distortion Effects
  // ============================================================================

  DigitalLoFi = 24,
  Ringmodulator = 25,
  MulhollandDrive = 26,

  // ============================================================================
  // Pitch & Time Effects
  // ============================================================================

  TransposeStretch = 27,

  // ============================================================================
  // Traktor 3 Effects
  // ============================================================================

  ReverbT3 = 28,
  DelayT3 = 29,

  // Gap: ID 30 (old effect, removed)

  // ============================================================================
  // Additional Effects
  // ============================================================================

  BeatSlicer = 31,
  FormantFilter = 32,
  PeakFilter = 33,
  TapeDelay = 34,
  RampDelay = 35,
  AutoBouncer = 36,
  Bouncer = 37,

  // Gap: IDs 38-41 (old effects, removed)

  // ============================================================================
  // Macro Effects
  // ============================================================================

  Wormhole = 42,

  // Gap: IDs 43-55

  Zzzurp = 56,

  // Gap: ID 57

  LaserSlicer = 58,
  GranuPhase = 59,

  // Gap: IDs 60-61

  StrretchFast = 62,

  // Gap: IDs 63-73

  BassOMatic = 74,

  // Gap: ID 75

  PolarWind = 76,

  // Gap: IDs 77-83

  StrrretchSlow = 84,
  DarkMatter = 85,

  // Gap: ID 86

  EventHorizon = 87,

  // Gap: ID 88

  FlightTest = 89,
}

/**
 * Human-readable descriptions for each effect.
 */
export const EFFECT_DESCRIPTIONS: Record<Effect, string> = {
  [Effect.NoEffect]: "No Effect",
  [Effect.Flanger]: "Flanger",
  [Effect.FlangerPulse]: "Flanger Pulse",
  [Effect.FlangerFlux]: "Flanger Flux",
  [Effect.Phaser]: "Phaser",
  [Effect.PhaserPulse]: "Phaser Pulse",
  [Effect.PhaserFlux]: "Phaser Flux",
  [Effect.FilterLFO]: "Filter LFO",
  [Effect.FilterPulse]: "Filter Pulse",
  [Effect.Filter]: "Filter",
  [Effect.Filter92LFO]: "Filter:92 LFO",
  [Effect.Filter92Pulse]: "Filter:92 Pulse",
  [Effect.Filter92]: "Filter:92",
  [Effect.Delay]: "Delay",
  [Effect.Beatmasher2]: "Beatmasher 2",
  [Effect.ReverseGrain]: "Reverse Grain",
  [Effect.TurntableFX]: "Turntable FX",
  [Effect.Gater]: "Gater",
  [Effect.Iceverb]: "Iceverb",
  [Effect.Reverb]: "Reverb",
  [Effect.DigitalLoFi]: "Digital LoFi",
  [Effect.Ringmodulator]: "Ringmodulator",
  [Effect.MulhollandDrive]: "Mulholland-Drive",
  [Effect.TransposeStretch]: "Transpose Stretch",
  [Effect.ReverbT3]: "Reverb T3",
  [Effect.DelayT3]: "Delay T3",
  [Effect.BeatSlicer]: "Beat Slicer",
  [Effect.FormantFilter]: "Formant Filter",
  [Effect.PeakFilter]: "Peak Filter",
  [Effect.TapeDelay]: "Tape Delay",
  [Effect.RampDelay]: "Ramp Delay",
  [Effect.AutoBouncer]: "Auto Bouncer",
  [Effect.Bouncer]: "Bouncer",
  [Effect.Wormhole]: "Wormhole",
  [Effect.Zzzurp]: "Zzzurp",
  [Effect.LaserSlicer]: "Laser Slicer",
  [Effect.GranuPhase]: "Granu Phase",
  [Effect.StrretchFast]: "Strretch Fast",
  [Effect.BassOMatic]: "Bass-o-matic",
  [Effect.PolarWind]: "Polar Wind",
  [Effect.StrrretchSlow]: "Strrretch Slow",
  [Effect.DarkMatter]: "Dark Matter",
  [Effect.EventHorizon]: "Event Horizon",
  [Effect.FlightTest]: "Flight Test",
};

/**
 * Get human-readable description for an effect.
 */
export function getEffectDescription(effect: Effect): string {
  return EFFECT_DESCRIPTIONS[effect] ?? `Unknown Effect (${effect})`;
}

/**
 * Get all available effects (excluding NoEffect).
 */
export function getAllEffects(): Effect[] {
  return Object.values(Effect).filter(
    (e): e is Effect => typeof e === "number" && e !== Effect.NoEffect,
  );
}

/**
 * Check if a value is a valid effect ID.
 */
export function isValidEffect(id: number): id is Effect {
  return id in EFFECT_DESCRIPTIONS;
}

/**
 * Count of all effects (excluding NoEffect).
 */
export const EFFECT_COUNT = getAllEffects().length;

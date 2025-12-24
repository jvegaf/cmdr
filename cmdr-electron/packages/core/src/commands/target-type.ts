/**
 * Target Type - Describes the target type of a Traktor control/command
 *
 * AIDEV-NOTE: This enum matches the C# enum from cmdr.TsiLib.Enums.TargetType.
 * The target type determines which assignment options are available for a mapping
 * and how the mapping is applied (globally, per-deck, per-FX unit, etc.).
 *
 * @see cmdr/cmdr.TsiLib/Enums/TargetType.cs
 */

/**
 * The target type for a command determines its scope and available assignments.
 *
 * - Global: Command affects the entire application (e.g., Master Clock, Browser)
 * - Track: Command targets a specific deck (A, B, C, D) or Device Target
 * - Remix: Command targets a Remix Deck (1, 2, 3, 4)
 * - FX: Command targets an FX Unit (1, 2, 3, 4)
 * - Slot: Command targets a specific slot within a Remix Deck
 */
export enum TargetType {
  /** Global commands - affect the entire application */
  Global = 0,
  /** Track/Deck commands - target specific decks (A, B, C, D) */
  Track = 1,
  /** Remix Deck commands - target remix decks (1, 2, 3, 4) */
  Remix = 2,
  /** FX Unit commands - target FX units (1, 2, 3, 4) */
  FX = 3,
  /** Slot commands - target slots within remix decks */
  Slot = 4,
}

/**
 * Get a human-readable description for a target type
 */
export function getTargetTypeDescription(targetType: TargetType): string {
  switch (targetType) {
    case TargetType.Global:
      return "Global";
    case TargetType.Track:
      return "Track/Deck";
    case TargetType.Remix:
      return "Remix Deck";
    case TargetType.FX:
      return "FX Unit";
    case TargetType.Slot:
      return "Remix Slot";
    default:
      return "Unknown";
  }
}

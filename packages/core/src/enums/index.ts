/**
 * TSI Enums - All enumeration types used in TSI file format
 *
 * AIDEV-NOTE: These enums match the C# enums from cmdr.TsiLib.Enums.
 * Values must match exactly for binary compatibility.
 */

/**
 * Device type in TSI format
 */
export enum DeviceType {
  ProprietarySynth = 1,
  ProprietaryAudio = 2,
  ProprietaryController = 3,
  GenericMidi = 4,
}

/**
 * Mapping control type (Button, Fader, Encoder, LED)
 */
export enum MappingControlType {
  Button = 0,
  FaderOrKnob = 1,
  Encoder = 2,
  LED = 65535,
}

/**
 * Interaction mode for mappings
 */
export enum MappingInteractionMode {
  Trigger = 0,
  Toggle = 1,
  Hold = 2,
  Direct = 3,
  Relative = 4,
  Increment = 5,
  Decrement = 6,
  Reset = 7,
  Output = 8,
}

/**
 * Target deck for mappings
 */
export enum MappingTargetDeck {
  DeviceTarget = 0,
  DeckA = 1,
  DeckB = 2,
  DeckC = 3,
  DeckD = 4,
  DeckFocusedSlotLeft = 5,
  DeckFocusedSlotRight = 6,
}

/**
 * MIDI encoder mode
 */
export enum MidiEncoderMode {
  ThreeFhTwosComplement = 0,
  SevenFTwosComplement = 1,
  ThreeFh = 2,
  SevenF = 3,
}

/**
 * Value UI type in mappings
 */
export enum ValueUIType {
  ComboBox = 0,
  Integer = 1,
  Float = 2,
}

/**
 * Mapping resolution
 */
export enum MappingResolution {
  Default = 0,
  Fine = 1,
  Superfine = 2,
}

/**
 * Mapping type (In = input from controller, Out = output to controller)
 */
export enum MappingType {
  In = 0,
  Out = 1,
}

/**
 * Device target
 */
export enum DeviceTarget {
  None = 0,
  FocusedDeck = 1,
}

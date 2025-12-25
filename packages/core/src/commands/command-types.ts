/**
 * Command Types - Defines the different types of commands in Traktor
 *
 * AIDEV-NOTE: These types correspond to the C# command classes:
 * - TriggerInCommand, TriggerOutCommand
 * - EnumInCommand<T>, EnumOutCommand<T>
 * - FloatInCommand<T>, FloatOutCommand<T>
 * - IntInCommand<T>, IntOutCommand<T>
 * - OnOffInCommand (special case of EnumInCommand<OnOff>)
 * - HoldInCommand, HoldEnumInCommand<T>
 * - EffectSelectorInCommand, EffectSelectorOutCommand
 * - UnknownInCommand, UnknownOutCommand
 *
 * @see cmdr/cmdr.TsiLib/Commands/In/*.cs
 * @see cmdr/cmdr.TsiLib/Commands/Out/*.cs
 */

/**
 * Command type enumeration for input commands (controller -> Traktor)
 */
export enum CommandInType {
  /** No input command available */
  None = "None",
  /** Trigger command - fires once when button pressed */
  Trigger = "Trigger",
  /** On/Off command - toggles between on and off states */
  OnOff = "OnOff",
  /** Enum command - selects from enumerated values */
  Enum = "Enum",
  /** Float command - continuous value (0.0 to 1.0 or centered) */
  Float = "Float",
  /** Int command - integer value within a range */
  Int = "Int",
  /** Hold command - active while button held */
  Hold = "Hold",
  /** Hold + Enum command - select enum value while holding */
  HoldEnum = "HoldEnum",
  /** Effect selector command - special handling for FX selection */
  EffectSelector = "EffectSelector",
  /** Unknown command type */
  Unknown = "Unknown",
}

/**
 * Command type enumeration for output commands (Traktor -> controller)
 */
export enum CommandOutType {
  /** No output command available */
  None = "None",
  /** Trigger output - sends pulse when triggered */
  Trigger = "Trigger",
  /** Enum output - outputs enumerated value */
  Enum = "Enum",
  /** Float output - outputs continuous value */
  Float = "Float",
  /** Int output - outputs integer value */
  Int = "Int",
  /** Effect selector output - special handling for FX output */
  EffectSelector = "EffectSelector",
  /** Unknown command type */
  Unknown = "Unknown",
}

/**
 * Value range type for Float commands
 */
export enum FloatRangeType {
  /** 0.0 to 1.0 (e.g., volume, fader) */
  Relative = "Relative",
  /** -1.0 to 1.0 (e.g., pan, filter, tempo bend) */
  Centered = "Centered",
  /** -0.5 to 0.5 (e.g., phase) */
  CenteredHalf = "CenteredHalf",
  /** Master tempo range (specific BPM range) */
  MasterTempo = "MasterTempo",
  /** Swing amount (specific range for step sequencer) */
  SwingAmount = "SwingAmount",
}

/**
 * Get a human-readable description for an input command type
 */
export function getCommandInTypeDescription(type: CommandInType): string {
  switch (type) {
    case CommandInType.None:
      return "No Input";
    case CommandInType.Trigger:
      return "Trigger";
    case CommandInType.OnOff:
      return "On/Off Toggle";
    case CommandInType.Enum:
      return "Selection";
    case CommandInType.Float:
      return "Continuous";
    case CommandInType.Int:
      return "Integer";
    case CommandInType.Hold:
      return "Hold";
    case CommandInType.HoldEnum:
      return "Hold + Selection";
    case CommandInType.EffectSelector:
      return "Effect Selector";
    case CommandInType.Unknown:
      return "Unknown";
    default:
      return "Unknown";
  }
}

/**
 * Get a human-readable description for an output command type
 */
export function getCommandOutTypeDescription(type: CommandOutType): string {
  switch (type) {
    case CommandOutType.None:
      return "No Output";
    case CommandOutType.Trigger:
      return "Trigger";
    case CommandOutType.Enum:
      return "State";
    case CommandOutType.Float:
      return "Continuous";
    case CommandOutType.Int:
      return "Integer";
    case CommandOutType.EffectSelector:
      return "Effect Selector";
    case CommandOutType.Unknown:
      return "Unknown";
    default:
      return "Unknown";
  }
}

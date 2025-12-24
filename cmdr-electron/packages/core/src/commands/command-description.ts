/**
 * Command Description - Metadata interface for Traktor commands
 *
 * AIDEV-NOTE: This interface corresponds to the C# CommandDescription struct
 * and CommandDescriptionAttribute in cmdr.TsiLib.Commands.Interpretation.
 * It contains all the metadata needed to understand and work with a command.
 *
 * @see cmdr/cmdr.TsiLib/Commands/Interpretation/CommandDescription.cs
 */

import type { Categories } from "./categories";
import type { CommandInType, CommandOutType, FloatRangeType } from "./command-types";
import type { TargetType } from "./target-type";

/**
 * Complete description of a Traktor command's capabilities and metadata.
 * This is used to look up command information by ID.
 */
export interface CommandDescription {
  /** Numeric command ID (from KnownCommands enum) */
  id: number;

  /** Human-readable command name (e.g., "Play/Pause") */
  name: string;

  /** Category for organizing commands in the UI */
  category: Categories;

  /** Target type determines available assignment options */
  targetType: TargetType;

  /** Input command type (controller -> Traktor), undefined if output-only */
  inCommandType: CommandInType;

  /** Output command type (Traktor -> controller), undefined if input-only */
  outCommandType: CommandOutType;

  /**
   * The value enum type name for Enum commands (e.g., "ModifierValue", "LoopSize").
   * This is used to look up the available values for enum-based commands.
   * Only applicable for Enum, OnOff, and HoldEnum command types.
   */
  valueEnumType?: string;

  /**
   * Float range type for Float commands.
   * Determines the min/max values and centering behavior.
   */
  floatRangeType?: FloatRangeType;
}

/**
 * Simplified command description for creating the metadata map.
 * This omits the 'id' field since it's provided as the map key.
 */
export type CommandDescriptionInput = Omit<CommandDescription, "id">;

/**
 * Check if a command supports input (controller -> Traktor)
 */
export function hasInput(description: CommandDescription): boolean {
  return description.inCommandType !== "None";
}

/**
 * Check if a command supports output (Traktor -> controller)
 */
export function hasOutput(description: CommandDescription): boolean {
  return description.outCommandType !== "None";
}

/**
 * Check if a command has an associated value enum
 */
export function hasValueEnum(description: CommandDescription): boolean {
  return description.valueEnumType !== undefined;
}

/**
 * Check if a command is input-only (no LED feedback)
 */
export function isInputOnly(description: CommandDescription): boolean {
  return hasInput(description) && !hasOutput(description);
}

/**
 * Check if a command is output-only (LED/display only)
 */
export function isOutputOnly(description: CommandDescription): boolean {
  return !hasInput(description) && hasOutput(description);
}

/**
 * Check if a command supports both input and output
 */
export function isBidirectional(description: CommandDescription): boolean {
  return hasInput(description) && hasOutput(description);
}

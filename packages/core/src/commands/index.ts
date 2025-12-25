/**
 * Commands Module - Traktor Command Definitions and Metadata
 *
 * AIDEV-NOTE: This module provides the complete command system for Traktor TSI files.
 * It includes:
 * - TargetType: What type of target a command operates on (Global, Track, FX, etc.)
 * - Categories: Hierarchical category structure for organizing commands
 * - CommandInType/CommandOutType: Input and output command types
 * - KnownCommands: All ~300 Traktor command IDs
 * - COMMAND_METADATA: Lookup table mapping command IDs to their descriptions
 * - Helper functions for command lookup and filtering
 *
 * @example
 * import {
 *   KnownCommands,
 *   getCommandDescription,
 *   Categories,
 *   getCommandsByCategory,
 * } from './commands';
 *
 * // Get a specific command
 * const loopIn = getCommandDescription(KnownCommands.DeckCommon_Loop_LoopInSetCue);
 *
 * // Get all commands in a category
 * const mixerCommands = getCommandsByCategory(Categories.Mixer);
 */

// Enums
export {
	CATEGORY_DESCRIPTIONS,
	Categories,
	getCategoryDescription,
} from "./categories";
// Types
export type {
	CommandDescription,
	CommandDescriptionInput,
} from "./command-description";
// Metadata and helpers
export {
	COMMAND_METADATA,
	getAllKnownCommandIds,
	getCommandDescription,
	getCommandDescriptionOrUnknown,
	getCommandsByCategory,
	isKnownCommand,
} from "./command-metadata";
export { CommandInType, CommandOutType, FloatRangeType } from "./command-types";
export { KnownCommands } from "./known-commands";
export { TargetType } from "./target-type";

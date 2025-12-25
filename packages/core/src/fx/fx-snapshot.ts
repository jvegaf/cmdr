/**
 * FX Snapshot - Default button and knob values for an effect
 *
 * AIDEV-NOTE: FxSnapshot stores the default parameter values for a specific effect.
 * In TSI files, these are stored as XML entries:
 * - DEFAULT_BUTTON_FX{id} - List of 5 integers (button states)
 * - DEFAULT_PARAM_FX{id} - List of 5 floats (knob positions)
 *
 * @see cmdr/cmdr.TsiLib/FxSnapshot.cs
 */

import type { Effect } from "./effect";

/**
 * Button state snapshot for an effect.
 * Contains the default state of all 5 buttons in an FX unit.
 */
export interface FxButtonsSnapshot {
  /** Button group mode (0 or 1) */
  buttonGroupMode: number;
  /** Button 3 state */
  button3: number;
  /** Button 2 state */
  button2: number;
  /** Button 1 state */
  button1: number;
  /** On/Off state (0 or 1) */
  onOff: number;
}

/**
 * Knob position snapshot for an effect.
 * Contains the default position of all 5 knobs in an FX unit.
 * Values are typically 0.0 to 1.0.
 */
export interface FxKnobsSnapshot {
  /** Knob group mode position (for macro effects) */
  knobGroupMode: number;
  /** Knob 3 position */
  knob3: number;
  /** Knob 2 position */
  knob2: number;
  /** Knob 1 position */
  knob1: number;
  /** Dry/Wet mix position */
  dryWet: number;
}

/**
 * Complete snapshot of an effect's default parameters.
 */
export interface FxSnapshot {
  /** The effect this snapshot is for */
  effect: Effect;
  /** Button states (optional, may not exist for all effects) */
  buttons?: FxButtonsSnapshot;
  /** Knob positions (optional, may not exist for all effects) */
  knobs?: FxKnobsSnapshot;
}

/**
 * Create a default FxButtonsSnapshot with all buttons off.
 */
export function createDefaultButtonsSnapshot(): FxButtonsSnapshot {
  return {
    buttonGroupMode: 0,
    button3: 0,
    button2: 0,
    button1: 0,
    onOff: 0,
  };
}

/**
 * Create a default FxKnobsSnapshot with all knobs at 0.
 */
export function createDefaultKnobsSnapshot(): FxKnobsSnapshot {
  return {
    knobGroupMode: 0,
    knob3: 0,
    knob2: 0,
    knob1: 0,
    dryWet: 0,
  };
}

/**
 * Create an FxSnapshot for an effect with optional button/knob data.
 */
export function createFxSnapshot(
  effect: Effect,
  buttons?: FxButtonsSnapshot,
  knobs?: FxKnobsSnapshot,
): FxSnapshot {
  return {
    effect,
    buttons,
    knobs,
  };
}

/**
 * Parse button values from a list of 5 integers.
 * The order in TSI files is: [ButtonGroupMode, Button3, Button2, Button1, OnOff]
 */
export function parseButtonsFromList(values: number[]): FxButtonsSnapshot | undefined {
  if (values.length !== 5) {
    return undefined;
  }
  // AIDEV-NOTE: We've verified length is 5, so indices 0-4 are guaranteed to exist
  const [buttonGroupMode, button3, button2, button1, onOff] = values as [
    number,
    number,
    number,
    number,
    number,
  ];
  return {
    buttonGroupMode,
    button3,
    button2,
    button1,
    onOff,
  };
}

/**
 * Parse knob values from a list of 5 floats.
 * The order in TSI files is: [KnobGroupMode, Knob3, Knob2, Knob1, DryWet]
 */
export function parseKnobsFromList(values: number[]): FxKnobsSnapshot | undefined {
  if (values.length !== 5) {
    return undefined;
  }
  // AIDEV-NOTE: We've verified length is 5, so indices 0-4 are guaranteed to exist
  const [knobGroupMode, knob3, knob2, knob1, dryWet] = values as [
    number,
    number,
    number,
    number,
    number,
  ];
  return {
    knobGroupMode,
    knob3,
    knob2,
    knob1,
    dryWet,
  };
}

/**
 * Convert button snapshot to list format for saving.
 */
export function buttonsToList(buttons: FxButtonsSnapshot): number[] {
  return [
    buttons.buttonGroupMode,
    buttons.button3,
    buttons.button2,
    buttons.button1,
    buttons.onOff,
  ];
}

/**
 * Convert knob snapshot to list format for saving.
 */
export function knobsToList(knobs: FxKnobsSnapshot): number[] {
  return [knobs.knobGroupMode, knobs.knob3, knobs.knob2, knobs.knob1, knobs.dryWet];
}

/**
 * Get the XML entry name for button defaults of an effect.
 * Format: DEFAULT_BUTTON_FX{effectId}
 */
export function getButtonEntryName(effect: Effect): string {
  return `DEFAULT_BUTTON_FX${effect}`;
}

/**
 * Get the XML entry name for parameter defaults of an effect.
 * Format: DEFAULT_PARAM_FX{effectId}
 */
export function getParamEntryName(effect: Effect): string {
  return `DEFAULT_PARAM_FX${effect}`;
}

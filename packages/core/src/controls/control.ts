/**
 * Control Base - Abstract control definition for MIDI mappings
 *
 * AIDEV-NOTE: Controls define which interaction modes are allowed for each
 * control type (Button, Fader/Knob, Encoder, LED). This matches the C#
 * implementation in cmdr.TsiLib.Controls.
 *
 * Control Types:
 * - Button: Trigger, Toggle, Hold, Direct, Increment, Decrement, Reset
 * - Fader/Knob: Direct, Relative
 * - Encoder: Direct, Relative (with sensitivity/acceleration settings)
 * - LED: Output only
 *
 * @see cmdr/cmdr.TsiLib/Controls/AControl.cs
 */

import {
	MappingControlType,
	MappingInteractionMode,
} from "../enums/index.js";

/**
 * Base control interface.
 * All control types implement this interface.
 */
export interface Control {
	/** The type of MIDI control */
	readonly type: MappingControlType;

	/** Allowed interaction modes for this control type */
	readonly allowedInteractionModes: readonly MappingInteractionMode[];

	/** Human-readable name of the control */
	readonly name: string;

	/** Description of the control */
	readonly description: string;
}

/**
 * Button control subtypes based on interaction mode.
 *
 * AIDEV-NOTE: In C#, these are separate classes (TriggerButtonControl,
 * ToggleButtonControl, etc.). Here we use a discriminated union.
 */
export type ButtonControlSubtype =
	| "trigger"
	| "toggle"
	| "hold"
	| "direct"
	| "increment"
	| "decrement"
	| "reset";

/**
 * Fader/Knob control subtypes.
 */
export type FaderControlSubtype = "direct" | "relative";

/**
 * Extended button control with subtype information.
 */
export interface ButtonControl extends Control {
	readonly type: MappingControlType.Button;
	readonly subtype: ButtonControlSubtype;
}

/**
 * Extended fader/knob control with subtype information.
 */
export interface FaderControl extends Control {
	readonly type: MappingControlType.FaderOrKnob;
	readonly subtype: FaderControlSubtype;
}

/**
 * Encoder control with sensitivity settings.
 *
 * AIDEV-NOTE: Encoder has additional settings:
 * - RotarySensitivity: 0% to 300% (stored as value / 20)
 * - RotaryAcceleration: 0% to 100% (stored as value / 100)
 */
export interface EncoderControl extends Control {
	readonly type: MappingControlType.Encoder;

	/** Default rotary sensitivity percentage (0-300) */
	readonly defaultSensitivity: number;

	/** Default rotary acceleration percentage (0-100) */
	readonly defaultAcceleration: number;
}

/**
 * LED control for output mappings.
 *
 * AIDEV-NOTE: LED has MIDI range settings:
 * - MidiRangeMin/Max: 0-127
 * - Blend: boolean for smooth transitions
 */
export interface LedControl extends Control {
	readonly type: MappingControlType.LED;

	/** Default minimum MIDI value */
	readonly defaultMidiRangeMin: number;

	/** Default maximum MIDI value */
	readonly defaultMidiRangeMax: number;

	/** Default blend setting */
	readonly defaultBlend: boolean;
}

/**
 * Union type of all control types.
 */
export type AnyControl = ButtonControl | FaderControl | EncoderControl | LedControl;

/**
 * Check if a control type allows a specific interaction mode.
 */
export function isInteractionModeAllowed(
	control: Control,
	mode: MappingInteractionMode,
): boolean {
	return control.allowedInteractionModes.includes(mode);
}

/**
 * Get a human-readable name for a control type.
 */
export function getControlTypeName(type: MappingControlType): string {
	switch (type) {
		case MappingControlType.Button:
			return "Button";
		case MappingControlType.FaderOrKnob:
			return "Fader / Knob";
		case MappingControlType.Encoder:
			return "Encoder";
		case MappingControlType.LED:
			return "LED";
		default:
			return `Unknown (${type})`;
	}
}

/**
 * Get a human-readable name for an interaction mode.
 */
export function getInteractionModeName(mode: MappingInteractionMode): string {
	switch (mode) {
		case MappingInteractionMode.Trigger:
			return "Trigger";
		case MappingInteractionMode.Toggle:
			return "Toggle";
		case MappingInteractionMode.Hold:
			return "Hold";
		case MappingInteractionMode.Direct:
			return "Direct";
		case MappingInteractionMode.Relative:
			return "Relative";
		case MappingInteractionMode.Increment:
			return "Increment";
		case MappingInteractionMode.Decrement:
			return "Decrement";
		case MappingInteractionMode.Reset:
			return "Reset";
		case MappingInteractionMode.Output:
			return "Output";
		default:
			return `Unknown (${mode})`;
	}
}

/**
 * Button Controls - Different button interaction modes
 *
 * AIDEV-NOTE: Button controls support multiple interaction modes:
 * - Trigger: Momentary press, fires once
 * - Toggle: Switch between two states
 * - Hold: Active while pressed
 * - Direct: Set value directly (on press)
 * - Increment/Decrement: Change value by step
 * - Reset: Reset to default value
 *
 * @see cmdr/cmdr.TsiLib/Controls/Button/AButtonControl.cs
 */

import { MappingControlType, MappingInteractionMode } from "../enums/index.js";
import type { ButtonControl, ButtonControlSubtype } from "./control.js";

/**
 * All interaction modes allowed for button controls.
 */
export const BUTTON_ALLOWED_MODES: readonly MappingInteractionMode[] = [
	MappingInteractionMode.Trigger,
	MappingInteractionMode.Direct,
	MappingInteractionMode.Hold,
	MappingInteractionMode.Increment,
	MappingInteractionMode.Decrement,
	MappingInteractionMode.Toggle,
	MappingInteractionMode.Reset,
] as const;

/**
 * Create a button control with the specified subtype.
 */
export function createButtonControl(subtype: ButtonControlSubtype): ButtonControl {
	return {
		type: MappingControlType.Button,
		subtype,
		name: getButtonControlName(subtype),
		description: getButtonControlDescription(subtype),
		allowedInteractionModes: BUTTON_ALLOWED_MODES,
	};
}

/**
 * Get the button control subtype for an interaction mode.
 */
export function getButtonSubtypeForMode(
	mode: MappingInteractionMode,
): ButtonControlSubtype | null {
	switch (mode) {
		case MappingInteractionMode.Trigger:
			return "trigger";
		case MappingInteractionMode.Toggle:
			return "toggle";
		case MappingInteractionMode.Hold:
			return "hold";
		case MappingInteractionMode.Direct:
		case MappingInteractionMode.Reset:
			return "direct";
		case MappingInteractionMode.Increment:
			return "increment";
		case MappingInteractionMode.Decrement:
			return "decrement";
		default:
			return null;
	}
}

/**
 * Get human-readable name for button subtype.
 */
function getButtonControlName(subtype: ButtonControlSubtype): string {
	switch (subtype) {
		case "trigger":
			return "Trigger Button";
		case "toggle":
			return "Toggle Button";
		case "hold":
			return "Hold Button";
		case "direct":
			return "Direct Button";
		case "increment":
			return "Increment Button";
		case "decrement":
			return "Decrement Button";
		case "reset":
			return "Reset Button";
	}
}

/**
 * Get description for button subtype.
 */
function getButtonControlDescription(subtype: ButtonControlSubtype): string {
	switch (subtype) {
		case "trigger":
			return "Momentary button that fires once when pressed";
		case "toggle":
			return "Button that toggles between two states";
		case "hold":
			return "Button that is active while held down";
		case "direct":
			return "Button that sets a value directly on press";
		case "increment":
			return "Button that increments a value";
		case "decrement":
			return "Button that decrements a value";
		case "reset":
			return "Button that resets to default value";
	}
}

/**
 * Pre-defined button control instances.
 */
export const BUTTON_CONTROLS = {
	trigger: createButtonControl("trigger"),
	toggle: createButtonControl("toggle"),
	hold: createButtonControl("hold"),
	direct: createButtonControl("direct"),
	increment: createButtonControl("increment"),
	decrement: createButtonControl("decrement"),
	reset: createButtonControl("reset"),
} as const;

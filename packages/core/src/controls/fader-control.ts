/**
 * Fader/Knob Controls - Continuous controllers
 *
 * AIDEV-NOTE: Fader/Knob controls support two modes:
 * - Direct: Absolute position mapping (0-127 → 0-100%)
 * - Relative: Incremental changes
 *
 * @see cmdr/cmdr.TsiLib/Controls/FaderOrKnob/FaderOrKnobControl.cs
 */

import { MappingControlType, MappingInteractionMode } from "../enums/index.js";
import type { FaderControl, FaderControlSubtype } from "./control.js";

/**
 * All interaction modes allowed for fader/knob controls.
 */
export const FADER_ALLOWED_MODES: readonly MappingInteractionMode[] = [
	MappingInteractionMode.Relative,
	MappingInteractionMode.Direct,
] as const;

/**
 * Create a fader/knob control with the specified subtype.
 */
export function createFaderControl(subtype: FaderControlSubtype): FaderControl {
	return {
		type: MappingControlType.FaderOrKnob,
		subtype,
		name: getFaderControlName(subtype),
		description: getFaderControlDescription(subtype),
		allowedInteractionModes: FADER_ALLOWED_MODES,
	};
}

/**
 * Get the fader control subtype for an interaction mode.
 */
export function getFaderSubtypeForMode(
	mode: MappingInteractionMode,
): FaderControlSubtype | null {
	switch (mode) {
		case MappingInteractionMode.Direct:
			return "direct";
		case MappingInteractionMode.Relative:
			return "relative";
		default:
			return null;
	}
}

/**
 * Get human-readable name for fader subtype.
 */
function getFaderControlName(subtype: FaderControlSubtype): string {
	switch (subtype) {
		case "direct":
			return "Direct Fader/Knob";
		case "relative":
			return "Relative Fader/Knob";
	}
}

/**
 * Get description for fader subtype.
 */
function getFaderControlDescription(subtype: FaderControlSubtype): string {
	switch (subtype) {
		case "direct":
			return "Absolute position fader/knob (0-127 maps to full range)";
		case "relative":
			return "Relative change fader/knob (sends increments/decrements)";
	}
}

/**
 * Pre-defined fader control instances.
 */
export const FADER_CONTROLS = {
	direct: createFaderControl("direct"),
	relative: createFaderControl("relative"),
} as const;

/**
 * Control Factory - Create controls based on type and interaction mode
 *
 * AIDEV-NOTE: This factory creates the appropriate control based on
 * control type and interaction mode. It mirrors the C# implementation
 * in cmdr.TsiLib.Controls.All.GetControl().
 *
 * @see cmdr/cmdr.TsiLib/Controls/All.cs
 */

import { MappingControlType, MappingInteractionMode } from "../enums/index.js";
import {
	BUTTON_ALLOWED_MODES,
	BUTTON_CONTROLS,
	createButtonControl,
	getButtonSubtypeForMode,
} from "./button-control.js";
import type { AnyControl, Control } from "./control.js";
import {
	createEncoderControl,
	ENCODER_ALLOWED_MODES,
	ENCODER_CONTROL,
} from "./encoder-control.js";
import {
	createFaderControl,
	FADER_ALLOWED_MODES,
	FADER_CONTROLS,
	getFaderSubtypeForMode,
} from "./fader-control.js";
import {
	createLedControl,
	LED_ALLOWED_MODES,
	LED_CONTROL,
} from "./led-control.js";

/**
 * Get the appropriate control for a control type and interaction mode.
 *
 * @param controlType - The type of MIDI control
 * @param interactionMode - The interaction mode
 * @returns The control or null if invalid combination
 */
export function getControl(
	controlType: MappingControlType,
	interactionMode: MappingInteractionMode,
): AnyControl | null {
	switch (controlType) {
		case MappingControlType.Button: {
			const subtype = getButtonSubtypeForMode(interactionMode);
			if (subtype) {
				return createButtonControl(subtype);
			}
			return null;
		}

		case MappingControlType.FaderOrKnob: {
			const subtype = getFaderSubtypeForMode(interactionMode);
			if (subtype) {
				return createFaderControl(subtype);
			}
			return null;
		}

		case MappingControlType.Encoder: {
			if (ENCODER_ALLOWED_MODES.includes(interactionMode)) {
				return createEncoderControl();
			}
			return null;
		}

		case MappingControlType.LED: {
			if (LED_ALLOWED_MODES.includes(interactionMode)) {
				return createLedControl();
			}
			return null;
		}

		default:
			return null;
	}
}

/**
 * Get the default control for a control type.
 *
 * @param controlType - The type of MIDI control
 * @returns The default control for the type
 */
export function getDefaultControl(controlType: MappingControlType): AnyControl {
	switch (controlType) {
		case MappingControlType.Button:
			return BUTTON_CONTROLS.trigger;
		case MappingControlType.FaderOrKnob:
			return FADER_CONTROLS.direct;
		case MappingControlType.Encoder:
			return ENCODER_CONTROL;
		case MappingControlType.LED:
			return LED_CONTROL;
		default:
			return BUTTON_CONTROLS.trigger;
	}
}

/**
 * Get all allowed interaction modes for a control type.
 *
 * @param controlType - The type of MIDI control
 * @returns Array of allowed interaction modes
 */
export function getAllowedModesForControlType(
	controlType: MappingControlType,
): readonly MappingInteractionMode[] {
	switch (controlType) {
		case MappingControlType.Button:
			return BUTTON_ALLOWED_MODES;
		case MappingControlType.FaderOrKnob:
			return FADER_ALLOWED_MODES;
		case MappingControlType.Encoder:
			return ENCODER_ALLOWED_MODES;
		case MappingControlType.LED:
			return LED_ALLOWED_MODES;
		default:
			return [];
	}
}

/**
 * Check if a control type can use a specific interaction mode.
 *
 * @param controlType - The type of MIDI control
 * @param interactionMode - The interaction mode to check
 * @returns True if the mode is allowed for this control type
 */
export function isValidControlModeCombo(
	controlType: MappingControlType,
	interactionMode: MappingInteractionMode,
): boolean {
	const allowedModes = getAllowedModesForControlType(controlType);
	return allowedModes.includes(interactionMode);
}

/**
 * Get all controls that support a specific set of interaction modes.
 *
 * AIDEV-NOTE: This matches C# All.GetControls() which filters controls
 * by the interaction modes they support.
 *
 * @param interactionModes - The interaction modes to filter by
 * @returns Array of controls that support ALL the specified modes
 */
export function getControlsForModes(
	interactionModes: MappingInteractionMode[],
): Control[] {
	const result: Control[] = [];

	// Check if Button control supports all modes
	const buttonSupportsAll = interactionModes.every((mode) =>
		BUTTON_ALLOWED_MODES.includes(mode),
	);
	if (buttonSupportsAll) {
		result.push(BUTTON_CONTROLS.trigger);
	}

	// Check if Fader supports all modes (but only if Relative is included)
	const faderSupportsAll = interactionModes.every((mode) =>
		FADER_ALLOWED_MODES.includes(mode),
	);
	if (
		faderSupportsAll &&
		interactionModes.includes(MappingInteractionMode.Relative)
	) {
		result.push(FADER_CONTROLS.direct);
	}

	// Check if Encoder supports all modes
	const encoderSupportsAll = interactionModes.every((mode) =>
		ENCODER_ALLOWED_MODES.includes(mode),
	);
	if (encoderSupportsAll) {
		result.push(ENCODER_CONTROL);
	}

	// Check if LED supports all modes
	const ledSupportsAll = interactionModes.every((mode) =>
		LED_ALLOWED_MODES.includes(mode),
	);
	if (ledSupportsAll) {
		result.push(LED_CONTROL);
	}

	return result;
}

/**
 * Get all control types as an array.
 */
export function getAllControlTypes(): MappingControlType[] {
	return [
		MappingControlType.Button,
		MappingControlType.FaderOrKnob,
		MappingControlType.Encoder,
		MappingControlType.LED,
	];
}

/**
 * Get all interaction modes as an array.
 */
export function getAllInteractionModes(): MappingInteractionMode[] {
	return [
		MappingInteractionMode.Trigger,
		MappingInteractionMode.Toggle,
		MappingInteractionMode.Hold,
		MappingInteractionMode.Direct,
		MappingInteractionMode.Relative,
		MappingInteractionMode.Increment,
		MappingInteractionMode.Decrement,
		MappingInteractionMode.Reset,
		MappingInteractionMode.Output,
	];
}

/**
 * Controls Module - MIDI control types and interaction modes
 *
 * AIDEV-NOTE: This module defines the control types used in Traktor mappings:
 * - Button: Various interaction modes (Trigger, Toggle, Hold, etc.)
 * - Fader/Knob: Direct and Relative modes
 * - Encoder: Rotary encoders with sensitivity settings
 * - LED: Output-only for visual feedback
 *
 * @see cmdr/cmdr.TsiLib/Controls/
 */

// Button controls
export {
	BUTTON_ALLOWED_MODES,
	BUTTON_CONTROLS,
	createButtonControl,
	getButtonSubtypeForMode,
} from "./button-control.js";
// Base control types
export type {
	AnyControl,
	ButtonControl,
	ButtonControlSubtype,
	Control,
	EncoderControl,
	FaderControl,
	FaderControlSubtype,
	LedControl,
} from "./control.js";
export {
	getControlTypeName,
	getInteractionModeName,
	isInteractionModeAllowed,
} from "./control.js";
// Control factory
export {
	getAllControlTypes,
	getAllInteractionModes,
	getAllowedModesForControlType,
	getControl,
	getControlsForModes,
	getDefaultControl,
	isValidControlModeCombo,
} from "./control-factory.js";

// Encoder controls
export {
	accelerationFromRaw,
	accelerationToRaw,
	createEncoderControl,
	DEFAULT_ENCODER_ACCELERATION,
	DEFAULT_ENCODER_SENSITIVITY,
	ENCODER_ALLOWED_MODES,
	ENCODER_CONTROL,
	sensitivityFromRaw,
	sensitivityToRaw,
} from "./encoder-control.js";
// Fader controls
export {
	createFaderControl,
	FADER_ALLOWED_MODES,
	FADER_CONTROLS,
	getFaderSubtypeForMode,
} from "./fader-control.js";
// LED controls
export {
	createLedControl,
	DEFAULT_LED_BLEND,
	DEFAULT_LED_MIDI_MAX,
	DEFAULT_LED_MIDI_MIN,
	LED_ALLOWED_MODES,
	LED_CONTROL,
} from "./led-control.js";

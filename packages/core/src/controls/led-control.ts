/**
 * LED Controls - Output controls for LEDs
 *
 * AIDEV-NOTE: LED controls are output-only and have MIDI range settings:
 * - MidiRangeMin: Minimum MIDI value (0-127)
 * - MidiRangeMax: Maximum MIDI value (0-127)
 * - Blend: Enable smooth transitions between values
 *
 * @see cmdr/cmdr.TsiLib/Controls/LED/LedControl.cs
 */

import { MappingControlType, MappingInteractionMode } from "../enums/index.js";
import type { LedControl } from "./control.js";

/**
 * All interaction modes allowed for LED controls.
 * LED only supports Output mode.
 */
export const LED_ALLOWED_MODES: readonly MappingInteractionMode[] = [
	MappingInteractionMode.Output,
] as const;

/**
 * Default LED MIDI range minimum.
 */
export const DEFAULT_LED_MIDI_MIN = 0;

/**
 * Default LED MIDI range maximum.
 */
export const DEFAULT_LED_MIDI_MAX = 127;

/**
 * Default LED blend setting.
 */
export const DEFAULT_LED_BLEND = false;

/**
 * Create an LED control.
 */
export function createLedControl(
	midiRangeMin: number = DEFAULT_LED_MIDI_MIN,
	midiRangeMax: number = DEFAULT_LED_MIDI_MAX,
	blend: boolean = DEFAULT_LED_BLEND,
): LedControl {
	return {
		type: MappingControlType.LED,
		name: "LED",
		description: "Output control for LED feedback",
		allowedInteractionModes: LED_ALLOWED_MODES,
		defaultMidiRangeMin: midiRangeMin,
		defaultMidiRangeMax: midiRangeMax,
		defaultBlend: blend,
	};
}

/**
 * Pre-defined LED control instance with default settings.
 */
export const LED_CONTROL = createLedControl();

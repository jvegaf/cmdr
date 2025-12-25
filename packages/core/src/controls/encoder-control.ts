/**
 * Encoder Controls - Rotary encoders with sensitivity settings
 *
 * AIDEV-NOTE: Encoder controls are similar to relative faders but have
 * additional settings for sensitivity and acceleration:
 * - RotarySensitivity: 0% to 300% (stored as value / 20 in binary)
 * - RotaryAcceleration: 0% to 100% (stored as value / 100 in binary)
 * - EncoderMode: 3Fh/41h or 7Fh/01h
 *
 * @see cmdr/cmdr.TsiLib/Controls/Encoder/EncoderControl.cs
 */

import { MappingControlType, MappingInteractionMode } from "../enums/index.js";
import type { EncoderControl } from "./control.js";

/**
 * All interaction modes allowed for encoder controls.
 */
export const ENCODER_ALLOWED_MODES: readonly MappingInteractionMode[] = [
	MappingInteractionMode.Relative,
	MappingInteractionMode.Direct,
] as const;

/**
 * Default encoder sensitivity (100% = 5.0 raw value)
 */
export const DEFAULT_ENCODER_SENSITIVITY = 100;

/**
 * Default encoder acceleration (0%)
 */
export const DEFAULT_ENCODER_ACCELERATION = 0;

/**
 * Create an encoder control.
 */
export function createEncoderControl(
	sensitivity: number = DEFAULT_ENCODER_SENSITIVITY,
	acceleration: number = DEFAULT_ENCODER_ACCELERATION,
): EncoderControl {
	return {
		type: MappingControlType.Encoder,
		name: "Encoder",
		description: "Rotary encoder with sensitivity and acceleration settings",
		allowedInteractionModes: ENCODER_ALLOWED_MODES,
		defaultSensitivity: sensitivity,
		defaultAcceleration: acceleration,
	};
}

/**
 * Convert sensitivity percentage to raw value.
 * Raw value is percentage / 20.
 *
 * @param percentage - Sensitivity percentage (0-300)
 * @returns Raw value for binary format
 */
export function sensitivityToRaw(percentage: number): number {
	return percentage / 20;
}

/**
 * Convert raw sensitivity value to percentage.
 *
 * @param raw - Raw value from binary format
 * @returns Sensitivity percentage (0-300)
 */
export function sensitivityFromRaw(raw: number): number {
	return Math.round(raw * 20);
}

/**
 * Convert acceleration percentage to raw value.
 * Raw value is percentage / 100.
 *
 * @param percentage - Acceleration percentage (0-100)
 * @returns Raw value for binary format
 */
export function accelerationToRaw(percentage: number): number {
	return percentage / 100;
}

/**
 * Convert raw acceleration value to percentage.
 *
 * @param raw - Raw value from binary format
 * @returns Acceleration percentage (0-100)
 */
export function accelerationFromRaw(raw: number): number {
	return Math.round(raw * 100);
}

/**
 * Pre-defined encoder control instance with default settings.
 */
export const ENCODER_CONTROL = createEncoderControl();

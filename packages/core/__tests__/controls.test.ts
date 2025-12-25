/**
 * Tests for Controls module
 *
 * AIDEV-NOTE: Tests cover:
 * - Control types and interfaces
 * - Button, Fader, Encoder, LED controls
 * - Control factory and mode validation
 */

import { describe, expect, it } from "vitest";
import {
	// Encoder
	accelerationFromRaw,
	accelerationToRaw,
	// Button
	BUTTON_ALLOWED_MODES,
	BUTTON_CONTROLS,
	type ButtonControl,
	createButtonControl,
	createEncoderControl,
	// Fader
	createFaderControl,
	// LED
	createLedControl,
	DEFAULT_ENCODER_ACCELERATION,
	DEFAULT_ENCODER_SENSITIVITY,
	DEFAULT_LED_BLEND,
	DEFAULT_LED_MIDI_MAX,
	DEFAULT_LED_MIDI_MIN,
	ENCODER_ALLOWED_MODES,
	ENCODER_CONTROL,
	FADER_ALLOWED_MODES,
	FADER_CONTROLS,
	// Factory
	getAllControlTypes,
	getAllInteractionModes,
	getAllowedModesForControlType,
	getButtonSubtypeForMode,
	getControl,
	getControlsForModes,
	getControlTypeName,
	getDefaultControl,
	getFaderSubtypeForMode,
	getInteractionModeName,
	isValidControlModeCombo,
	LED_ALLOWED_MODES,
	LED_CONTROL,
	// Enums
	MappingControlType,
	MappingInteractionMode,
	sensitivityFromRaw,
	sensitivityToRaw,
} from "../src/index";

describe("Control base", () => {
	describe("getControlTypeName", () => {
		it("should return correct names for all control types", () => {
			expect(getControlTypeName(MappingControlType.Button)).toBe("Button");
			expect(getControlTypeName(MappingControlType.FaderOrKnob)).toBe(
				"Fader / Knob",
			);
			expect(getControlTypeName(MappingControlType.Encoder)).toBe("Encoder");
			expect(getControlTypeName(MappingControlType.LED)).toBe("LED");
		});

		it("should return unknown for invalid type", () => {
			expect(getControlTypeName(999 as MappingControlType)).toBe(
				"Unknown (999)",
			);
		});
	});

	describe("getInteractionModeName", () => {
		it("should return correct names for all interaction modes", () => {
			expect(getInteractionModeName(MappingInteractionMode.Trigger)).toBe(
				"Trigger",
			);
			expect(getInteractionModeName(MappingInteractionMode.Toggle)).toBe(
				"Toggle",
			);
			expect(getInteractionModeName(MappingInteractionMode.Hold)).toBe("Hold");
			expect(getInteractionModeName(MappingInteractionMode.Direct)).toBe(
				"Direct",
			);
			expect(getInteractionModeName(MappingInteractionMode.Relative)).toBe(
				"Relative",
			);
			expect(getInteractionModeName(MappingInteractionMode.Increment)).toBe(
				"Increment",
			);
			expect(getInteractionModeName(MappingInteractionMode.Decrement)).toBe(
				"Decrement",
			);
			expect(getInteractionModeName(MappingInteractionMode.Reset)).toBe(
				"Reset",
			);
			expect(getInteractionModeName(MappingInteractionMode.Output)).toBe(
				"Output",
			);
		});
	});
});

describe("Button controls", () => {
	it("should have correct allowed modes", () => {
		expect(BUTTON_ALLOWED_MODES).toContain(MappingInteractionMode.Trigger);
		expect(BUTTON_ALLOWED_MODES).toContain(MappingInteractionMode.Toggle);
		expect(BUTTON_ALLOWED_MODES).toContain(MappingInteractionMode.Hold);
		expect(BUTTON_ALLOWED_MODES).toContain(MappingInteractionMode.Direct);
		expect(BUTTON_ALLOWED_MODES).toContain(MappingInteractionMode.Increment);
		expect(BUTTON_ALLOWED_MODES).toContain(MappingInteractionMode.Decrement);
		expect(BUTTON_ALLOWED_MODES).toContain(MappingInteractionMode.Reset);
		expect(BUTTON_ALLOWED_MODES).not.toContain(MappingInteractionMode.Relative);
		expect(BUTTON_ALLOWED_MODES).not.toContain(MappingInteractionMode.Output);
	});

	it("should create button controls with correct type", () => {
		const trigger = createButtonControl("trigger");
		expect(trigger.type).toBe(MappingControlType.Button);
		expect(trigger.subtype).toBe("trigger");
		expect(trigger.name).toBe("Trigger Button");
	});

	it("should have pre-defined button controls", () => {
		expect(BUTTON_CONTROLS.trigger.subtype).toBe("trigger");
		expect(BUTTON_CONTROLS.toggle.subtype).toBe("toggle");
		expect(BUTTON_CONTROLS.hold.subtype).toBe("hold");
		expect(BUTTON_CONTROLS.direct.subtype).toBe("direct");
		expect(BUTTON_CONTROLS.increment.subtype).toBe("increment");
		expect(BUTTON_CONTROLS.decrement.subtype).toBe("decrement");
		expect(BUTTON_CONTROLS.reset.subtype).toBe("reset");
	});

	describe("getButtonSubtypeForMode", () => {
		it("should return correct subtype for each mode", () => {
			expect(getButtonSubtypeForMode(MappingInteractionMode.Trigger)).toBe(
				"trigger",
			);
			expect(getButtonSubtypeForMode(MappingInteractionMode.Toggle)).toBe(
				"toggle",
			);
			expect(getButtonSubtypeForMode(MappingInteractionMode.Hold)).toBe("hold");
			expect(getButtonSubtypeForMode(MappingInteractionMode.Direct)).toBe(
				"direct",
			);
			expect(getButtonSubtypeForMode(MappingInteractionMode.Reset)).toBe(
				"direct",
			);
			expect(getButtonSubtypeForMode(MappingInteractionMode.Increment)).toBe(
				"increment",
			);
			expect(getButtonSubtypeForMode(MappingInteractionMode.Decrement)).toBe(
				"decrement",
			);
		});

		it("should return null for unsupported modes", () => {
			expect(
				getButtonSubtypeForMode(MappingInteractionMode.Relative),
			).toBeNull();
			expect(getButtonSubtypeForMode(MappingInteractionMode.Output)).toBeNull();
		});
	});
});

describe("Fader controls", () => {
	it("should have correct allowed modes", () => {
		expect(FADER_ALLOWED_MODES).toContain(MappingInteractionMode.Direct);
		expect(FADER_ALLOWED_MODES).toContain(MappingInteractionMode.Relative);
		expect(FADER_ALLOWED_MODES).toHaveLength(2);
	});

	it("should create fader controls with correct type", () => {
		const direct = createFaderControl("direct");
		expect(direct.type).toBe(MappingControlType.FaderOrKnob);
		expect(direct.subtype).toBe("direct");
		expect(direct.name).toBe("Direct Fader/Knob");
	});

	it("should have pre-defined fader controls", () => {
		expect(FADER_CONTROLS.direct.subtype).toBe("direct");
		expect(FADER_CONTROLS.relative.subtype).toBe("relative");
	});

	describe("getFaderSubtypeForMode", () => {
		it("should return correct subtype for each mode", () => {
			expect(getFaderSubtypeForMode(MappingInteractionMode.Direct)).toBe(
				"direct",
			);
			expect(getFaderSubtypeForMode(MappingInteractionMode.Relative)).toBe(
				"relative",
			);
		});

		it("should return null for unsupported modes", () => {
			expect(getFaderSubtypeForMode(MappingInteractionMode.Trigger)).toBeNull();
			expect(getFaderSubtypeForMode(MappingInteractionMode.Toggle)).toBeNull();
		});
	});
});

describe("Encoder controls", () => {
	it("should have correct allowed modes", () => {
		expect(ENCODER_ALLOWED_MODES).toContain(MappingInteractionMode.Direct);
		expect(ENCODER_ALLOWED_MODES).toContain(MappingInteractionMode.Relative);
		expect(ENCODER_ALLOWED_MODES).toHaveLength(2);
	});

	it("should create encoder with default settings", () => {
		const encoder = createEncoderControl();
		expect(encoder.type).toBe(MappingControlType.Encoder);
		expect(encoder.defaultSensitivity).toBe(DEFAULT_ENCODER_SENSITIVITY);
		expect(encoder.defaultAcceleration).toBe(DEFAULT_ENCODER_ACCELERATION);
	});

	it("should create encoder with custom settings", () => {
		const encoder = createEncoderControl(200, 50);
		expect(encoder.defaultSensitivity).toBe(200);
		expect(encoder.defaultAcceleration).toBe(50);
	});

	it("should have pre-defined encoder control", () => {
		expect(ENCODER_CONTROL.type).toBe(MappingControlType.Encoder);
		expect(ENCODER_CONTROL.defaultSensitivity).toBe(100);
	});

	describe("sensitivity conversion", () => {
		it("should convert percentage to raw value", () => {
			expect(sensitivityToRaw(100)).toBe(5);
			expect(sensitivityToRaw(200)).toBe(10);
			expect(sensitivityToRaw(0)).toBe(0);
		});

		it("should convert raw value to percentage", () => {
			expect(sensitivityFromRaw(5)).toBe(100);
			expect(sensitivityFromRaw(10)).toBe(200);
			expect(sensitivityFromRaw(0)).toBe(0);
		});
	});

	describe("acceleration conversion", () => {
		it("should convert percentage to raw value", () => {
			expect(accelerationToRaw(100)).toBe(1);
			expect(accelerationToRaw(50)).toBe(0.5);
			expect(accelerationToRaw(0)).toBe(0);
		});

		it("should convert raw value to percentage", () => {
			expect(accelerationFromRaw(1)).toBe(100);
			expect(accelerationFromRaw(0.5)).toBe(50);
			expect(accelerationFromRaw(0)).toBe(0);
		});
	});
});

describe("LED controls", () => {
	it("should have correct allowed modes", () => {
		expect(LED_ALLOWED_MODES).toContain(MappingInteractionMode.Output);
		expect(LED_ALLOWED_MODES).toHaveLength(1);
	});

	it("should create LED with default settings", () => {
		const led = createLedControl();
		expect(led.type).toBe(MappingControlType.LED);
		expect(led.defaultMidiRangeMin).toBe(DEFAULT_LED_MIDI_MIN);
		expect(led.defaultMidiRangeMax).toBe(DEFAULT_LED_MIDI_MAX);
		expect(led.defaultBlend).toBe(DEFAULT_LED_BLEND);
	});

	it("should create LED with custom settings", () => {
		const led = createLedControl(10, 100, true);
		expect(led.defaultMidiRangeMin).toBe(10);
		expect(led.defaultMidiRangeMax).toBe(100);
		expect(led.defaultBlend).toBe(true);
	});

	it("should have pre-defined LED control", () => {
		expect(LED_CONTROL.type).toBe(MappingControlType.LED);
		expect(LED_CONTROL.defaultMidiRangeMin).toBe(0);
		expect(LED_CONTROL.defaultMidiRangeMax).toBe(127);
	});
});

describe("Control factory", () => {
	describe("getControl", () => {
		it("should return button control for valid button modes", () => {
			const trigger = getControl(
				MappingControlType.Button,
				MappingInteractionMode.Trigger,
			);
			expect(trigger).not.toBeNull();
			expect(trigger?.type).toBe(MappingControlType.Button);
			expect((trigger as ButtonControl).subtype).toBe("trigger");
		});

		it("should return fader control for valid fader modes", () => {
			const direct = getControl(
				MappingControlType.FaderOrKnob,
				MappingInteractionMode.Direct,
			);
			expect(direct).not.toBeNull();
			expect(direct?.type).toBe(MappingControlType.FaderOrKnob);
		});

		it("should return encoder control for valid encoder modes", () => {
			const encoder = getControl(
				MappingControlType.Encoder,
				MappingInteractionMode.Relative,
			);
			expect(encoder).not.toBeNull();
			expect(encoder?.type).toBe(MappingControlType.Encoder);
		});

		it("should return LED control for Output mode", () => {
			const led = getControl(
				MappingControlType.LED,
				MappingInteractionMode.Output,
			);
			expect(led).not.toBeNull();
			expect(led?.type).toBe(MappingControlType.LED);
		});

		it("should return null for invalid combinations", () => {
			expect(
				getControl(MappingControlType.Button, MappingInteractionMode.Output),
			).toBeNull();
			expect(
				getControl(MappingControlType.LED, MappingInteractionMode.Trigger),
			).toBeNull();
			expect(
				getControl(
					MappingControlType.FaderOrKnob,
					MappingInteractionMode.Toggle,
				),
			).toBeNull();
		});
	});

	describe("getDefaultControl", () => {
		it("should return default controls for each type", () => {
			expect(getDefaultControl(MappingControlType.Button).type).toBe(
				MappingControlType.Button,
			);
			expect(getDefaultControl(MappingControlType.FaderOrKnob).type).toBe(
				MappingControlType.FaderOrKnob,
			);
			expect(getDefaultControl(MappingControlType.Encoder).type).toBe(
				MappingControlType.Encoder,
			);
			expect(getDefaultControl(MappingControlType.LED).type).toBe(
				MappingControlType.LED,
			);
		});
	});

	describe("getAllowedModesForControlType", () => {
		it("should return correct modes for each control type", () => {
			expect(getAllowedModesForControlType(MappingControlType.Button)).toBe(
				BUTTON_ALLOWED_MODES,
			);
			expect(
				getAllowedModesForControlType(MappingControlType.FaderOrKnob),
			).toBe(FADER_ALLOWED_MODES);
			expect(getAllowedModesForControlType(MappingControlType.Encoder)).toBe(
				ENCODER_ALLOWED_MODES,
			);
			expect(getAllowedModesForControlType(MappingControlType.LED)).toBe(
				LED_ALLOWED_MODES,
			);
		});
	});

	describe("isValidControlModeCombo", () => {
		it("should return true for valid combinations", () => {
			expect(
				isValidControlModeCombo(
					MappingControlType.Button,
					MappingInteractionMode.Trigger,
				),
			).toBe(true);
			expect(
				isValidControlModeCombo(
					MappingControlType.FaderOrKnob,
					MappingInteractionMode.Direct,
				),
			).toBe(true);
			expect(
				isValidControlModeCombo(
					MappingControlType.LED,
					MappingInteractionMode.Output,
				),
			).toBe(true);
		});

		it("should return false for invalid combinations", () => {
			expect(
				isValidControlModeCombo(
					MappingControlType.Button,
					MappingInteractionMode.Output,
				),
			).toBe(false);
			expect(
				isValidControlModeCombo(
					MappingControlType.LED,
					MappingInteractionMode.Direct,
				),
			).toBe(false);
		});
	});

	describe("getAllControlTypes", () => {
		it("should return all control types", () => {
			const types = getAllControlTypes();
			expect(types).toHaveLength(4);
			expect(types).toContain(MappingControlType.Button);
			expect(types).toContain(MappingControlType.FaderOrKnob);
			expect(types).toContain(MappingControlType.Encoder);
			expect(types).toContain(MappingControlType.LED);
		});
	});

	describe("getAllInteractionModes", () => {
		it("should return all interaction modes", () => {
			const modes = getAllInteractionModes();
			expect(modes).toHaveLength(9);
			expect(modes).toContain(MappingInteractionMode.Trigger);
			expect(modes).toContain(MappingInteractionMode.Output);
		});
	});

	describe("getControlsForModes", () => {
		it("should return controls that support specific modes", () => {
			// Only Button supports Toggle
			const toggleControls = getControlsForModes([
				MappingInteractionMode.Toggle,
			]);
			expect(
				toggleControls.some((c) => c.type === MappingControlType.Button),
			).toBe(true);
			expect(
				toggleControls.some((c) => c.type === MappingControlType.FaderOrKnob),
			).toBe(false);

			// Both Fader and Encoder support Relative
			const relativeControls = getControlsForModes([
				MappingInteractionMode.Relative,
			]);
			expect(
				relativeControls.some((c) => c.type === MappingControlType.FaderOrKnob),
			).toBe(true);
			expect(
				relativeControls.some((c) => c.type === MappingControlType.Encoder),
			).toBe(true);

			// Only LED supports Output
			const outputControls = getControlsForModes([
				MappingInteractionMode.Output,
			]);
			expect(
				outputControls.some((c) => c.type === MappingControlType.LED),
			).toBe(true);
			expect(outputControls).toHaveLength(1);
		});
	});
});

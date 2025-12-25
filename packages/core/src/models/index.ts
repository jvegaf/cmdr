/**
 * Models Module - High-level domain models for TSI files
 *
 * AIDEV-NOTE: This module provides object-oriented wrappers around the raw
 * format structures, making it easier to work with TSI files in application code.
 *
 * The models are:
 * - TsiFile: Root container for all devices
 * - Device: A MIDI controller or keyboard with mappings
 * - Mapping: A single command binding with conditions and MIDI settings
 *
 * @example
 * import { TsiFile, Device, Mapping } from '@cmdr/core';
 *
 * // Load a TSI file
 * const tsi = TsiFile.fromXml(xmlContent);
 *
 * // Work with devices
 * for (const deviceData of tsi.devices) {
 *   const device = Device.fromRawData(deviceData);
 *   console.log(device.deviceType, device.mappingCount);
 *
 *   // Work with mappings
 *   for (const mapping of device.mappings) {
 *     console.log(mapping.commandName, mapping.comment);
 *   }
 * }
 */

// Device model
export {
	DEVICE_TYPE_GENERIC_KEYBOARD,
	DEVICE_TYPE_GENERIC_MIDI,
	Device,
	getDeviceTargetName,
	getDeviceTypeName,
	isGenericMidiDevice,
	PROPRIETARY_DEVICE_TYPES,
} from "./Device.js";

// Mapping model
export {
	createMidiNoteString,
	getControlTypeName,
	getInteractionModeName,
	getTargetDeckName,
	Mapping,
	type MappingCondition,
	type MidiBinding,
	parseMidiNoteString,
} from "./Mapping.js";

// TsiFile model (existing)
export {
	createEmptyTsiFile,
	getAllDevices,
	getTotalMappingCount,
	parseTsiFile,
	serializeTsiFile,
	TsiFile,
	type TsiFileData,
} from "./TsiFile.js";

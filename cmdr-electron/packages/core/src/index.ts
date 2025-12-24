/**
 * @cmdr/core - Core TSI file parsing library
 *
 * AIDEV-NOTE: This is the main entry point for the core library.
 * The library provides:
 * - Binary reading/writing utilities for TSI format (Big Endian)
 * - TSI file parsing and serialization
 * - Domain models for Mappings, Devices, Commands, Conditions
 * - Command metadata system for all ~500 Traktor commands
 * - Condition metadata system for all ~80 Traktor conditions
 *
 * TSI Format Overview:
 * - TSI files are XML with Base64-encoded binary data in CDATA sections
 * - Binary format uses Big Endian byte order
 * - Frame-based structure with 4-char FourCC identifiers
 */

// Binary utilities
export { BinaryReader } from "./binary/BinaryReader.js";
export { BinaryWriter } from "./binary/BinaryWriter.js";

// Commands
export * from "./commands/index.js";

// Conditions
export * from "./conditions/index.js";

// FX Settings
export * from "./fx/index.js";

// Enums
export * from "./enums/index.js";
export {
	createDefaultDevice,
	createDeviceFrame,
	DEVICE_FRAME_ID,
	type DeviceData,
	parseDevice,
	parseDeviceFromFrame,
	writeDevice,
} from "./format/Device.js";
export {
	createDefaultDeviceData,
	createDeviceDataFrame,
	DEFAULT_PORT,
	DEVICE_DATA_FRAME_ID,
	type DeviceDataData,
	type DevicePortsData,
	type DeviceTargetInfoData,
	type DvstData,
	EncoderMode,
	MidiControlType,
	type MidiDefinitionData,
	type MidiDefinitionsContainerData,
	parseDeviceData,
	parseDeviceDataFromFrame,
	type VersionInfoData,
	writeDeviceData,
} from "./format/DeviceData.js";
export {
	createDeviceMappingsContainerFrame,
	createEmptyDeviceMappingsContainer,
	DEVICE_MAPPINGS_CONTAINER_FRAME_ID,
	DEVICES_LIST_FRAME_ID,
	type DeviceMappingsContainerData,
	DIOI_FRAME_ID,
	type DioiData,
	parseDeviceMappingsContainer,
	parseDeviceMappingsContainerFromBase64,
	parseDeviceMappingsContainerFromFrame,
	serializeDeviceMappingsContainerToBase64,
	writeDeviceMappingsContainer,
} from "./format/DeviceMappingsContainer.js";
// Format structures
export { Frame, type FrameHeader } from "./format/Frame.js";
export {
	createDefaultMapping,
	createMappingFrame,
	MAPPING_FRAME_ID,
	type MappingData,
	parseMapping,
	parseMappingFromFrame,
	writeMapping,
} from "./format/Mapping.js";
export {
	createDefaultMappingSettings,
	createMappingSettingsFrame,
	MAPPING_SETTINGS_FRAME_ID,
	type MappingSettingsData,
	parseMappingSettings,
	parseMappingSettingsFromFrame,
	writeMappingSettings,
} from "./format/MappingSettings.js";
export {
	createEmptyMappingsContainer,
	createMappingsContainerFrame,
	MAPPINGS_CONTAINER_FRAME_ID,
	MAPPINGS_LIST_FRAME_ID,
	type MappingsContainerData,
	MIDI_NOTE_BINDING_LIST_FRAME_ID,
	parseMappingsContainer,
	parseMappingsContainerFromFrame,
	writeMappingsContainer,
} from "./format/MappingsContainer.js";
export {
	createDefaultMidiNoteBinding,
	createMidiNoteBindingFrame,
	MIDI_NOTE_BINDING_FRAME_ID,
	type MidiNoteBindingData,
	parseMidiNoteBinding,
	parseMidiNoteBindingFromFrame,
	writeMidiNoteBinding,
} from "./format/MidiNoteBinding.js";
// High-level models
export {
	createEmptyTsiFile,
	getAllDevices,
	getTotalMappingCount,
	parseTsiFile,
	serializeTsiFile,
	TsiFile,
	type TsiFileData,
} from "./models/TsiFile.js";
// Utils
export { FourCC } from "./utils/FourCC.js";
// XML parsing
export {
	buildTsiXml,
	parseTsiXml,
	readTsiFile,
	type TsiXmlData,
	type TsiXmlEntry,
} from "./xml/TsiXmlParser.js";

/**
 * @cmdr/core - Core TSI file parsing library
 *
 * AIDEV-NOTE: This is the main entry point for the core library.
 * The library provides:
 * - Binary reading/writing utilities for TSI format (Big Endian)
 * - TSI file parsing and serialization
 * - Domain models for Mappings, Devices, Commands, Conditions
 *
 * TSI Format Overview:
 * - TSI files are XML with Base64-encoded binary data in CDATA sections
 * - Binary format uses Big Endian byte order
 * - Frame-based structure with 4-char FourCC identifiers
 */

// Binary utilities
export { BinaryReader } from './binary/BinaryReader.js';
export { BinaryWriter } from './binary/BinaryWriter.js';

// Enums
export * from './enums/index.js';

// Format structures
export { Frame, type FrameHeader } from './format/Frame.js';
export {
  type MappingSettingsData,
  parseMappingSettings,
  writeMappingSettings,
  createMappingSettingsFrame,
  createDefaultMappingSettings,
  MAPPING_SETTINGS_FRAME_ID,
} from './format/MappingSettings.js';
export {
  type MappingData,
  parseMapping,
  writeMapping,
  createMappingFrame,
  createDefaultMapping,
  MAPPING_FRAME_ID,
} from './format/Mapping.js';
export {
  type MidiNoteBindingData,
  parseMidiNoteBinding,
  writeMidiNoteBinding,
  createMidiNoteBindingFrame,
  createDefaultMidiNoteBinding,
  MIDI_NOTE_BINDING_FRAME_ID,
} from './format/MidiNoteBinding.js';
export {
  type MappingsContainerData,
  parseMappingsContainer,
  writeMappingsContainer,
  createMappingsContainerFrame,
  createEmptyMappingsContainer,
  MAPPINGS_CONTAINER_FRAME_ID,
  MAPPINGS_LIST_FRAME_ID,
  MIDI_NOTE_BINDING_LIST_FRAME_ID,
} from './format/MappingsContainer.js';
export {
  type DeviceDataData,
  type DeviceTargetInfoData,
  type VersionInfoData,
  type DevicePortsData,
  type MidiDefinitionData,
  type MidiDefinitionsContainerData,
  type DvstData,
  parseDeviceData,
  writeDeviceData,
  createDeviceDataFrame,
  createDefaultDeviceData,
  DEVICE_DATA_FRAME_ID,
  DEFAULT_PORT,
  MidiControlType,
  EncoderMode,
} from './format/DeviceData.js';
export {
  type DeviceData,
  parseDevice,
  writeDevice,
  createDeviceFrame,
  createDefaultDevice,
  DEVICE_FRAME_ID,
} from './format/Device.js';
export {
  type DeviceMappingsContainerData,
  type DioiData,
  parseDeviceMappingsContainer,
  parseDeviceMappingsContainerFromBase64,
  writeDeviceMappingsContainer,
  createDeviceMappingsContainerFrame,
  serializeDeviceMappingsContainerToBase64,
  createEmptyDeviceMappingsContainer,
  DEVICE_MAPPINGS_CONTAINER_FRAME_ID,
  DIOI_FRAME_ID,
  DEVICES_LIST_FRAME_ID,
} from './format/DeviceMappingsContainer.js';

// XML parsing
export {
  type TsiXmlEntry,
  type TsiXmlData,
  parseTsiXml,
  buildTsiXml,
  readTsiFile,
} from './xml/TsiXmlParser.js';

// High-level models
export {
  TsiFile,
  type TsiFileData,
  createEmptyTsiFile,
  parseTsiFile,
  serializeTsiFile,
  getAllDevices,
  getTotalMappingCount,
} from './models/TsiFile.js';

// Utils
export { FourCC } from './utils/FourCC.js';

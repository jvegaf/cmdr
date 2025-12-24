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

// Format structures
export { Frame, type FrameHeader } from './format/Frame.js';

// Models (to be implemented)
// export { TsiFile } from './models/TsiFile.js';
// export { Device } from './models/Device.js';
// export { Mapping } from './models/Mapping.js';

// Utils
export { FourCC } from './utils/FourCC.js';

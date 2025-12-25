/**
 * TsiFile - High-level model for TSI files
 *
 * AIDEV-NOTE: This is the main entry point for loading and saving TSI files.
 * It combines the XML parsing (TsiXmlParser) with the binary format parsing
 * (DeviceMappingsContainer) to provide a unified interface.
 *
 * TSI files have this structure:
 * - XML wrapper containing Base64-encoded binary data
 * - Binary data contains device mappings (DIOM frame)
 *
 * Usage:
 *   const tsi = await TsiFile.load('/path/to/file.tsi');
 *   console.log(tsi.devices);
 *   tsi.save('/path/to/output.tsi');
 */

import { BinaryReader } from '../binary/BinaryReader.js';
import { BinaryWriter } from '../binary/BinaryWriter.js';
import type { DeviceData } from '../format/Device.js';
import {
  createDeviceMappingsContainerFrame,
  type DeviceMappingsContainerData,
  DEVICE_MAPPINGS_CONTAINER_FRAME_ID,
  parseDeviceMappingsContainer,
} from '../format/DeviceMappingsContainer.js';
import { Frame } from '../format/Frame.js';
import { buildTsiXml, parseTsiXml, type TsiXmlData } from '../xml/TsiXmlParser.js';

/**
 * TsiFile represents a complete TSI file with devices and mappings
 */
export interface TsiFileData {
  /**
   * Controller devices and their mappings
   */
  controllerDevices: DeviceData[];

  /**
   * Keyboard devices and their mappings
   */
  keyboardDevices: DeviceData[];

  /**
   * Traktor version string (e.g., "3.11.0")
   */
  traktorVersion: string | null;

  /**
   * Raw XML entries for preservation during save
   */
  rawXmlEntries: TsiXmlData['entries'];
}

/**
 * Create an empty TsiFile
 */
export function createEmptyTsiFile(): TsiFileData {
  return {
    controllerDevices: [],
    keyboardDevices: [],
    traktorVersion: null,
    rawXmlEntries: new Map(),
  };
}

/**
 * Parse binary data from Base64 string
 */
function parseBinaryFromBase64(base64Data: string): DeviceMappingsContainerData {
  const reader = BinaryReader.fromBase64(base64Data);

  // Read the root DIOM frame
  const diomHeader = Frame.readHeader(reader);
  if (diomHeader.fourCC !== DEVICE_MAPPINGS_CONTAINER_FRAME_ID) {
    throw new Error(`Expected DIOM frame, got ${diomHeader.fourCC}`);
  }

  const diomReader = reader.slice(diomHeader.size);
  return parseDeviceMappingsContainer(diomReader);
}

/**
 * Serialize binary data to Base64 string
 */
function serializeBinaryToBase64(data: DeviceMappingsContainerData): string {
  const writer = new BinaryWriter();

  // Write the root DIOM frame
  const diomFrame = createDeviceMappingsContainerFrame(data);
  diomFrame.writeTo(writer);

  return writer.toBase64();
}

/**
 * Parse a TSI file from XML content
 */
export function parseTsiFile(xmlContent: string): TsiFileData {
  const xmlData = parseTsiXml(xmlContent);

  const result: TsiFileData = {
    controllerDevices: [],
    keyboardDevices: [],
    traktorVersion: xmlData.traktorVersion,
    rawXmlEntries: xmlData.entries,
  };

  // Parse controller data if present
  if (xmlData.controllerData) {
    try {
      const controllerContainer = parseBinaryFromBase64(xmlData.controllerData);
      result.controllerDevices = controllerContainer.devices.map((d) => ({
        ...d,
        isKeyboard: false,
      }));
    } catch (error) {
      console.error('Failed to parse controller data:', error);
      // Continue with empty devices
    }
  }

  // Parse keyboard data if present
  if (xmlData.keyboardData) {
    try {
      const keyboardContainer = parseBinaryFromBase64(xmlData.keyboardData);
      result.keyboardDevices = keyboardContainer.devices.map((d) => ({
        ...d,
        isKeyboard: true,
      }));
    } catch (error) {
      console.error('Failed to parse keyboard data:', error);
      // Continue with empty devices
    }
  }

  return result;
}

/**
 * Serialize a TSI file to XML content
 */
export function serializeTsiFile(tsiFile: TsiFileData): string {
  // Build controller binary data
  let controllerData: string | null = null;
  if (tsiFile.controllerDevices.length > 0) {
    const controllerContainer: DeviceMappingsContainerData = {
      dioi: { unknown: 1 },
      devices: tsiFile.controllerDevices,
    };
    controllerData = serializeBinaryToBase64(controllerContainer);
  }

  // Build keyboard binary data
  let keyboardData: string | null = null;
  if (tsiFile.keyboardDevices.length > 0) {
    const keyboardContainer: DeviceMappingsContainerData = {
      dioi: { unknown: 1 },
      devices: tsiFile.keyboardDevices,
    };
    keyboardData = serializeBinaryToBase64(keyboardContainer);
  }

  // Build XML
  const xmlData: TsiXmlData = {
    controllerData,
    keyboardData,
    traktorVersion: tsiFile.traktorVersion,
    entries: tsiFile.rawXmlEntries,
  };

  return buildTsiXml(xmlData);
}

/**
 * Get all devices (both controller and keyboard)
 */
export function getAllDevices(tsiFile: TsiFileData): DeviceData[] {
  return [...tsiFile.controllerDevices, ...tsiFile.keyboardDevices];
}

/**
 * Get total mapping count across all devices
 */
export function getTotalMappingCount(tsiFile: TsiFileData): number {
  let count = 0;
  for (const device of getAllDevices(tsiFile)) {
    count += device.data.mappings?.mappings.length ?? 0;
  }
  return count;
}

/**
 * TsiFile class - Object-oriented wrapper around TsiFileData
 * Provides convenient methods for file operations
 */
export class TsiFile {
  private data: TsiFileData;

  constructor(data?: TsiFileData) {
    this.data = data ?? createEmptyTsiFile();
  }

  /**
   * Parse TSI from XML string
   */
  static fromXml(xmlContent: string): TsiFile {
    return new TsiFile(parseTsiFile(xmlContent));
  }

  /**
   * Create empty TSI file
   */
  static create(): TsiFile {
    return new TsiFile(createEmptyTsiFile());
  }

  /**
   * Get all controller devices
   */
  get controllerDevices(): DeviceData[] {
    return this.data.controllerDevices;
  }

  /**
   * Get all keyboard devices
   */
  get keyboardDevices(): DeviceData[] {
    return this.data.keyboardDevices;
  }

  /**
   * Get all devices (controller + keyboard)
   */
  get devices(): DeviceData[] {
    return getAllDevices(this.data);
  }

  /**
   * Get Traktor version
   */
  get traktorVersion(): string | null {
    return this.data.traktorVersion;
  }

  /**
   * Get total mapping count
   */
  get mappingCount(): number {
    return getTotalMappingCount(this.data);
  }

  /**
   * Serialize to XML string
   */
  toXml(): string {
    return serializeTsiFile(this.data);
  }

  /**
   * Get the underlying data
   */
  getData(): TsiFileData {
    return this.data;
  }

  /**
   * Add a controller device
   */
  addControllerDevice(device: DeviceData): void {
    this.data.controllerDevices.push({ ...device, isKeyboard: false });
  }

  /**
   * Add a keyboard device
   */
  addKeyboardDevice(device: DeviceData): void {
    this.data.keyboardDevices.push({ ...device, isKeyboard: true });
  }

  /**
   * Remove a device by index from controller devices
   */
  removeControllerDevice(index: number): void {
    this.data.controllerDevices.splice(index, 1);
  }

  /**
   * Remove a device by index from keyboard devices
   */
  removeKeyboardDevice(index: number): void {
    this.data.keyboardDevices.splice(index, 1);
  }
}

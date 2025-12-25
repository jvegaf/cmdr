/**
 * Device - Parse DEVI frame data
 *
 * AIDEV-NOTE: This is the TypeScript equivalent of Device.cs.
 * A Device represents a MIDI controller or keyboard in the TSI file.
 *
 * Structure:
 * - DeviceType: String identifying the device (e.g., "Generic MIDI", "Traktor Kontrol S4 MK3")
 * - Data: The DeviceData (DDAT frame) containing all device configuration
 */

import type { BinaryReader } from '../binary/BinaryReader.js';
import type { BinaryWriter } from '../binary/BinaryWriter.js';
import {
  createDeviceDataFrame,
  createDefaultDeviceData,
  DEVICE_DATA_FRAME_ID,
  type DeviceDataData,
  parseDeviceData,
} from './DeviceData.js';
import { Frame } from './Frame.js';

/**
 * Frame ID for Device
 */
export const DEVICE_FRAME_ID = 'DEVI';

/**
 * Data structure for Device
 */
export interface DeviceData {
  /**
   * Device type identifier string
   * Examples: "Generic MIDI", "Traktor Kontrol S4 MK3", "Keyboard"
   */
  deviceType: string;

  /**
   * Whether this device is a keyboard device
   * Keyboard devices have special handling in Traktor
   */
  isKeyboard: boolean;

  /**
   * All device configuration data
   */
  data: DeviceDataData;
}

/**
 * Create default Device data
 */
export function createDefaultDevice(
  deviceType = 'Generic MIDI',
  traktorVersion = '',
  isKeyboard = false
): DeviceData {
  return {
    deviceType,
    isKeyboard,
    data: createDefaultDeviceData(traktorVersion),
  };
}

/**
 * Parse Device from a BinaryReader
 * Reader should be positioned at start of DEVI frame data (after header)
 */
export function parseDevice(reader: BinaryReader): DeviceData {
  const deviceType = reader.readWideString();

  // Read the nested DDAT frame
  const dataHeader = Frame.readHeader(reader);
  if (dataHeader.fourCC !== DEVICE_DATA_FRAME_ID) {
    throw new Error(`Expected DDAT frame inside DEVI, got ${dataHeader.fourCC}`);
  }

  const dataReader = reader.slice(dataHeader.size);
  const data = parseDeviceData(dataReader);

  return {
    deviceType,
    isKeyboard: false, // AIDEV-NOTE: isKeyboard is not stored in binary, determined by context
    data,
  };
}

/**
 * Parse Device from a Frame
 */
export function parseDeviceFromFrame(frame: Frame): DeviceData {
  if (frame.fourCC !== DEVICE_FRAME_ID) {
    throw new Error(`Expected DEVI frame, got ${frame.fourCC}`);
  }
  return parseDevice(frame.getReader());
}

/**
 * Write Device to a BinaryWriter
 */
export function writeDevice(writer: BinaryWriter, device: DeviceData): void {
  writer.writeWideString(device.deviceType);

  // Write the nested DDAT frame
  const dataFrame = createDeviceDataFrame(device.data);
  dataFrame.writeTo(writer);
}

/**
 * Create a DEVI frame from Device data
 */
export function createDeviceFrame(device: DeviceData): Frame {
  return Frame.create(DEVICE_FRAME_ID, (writer) => {
    writeDevice(writer, device);
  });
}

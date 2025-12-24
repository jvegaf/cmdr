/**
 * DeviceMappingsContainer - Parse DIOM root frame
 *
 * AIDEV-NOTE: This is the TypeScript equivalent of DeviceMappingsContainer.cs.
 * The DIOM frame is the root container for all device mappings in a TSI file.
 *
 * Structure:
 * - DIOI: Header frame with version/unknown field
 * - DEVS: DevicesList containing all devices
 */

import { BinaryReader } from '../binary/BinaryReader.js';
import { BinaryWriter } from '../binary/BinaryWriter.js';
import {
  createDeviceFrame,
  type DeviceData,
  DEVICE_FRAME_ID,
  parseDevice,
} from './Device.js';
import { Frame } from './Frame.js';

/**
 * Frame ID for DeviceMappingsContainer (root)
 */
export const DEVICE_MAPPINGS_CONTAINER_FRAME_ID = 'DIOM';

/**
 * Frame ID for DIOI header
 */
export const DIOI_FRAME_ID = 'DIOI';

/**
 * Frame ID for DevicesList
 */
export const DEVICES_LIST_FRAME_ID = 'DEVS';

/**
 * DIOI header data
 */
export interface DioiData {
  /**
   * Unknown field, always seems to be 1
   */
  unknown: number;
}

/**
 * Data structure for DeviceMappingsContainer
 */
export interface DeviceMappingsContainerData {
  dioi: DioiData;
  devices: DeviceData[];
}

/**
 * Create empty DeviceMappingsContainer data
 */
export function createEmptyDeviceMappingsContainer(): DeviceMappingsContainerData {
  return {
    dioi: { unknown: 1 },
    devices: [],
  };
}

/**
 * Parse list of devices from a BinaryReader
 */
function parseDevicesList(reader: BinaryReader): DeviceData[] {
  const count = reader.readInt32();
  const devices: DeviceData[] = [];

  for (let i = 0; i < count; i++) {
    const header = Frame.readHeader(reader);
    if (header.fourCC !== DEVICE_FRAME_ID) {
      throw new Error(`Expected DEVI frame, got ${header.fourCC}`);
    }
    const deviceReader = reader.slice(header.size);
    devices.push(parseDevice(deviceReader));
  }

  return devices;
}

/**
 * Parse DeviceMappingsContainer from a BinaryReader
 * This is the entry point for parsing the binary data from a TSI file
 */
export function parseDeviceMappingsContainer(reader: BinaryReader): DeviceMappingsContainerData {
  // Read DIOI frame (header)
  const dioiHeader = Frame.readHeader(reader);
  if (dioiHeader.fourCC !== DIOI_FRAME_ID) {
    throw new Error(`Expected DIOI frame, got ${dioiHeader.fourCC}`);
  }
  const dioiReader = reader.slice(dioiHeader.size);
  const unknown = dioiReader.readInt32();

  // Read DEVS frame (devices list)
  const devsHeader = Frame.readHeader(reader);
  if (devsHeader.fourCC !== DEVICES_LIST_FRAME_ID) {
    throw new Error(`Expected DEVS frame, got ${devsHeader.fourCC}`);
  }
  const devsReader = reader.slice(devsHeader.size);
  const devices = parseDevicesList(devsReader);

  return {
    dioi: { unknown },
    devices,
  };
}

/**
 * Parse DeviceMappingsContainer from a Frame
 */
export function parseDeviceMappingsContainerFromFrame(frame: Frame): DeviceMappingsContainerData {
  if (frame.fourCC !== DEVICE_MAPPINGS_CONTAINER_FRAME_ID) {
    throw new Error(`Expected DIOM frame, got ${frame.fourCC}`);
  }
  return parseDeviceMappingsContainer(frame.getReader());
}

/**
 * Parse DeviceMappingsContainer from Base64-encoded binary data
 * This is the main entry point when loading from TSI XML
 */
export function parseDeviceMappingsContainerFromBase64(base64Data: string): DeviceMappingsContainerData {
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
 * Write DeviceMappingsContainer to a BinaryWriter
 */
export function writeDeviceMappingsContainer(
  writer: BinaryWriter,
  data: DeviceMappingsContainerData
): void {
  // Write DIOI frame
  const dioiFrame = Frame.create(DIOI_FRAME_ID, (w) => {
    w.writeInt32(data.dioi.unknown);
  });
  dioiFrame.writeTo(writer);

  // Write DEVS frame
  const devsFrame = Frame.create(DEVICES_LIST_FRAME_ID, (w) => {
    w.writeInt32(data.devices.length);
    for (const device of data.devices) {
      const deviceFrame = createDeviceFrame(device);
      deviceFrame.writeTo(w);
    }
  });
  devsFrame.writeTo(writer);
}

/**
 * Create a DIOM frame from DeviceMappingsContainer data
 */
export function createDeviceMappingsContainerFrame(
  data: DeviceMappingsContainerData
): Frame {
  return Frame.create(DEVICE_MAPPINGS_CONTAINER_FRAME_ID, (writer) => {
    writeDeviceMappingsContainer(writer, data);
  });
}

/**
 * Serialize DeviceMappingsContainer to Base64-encoded binary data
 * This is the main entry point when saving to TSI XML
 */
export function serializeDeviceMappingsContainerToBase64(
  data: DeviceMappingsContainerData
): string {
  const writer = new BinaryWriter();

  // Write the root DIOM frame
  const diomFrame = createDeviceMappingsContainerFrame(data);
  diomFrame.writeTo(writer);

  return writer.toBase64();
}

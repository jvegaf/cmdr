/**
 * Frame - TSI binary format frame structure
 *
 * AIDEV-NOTE: This is the TypeScript equivalent of Frame.cs from the WPF version.
 * TSI binary data is organized in frames, each with:
 * - 4-byte FourCC identifier
 * - 4-byte size (Big Endian, size of data excluding header)
 * - Variable-length data
 *
 * Frames can be nested (container frames contain other frames).
 */

import { BinaryReader } from '../binary/BinaryReader.js';
import { BinaryWriter } from '../binary/BinaryWriter.js';
import { isValidFourCC } from '../utils/FourCC.js';

/**
 * Frame header structure
 */
export interface FrameHeader {
  fourCC: string;
  size: number;
}

/**
 * Frame reading and writing utilities for TSI binary format
 */
export class Frame {
  /**
   * Size of frame header in bytes (FourCC + Size)
   */
  static readonly HEADER_SIZE = 8;

  readonly fourCC: string;
  readonly data: Uint8Array;

  constructor(fourCC: string, data: Uint8Array) {
    if (!isValidFourCC(fourCC)) {
      throw new Error(`Invalid FourCC: "${fourCC}"`);
    }
    this.fourCC = fourCC;
    this.data = data;
  }

  /**
   * Get the total size of this frame including header
   */
  get totalSize(): number {
    return Frame.HEADER_SIZE + this.data.length;
  }

  /**
   * Create a BinaryReader for this frame's data
   */
  getReader(): BinaryReader {
    return BinaryReader.fromUint8Array(this.data);
  }

  /**
   * Read a frame header without consuming the data
   */
  static readHeader(reader: BinaryReader): FrameHeader {
    const fourCC = reader.readFourCC();
    const size = reader.readUInt32();
    return { fourCC, size };
  }

  /**
   * Peek at frame header without advancing position
   */
  static peekHeader(reader: BinaryReader): FrameHeader {
    const startPos = reader.offset;
    const header = Frame.readHeader(reader);
    reader.seek(startPos);
    return header;
  }

  /**
   * Read a complete frame (header + data)
   */
  static read(reader: BinaryReader): Frame {
    const header = Frame.readHeader(reader);
    const data = reader.readBytes(header.size);
    return new Frame(header.fourCC, data);
  }

  /**
   * Read a frame and verify its FourCC matches expected
   */
  static readExpected(reader: BinaryReader, expectedFourCC: string): Frame {
    const frame = Frame.read(reader);
    if (frame.fourCC !== expectedFourCC) {
      throw new Error(`Expected frame "${expectedFourCC}" but got "${frame.fourCC}"`);
    }
    return frame;
  }

  /**
   * Skip a frame (read header and skip data)
   */
  static skip(reader: BinaryReader): FrameHeader {
    const header = Frame.readHeader(reader);
    reader.skip(header.size);
    return header;
  }

  /**
   * Read all child frames from a container frame
   */
  static readChildren(reader: BinaryReader): Frame[] {
    const frames: Frame[] = [];
    while (!reader.isEof) {
      frames.push(Frame.read(reader));
    }
    return frames;
  }

  /**
   * Read all child frames matching a specific FourCC
   */
  static readChildrenByType(reader: BinaryReader, fourCC: string): Frame[] {
    const frames: Frame[] = [];
    while (!reader.isEof) {
      const header = Frame.peekHeader(reader);
      if (header.fourCC === fourCC) {
        frames.push(Frame.read(reader));
      } else {
        Frame.skip(reader);
      }
    }
    return frames;
  }

  /**
   * Write a frame to a BinaryWriter
   */
  static write(writer: BinaryWriter, fourCC: string, data: Uint8Array): void {
    writer.writeFourCC(fourCC);
    writer.writeUInt32(data.length);
    writer.writeBytes(data);
  }

  /**
   * Write this frame to a BinaryWriter
   */
  writeTo(writer: BinaryWriter): void {
    Frame.write(writer, this.fourCC, this.data);
  }

  /**
   * Create a frame with data from a callback that writes to a BinaryWriter
   */
  static create(fourCC: string, writeData: (writer: BinaryWriter) => void): Frame {
    const dataWriter = new BinaryWriter();
    writeData(dataWriter);
    return new Frame(fourCC, dataWriter.toUint8Array());
  }

  /**
   * Create a container frame with child frames
   */
  static createContainer(fourCC: string, children: Frame[]): Frame {
    const dataWriter = new BinaryWriter();
    for (const child of children) {
      child.writeTo(dataWriter);
    }
    return new Frame(fourCC, dataWriter.toUint8Array());
  }
}

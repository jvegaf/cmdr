/**
 * BinaryWriter - Writes binary data to a buffer with Big Endian byte order
 *
 * AIDEV-NOTE: This is the TypeScript equivalent of Writer.cs from the WPF version.
 * Uses a dynamically growing buffer to handle unknown final sizes.
 * All multi-byte values are written in Big Endian byte order.
 */
export class BinaryWriter {
  private buffer: ArrayBuffer;
  private dataView: DataView;
  private position: number = 0;
  private capacity: number;

  private static readonly INITIAL_CAPACITY = 1024;
  private static readonly GROWTH_FACTOR = 2;

  constructor(initialCapacity: number = BinaryWriter.INITIAL_CAPACITY) {
    this.capacity = initialCapacity;
    this.buffer = new ArrayBuffer(initialCapacity);
    this.dataView = new DataView(this.buffer);
  }

  /**
   * Current write position (also the current length of written data)
   */
  get length(): number {
    return this.position;
  }

  /**
   * Current position in the buffer
   */
  get offset(): number {
    return this.position;
  }

  /**
   * Seek to an absolute position (for overwriting data)
   */
  seek(position: number): void {
    if (position < 0) {
      throw new RangeError(`Seek position ${position} cannot be negative`);
    }
    this.ensureCapacity(position);
    this.position = position;
  }

  /**
   * Write a single byte (UInt8)
   */
  writeByte(value: number): void {
    this.ensureCapacity(this.position + 1);
    this.dataView.setUint8(this.position, value & 0xff);
    this.position += 1;
  }

  /**
   * Write a signed byte (Int8)
   */
  writeSByte(value: number): void {
    this.ensureCapacity(this.position + 1);
    this.dataView.setInt8(this.position, value);
    this.position += 1;
  }

  /**
   * Write an unsigned 16-bit integer (Big Endian)
   */
  writeUInt16(value: number): void {
    this.ensureCapacity(this.position + 2);
    this.dataView.setUint16(this.position, value & 0xffff, false);
    this.position += 2;
  }

  /**
   * Write a signed 16-bit integer (Big Endian)
   */
  writeInt16(value: number): void {
    this.ensureCapacity(this.position + 2);
    this.dataView.setInt16(this.position, value, false);
    this.position += 2;
  }

  /**
   * Write an unsigned 32-bit integer (Big Endian)
   */
  writeUInt32(value: number): void {
    this.ensureCapacity(this.position + 4);
    this.dataView.setUint32(this.position, value >>> 0, false);
    this.position += 4;
  }

  /**
   * Write a signed 32-bit integer (Big Endian)
   */
  writeInt32(value: number): void {
    this.ensureCapacity(this.position + 4);
    this.dataView.setInt32(this.position, value, false);
    this.position += 4;
  }

  /**
   * Write an unsigned 64-bit integer (Big Endian)
   */
  writeUInt64(value: bigint): void {
    this.ensureCapacity(this.position + 8);
    this.dataView.setBigUint64(this.position, value, false);
    this.position += 8;
  }

  /**
   * Write a signed 64-bit integer (Big Endian)
   */
  writeInt64(value: bigint): void {
    this.ensureCapacity(this.position + 8);
    this.dataView.setBigInt64(this.position, value, false);
    this.position += 8;
  }

  /**
   * Write a 32-bit floating point number (Big Endian)
   */
  writeFloat(value: number): void {
    this.ensureCapacity(this.position + 4);
    this.dataView.setFloat32(this.position, value, false);
    this.position += 4;
  }

  /**
   * Write a 64-bit floating point number (Big Endian)
   */
  writeDouble(value: number): void {
    this.ensureCapacity(this.position + 8);
    this.dataView.setFloat64(this.position, value, false);
    this.position += 8;
  }

  /**
   * Write a boolean (1 byte, true = 1, false = 0)
   */
  writeBoolean(value: boolean): void {
    this.writeByte(value ? 1 : 0);
  }

  /**
   * Write raw bytes
   */
  writeBytes(bytes: Uint8Array): void {
    this.ensureCapacity(this.position + bytes.length);
    const target = new Uint8Array(this.buffer, this.position, bytes.length);
    target.set(bytes);
    this.position += bytes.length;
  }

  /**
   * Write a 4-character FourCC code
   */
  writeFourCC(fourCC: string): void {
    if (fourCC.length !== 4) {
      throw new Error(`FourCC must be exactly 4 characters, got "${fourCC}"`);
    }
    const bytes = new Uint8Array(4);
    for (let i = 0; i < 4; i++) {
      bytes[i] = fourCC.charCodeAt(i);
    }
    this.writeBytes(bytes);
  }

  /**
   * Write a UTF-16 Big Endian string with a 32-bit length prefix
   * AIDEV-NOTE: TSI uses UTF-16 BE strings with length prefix (count of UTF-16 code units)
   */
  writeWideString(value: string): void {
    this.writeUInt32(value.length); // Number of UTF-16 code units

    if (value.length === 0) {
      return;
    }

    this.ensureCapacity(this.position + value.length * 2);
    for (let i = 0; i < value.length; i++) {
      this.dataView.setUint16(this.position, value.charCodeAt(i), false);
      this.position += 2;
    }
  }

  /**
   * Write a length-prefixed UTF-8 string (32-bit length prefix)
   */
  writeString(value: string): void {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(value);
    this.writeUInt32(bytes.length);
    if (bytes.length > 0) {
      this.writeBytes(bytes);
    }
  }

  /**
   * Write an ASCII string (no length prefix)
   * AIDEV-NOTE: Used by DVST frame for writing XML content. ASCII is single-byte encoding.
   * Characters outside ASCII range (0-127) will be truncated to their lower byte.
   */
  writeAsciiString(value: string): void {
    if (value.length === 0) {
      return;
    }

    const bytes = new Uint8Array(value.length);
    for (let i = 0; i < value.length; i++) {
      // Mask to 7-bit ASCII (0-127), though technically we allow full byte
      bytes[i] = value.charCodeAt(i) & 0xff;
    }
    this.writeBytes(bytes);
  }

  /**
   * Get the final buffer (trimmed to actual data length)
   */
  toArrayBuffer(): ArrayBuffer {
    return this.buffer.slice(0, this.position);
  }

  /**
   * Get the final data as Uint8Array
   */
  toUint8Array(): Uint8Array {
    return new Uint8Array(this.toArrayBuffer());
  }

  /**
   * Get the final data as Base64 string
   */
  toBase64(): string {
    const bytes = this.toUint8Array();
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      if (byte !== undefined) {
        binary += String.fromCharCode(byte);
      }
    }
    return btoa(binary);
  }

  /**
   * Reserve space and return the position (useful for writing size fields later)
   */
  reserve(count: number): number {
    const pos = this.position;
    this.ensureCapacity(this.position + count);
    this.position += count;
    return pos;
  }

  /**
   * Write a UInt32 at a specific position (without moving current position)
   */
  writeUInt32At(position: number, value: number): void {
    if (position + 4 > this.position) {
      throw new RangeError(`Cannot write at position ${position}, current length is ${this.position}`);
    }
    this.dataView.setUint32(position, value >>> 0, false);
  }

  private ensureCapacity(required: number): void {
    if (required <= this.capacity) {
      return;
    }

    // Grow buffer
    let newCapacity = this.capacity;
    while (newCapacity < required) {
      newCapacity *= BinaryWriter.GROWTH_FACTOR;
    }

    const newBuffer = new ArrayBuffer(newCapacity);
    const newUint8 = new Uint8Array(newBuffer);
    const oldUint8 = new Uint8Array(this.buffer, 0, this.position);
    newUint8.set(oldUint8);

    this.buffer = newBuffer;
    this.dataView = new DataView(newBuffer);
    this.capacity = newCapacity;
  }
}

/**
 * BinaryReader - Reads binary data from an ArrayBuffer with Big Endian byte order
 *
 * AIDEV-NOTE: This is the TypeScript equivalent of StreamExtensions.cs from the WPF version.
 * TSI files use Big Endian byte order, so all multi-byte reads must swap bytes on little-endian systems.
 *
 * Key differences from .NET BinaryReader:
 * - JavaScript uses little-endian by default, we explicitly use Big Endian
 * - We use DataView for controlled byte order access
 * - Position is tracked manually
 */
export class BinaryReader {
  private readonly dataView: DataView;
  private readonly buffer: ArrayBuffer;
  private position: number = 0;

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.dataView = new DataView(buffer);
  }

  /**
   * Creates a BinaryReader from a Uint8Array
   */
  static fromUint8Array(bytes: Uint8Array): BinaryReader {
    // Ensure we have a proper ArrayBuffer (not a view into a larger buffer)
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    return new BinaryReader(buffer);
  }

  /**
   * Creates a BinaryReader from a Base64-encoded string
   */
  static fromBase64(base64: string): BinaryReader {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new BinaryReader(bytes.buffer);
  }

  /**
   * Current position in the buffer
   */
  get offset(): number {
    return this.position;
  }

  /**
   * Total length of the buffer
   */
  get length(): number {
    return this.buffer.byteLength;
  }

  /**
   * Remaining bytes available to read
   */
  get remaining(): number {
    return this.length - this.position;
  }

  /**
   * Whether we've reached the end of the buffer
   */
  get isEof(): boolean {
    return this.position >= this.length;
  }

  /**
   * Seek to an absolute position
   */
  seek(position: number): void {
    if (position < 0 || position > this.length) {
      throw new RangeError(`Seek position ${position} out of bounds [0, ${this.length}]`);
    }
    this.position = position;
  }

  /**
   * Skip a number of bytes
   */
  skip(count: number): void {
    this.seek(this.position + count);
  }

  /**
   * Read a single byte (UInt8)
   */
  readByte(): number {
    this.ensureAvailable(1);
    const value = this.dataView.getUint8(this.position);
    this.position += 1;
    return value;
  }

  /**
   * Read a signed byte (Int8)
   */
  readSByte(): number {
    this.ensureAvailable(1);
    const value = this.dataView.getInt8(this.position);
    this.position += 1;
    return value;
  }

  /**
   * Read an unsigned 16-bit integer (Big Endian)
   */
  readUInt16(): number {
    this.ensureAvailable(2);
    const value = this.dataView.getUint16(this.position, false); // false = Big Endian
    this.position += 2;
    return value;
  }

  /**
   * Read a signed 16-bit integer (Big Endian)
   */
  readInt16(): number {
    this.ensureAvailable(2);
    const value = this.dataView.getInt16(this.position, false);
    this.position += 2;
    return value;
  }

  /**
   * Read an unsigned 32-bit integer (Big Endian)
   */
  readUInt32(): number {
    this.ensureAvailable(4);
    const value = this.dataView.getUint32(this.position, false);
    this.position += 4;
    return value;
  }

  /**
   * Read a signed 32-bit integer (Big Endian)
   */
  readInt32(): number {
    this.ensureAvailable(4);
    const value = this.dataView.getInt32(this.position, false);
    this.position += 4;
    return value;
  }

  /**
   * Read an unsigned 64-bit integer (Big Endian)
   * Note: JavaScript numbers lose precision above 2^53, use BigInt for exact values
   */
  readUInt64(): bigint {
    this.ensureAvailable(8);
    const value = this.dataView.getBigUint64(this.position, false);
    this.position += 8;
    return value;
  }

  /**
   * Read a signed 64-bit integer (Big Endian)
   */
  readInt64(): bigint {
    this.ensureAvailable(8);
    const value = this.dataView.getBigInt64(this.position, false);
    this.position += 8;
    return value;
  }

  /**
   * Read a 32-bit floating point number (Big Endian)
   */
  readFloat(): number {
    this.ensureAvailable(4);
    const value = this.dataView.getFloat32(this.position, false);
    this.position += 4;
    return value;
  }

  /**
   * Read a 64-bit floating point number (Big Endian)
   */
  readDouble(): number {
    this.ensureAvailable(8);
    const value = this.dataView.getFloat64(this.position, false);
    this.position += 8;
    return value;
  }

  /**
   * Read a boolean (1 byte, non-zero = true)
   */
  readBoolean(): boolean {
    return this.readByte() !== 0;
  }

  /**
   * Read a specified number of bytes as Uint8Array
   */
  readBytes(count: number): Uint8Array {
    this.ensureAvailable(count);
    const bytes = new Uint8Array(this.buffer, this.position, count);
    this.position += count;
    // Return a copy to avoid issues with the underlying buffer
    return new Uint8Array(bytes);
  }

  /**
   * Read a 4-character FourCC code
   * AIDEV-NOTE: FourCC codes are used throughout TSI format to identify frame types
   */
  readFourCC(): string {
    const bytes = this.readBytes(4);
    return String.fromCharCode(...bytes);
  }

  /**
   * Read a UTF-16 Big Endian string with a 32-bit length prefix
   * AIDEV-NOTE: TSI uses UTF-16 BE strings with length prefix (count of UTF-16 code units)
   */
  readWideString(): string {
    const length = this.readUInt32(); // Number of UTF-16 code units
    if (length === 0) {
      return '';
    }

    const byteLength = length * 2;
    this.ensureAvailable(byteLength);

    const chars: string[] = [];
    for (let i = 0; i < length; i++) {
      const codeUnit = this.dataView.getUint16(this.position + i * 2, false);
      chars.push(String.fromCharCode(codeUnit));
    }

    this.position += byteLength;
    return chars.join('');
  }

  /**
   * Read a length-prefixed UTF-8 string (32-bit length prefix)
   */
  readString(): string {
    const length = this.readUInt32();
    if (length === 0) {
      return '';
    }

    const bytes = this.readBytes(length);
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  }

  /**
   * Read an ASCII string of a specified length (no length prefix)
   * AIDEV-NOTE: Used by DVST frame for reading XML content. ASCII is single-byte encoding,
   * so no byte-order concerns. The C# version's double-reverse is a no-op for ASCII.
   */
  readAsciiString(length: number): string {
    if (length === 0) {
      return '';
    }

    const bytes = this.readBytes(length);
    // ASCII is single-byte, so we can directly convert each byte to a character
    let result = '';
    for (let i = 0; i < bytes.length; i++) {
      result += String.fromCharCode(bytes[i]!);
    }
    return result;
  }

  /**
   * Peek at bytes without advancing position
   */
  peekBytes(count: number): Uint8Array {
    this.ensureAvailable(count);
    return new Uint8Array(this.buffer, this.position, count);
  }

  /**
   * Peek at a FourCC without advancing position
   */
  peekFourCC(): string {
    const bytes = this.peekBytes(4);
    return String.fromCharCode(...bytes);
  }

  /**
   * Get the underlying buffer
   */
  getBuffer(): ArrayBuffer {
    return this.buffer;
  }

  /**
   * Create a sub-reader for a portion of the buffer
   */
  slice(length: number): BinaryReader {
    this.ensureAvailable(length);
    const subBuffer = this.buffer.slice(this.position, this.position + length);
    this.position += length;
    return new BinaryReader(subBuffer);
  }

  private ensureAvailable(count: number): void {
    if (this.position + count > this.length) {
      throw new RangeError(
        `Cannot read ${count} bytes at position ${this.position}, only ${this.remaining} bytes remaining`
      );
    }
  }
}

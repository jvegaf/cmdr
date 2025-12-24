/**
 * Tests for BinaryReader and BinaryWriter
 *
 * AIDEV-NOTE: These tests verify Big Endian read/write operations and round-trip
 * compatibility, which is critical for TSI file parsing.
 */

import { describe, it, expect } from 'vitest';
import { BinaryReader } from '../src/binary/BinaryReader.js';
import { BinaryWriter } from '../src/binary/BinaryWriter.js';

describe('BinaryReader', () => {
  describe('basic reads', () => {
    it('should read a single byte', () => {
      const buffer = new Uint8Array([0x42]).buffer;
      const reader = new BinaryReader(buffer);
      expect(reader.readByte()).toBe(0x42);
    });

    it('should read signed byte', () => {
      const buffer = new Uint8Array([0xff]).buffer; // -1 as signed
      const reader = new BinaryReader(buffer);
      expect(reader.readSByte()).toBe(-1);
    });

    it('should read UInt16 Big Endian', () => {
      const buffer = new Uint8Array([0x01, 0x02]).buffer; // 0x0102 = 258
      const reader = new BinaryReader(buffer);
      expect(reader.readUInt16()).toBe(258);
    });

    it('should read UInt32 Big Endian', () => {
      const buffer = new Uint8Array([0x00, 0x01, 0x02, 0x03]).buffer; // 0x00010203 = 66051
      const reader = new BinaryReader(buffer);
      expect(reader.readUInt32()).toBe(66051);
    });

    it('should read Int32 Big Endian negative', () => {
      const buffer = new Uint8Array([0xff, 0xff, 0xff, 0xff]).buffer; // -1
      const reader = new BinaryReader(buffer);
      expect(reader.readInt32()).toBe(-1);
    });

    it('should read FourCC', () => {
      const buffer = new Uint8Array([0x44, 0x49, 0x4f, 0x4d]).buffer; // "DIOM"
      const reader = new BinaryReader(buffer);
      expect(reader.readFourCC()).toBe('DIOM');
    });

    it('should read boolean', () => {
      const buffer = new Uint8Array([0x00, 0x01, 0x42]).buffer;
      const reader = new BinaryReader(buffer);
      expect(reader.readBoolean()).toBe(false);
      expect(reader.readBoolean()).toBe(true);
      expect(reader.readBoolean()).toBe(true); // any non-zero is true
    });
  });

  describe('position tracking', () => {
    it('should track position correctly', () => {
      const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04]).buffer;
      const reader = new BinaryReader(buffer);

      expect(reader.offset).toBe(0);
      reader.readByte();
      expect(reader.offset).toBe(1);
      reader.readUInt16();
      expect(reader.offset).toBe(3);
    });

    it('should seek to position', () => {
      const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04]).buffer;
      const reader = new BinaryReader(buffer);

      reader.seek(2);
      expect(reader.readByte()).toBe(0x03);
    });

    it('should skip bytes', () => {
      const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04]).buffer;
      const reader = new BinaryReader(buffer);

      reader.skip(2);
      expect(reader.readByte()).toBe(0x03);
    });

    it('should report remaining bytes', () => {
      const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04]).buffer;
      const reader = new BinaryReader(buffer);

      expect(reader.remaining).toBe(4);
      reader.readByte();
      expect(reader.remaining).toBe(3);
    });

    it('should detect EOF', () => {
      const buffer = new Uint8Array([0x01]).buffer;
      const reader = new BinaryReader(buffer);

      expect(reader.isEof).toBe(false);
      reader.readByte();
      expect(reader.isEof).toBe(true);
    });
  });

  describe('string reading', () => {
    it('should read UTF-16 BE wide string', () => {
      // Length (4 bytes) + "Hi" in UTF-16 BE
      const buffer = new Uint8Array([
        0x00, 0x00, 0x00, 0x02, // length = 2
        0x00, 0x48, // 'H'
        0x00, 0x69, // 'i'
      ]).buffer;
      const reader = new BinaryReader(buffer);
      expect(reader.readWideString()).toBe('Hi');
    });

    it('should read empty wide string', () => {
      const buffer = new Uint8Array([0x00, 0x00, 0x00, 0x00]).buffer;
      const reader = new BinaryReader(buffer);
      expect(reader.readWideString()).toBe('');
    });
  });

  describe('error handling', () => {
    it('should throw on read past end', () => {
      const buffer = new Uint8Array([0x01]).buffer;
      const reader = new BinaryReader(buffer);
      reader.readByte();
      expect(() => reader.readByte()).toThrow(RangeError);
    });

    it('should throw on invalid seek', () => {
      const buffer = new Uint8Array([0x01]).buffer;
      const reader = new BinaryReader(buffer);
      expect(() => reader.seek(-1)).toThrow(RangeError);
      expect(() => reader.seek(100)).toThrow(RangeError);
    });
  });

  describe('factory methods', () => {
    it('should create from Uint8Array', () => {
      const bytes = new Uint8Array([0x01, 0x02]);
      const reader = BinaryReader.fromUint8Array(bytes);
      expect(reader.readUInt16()).toBe(0x0102);
    });

    it('should create from Base64', () => {
      const base64 = btoa('DIOM'); // "RElPTQ=="
      const reader = BinaryReader.fromBase64(base64);
      expect(reader.readFourCC()).toBe('DIOM');
    });
  });

  describe('slice', () => {
    it('should create sub-reader', () => {
      const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]).buffer;
      const reader = new BinaryReader(buffer);
      reader.readByte(); // skip first byte

      const subReader = reader.slice(2);
      expect(subReader.length).toBe(2);
      expect(subReader.readByte()).toBe(0x02);
      expect(subReader.readByte()).toBe(0x03);

      // Original reader should have advanced
      expect(reader.offset).toBe(3);
    });
  });
});

describe('BinaryWriter', () => {
  describe('basic writes', () => {
    it('should write a single byte', () => {
      const writer = new BinaryWriter();
      writer.writeByte(0x42);
      const result = writer.toUint8Array();
      expect(result).toEqual(new Uint8Array([0x42]));
    });

    it('should write UInt16 Big Endian', () => {
      const writer = new BinaryWriter();
      writer.writeUInt16(258); // 0x0102
      const result = writer.toUint8Array();
      expect(result).toEqual(new Uint8Array([0x01, 0x02]));
    });

    it('should write UInt32 Big Endian', () => {
      const writer = new BinaryWriter();
      writer.writeUInt32(66051); // 0x00010203
      const result = writer.toUint8Array();
      expect(result).toEqual(new Uint8Array([0x00, 0x01, 0x02, 0x03]));
    });

    it('should write FourCC', () => {
      const writer = new BinaryWriter();
      writer.writeFourCC('DIOM');
      const result = writer.toUint8Array();
      expect(result).toEqual(new Uint8Array([0x44, 0x49, 0x4f, 0x4d]));
    });

    it('should write boolean', () => {
      const writer = new BinaryWriter();
      writer.writeBoolean(false);
      writer.writeBoolean(true);
      const result = writer.toUint8Array();
      expect(result).toEqual(new Uint8Array([0x00, 0x01]));
    });
  });

  describe('string writing', () => {
    it('should write UTF-16 BE wide string', () => {
      const writer = new BinaryWriter();
      writer.writeWideString('Hi');
      const result = writer.toUint8Array();
      expect(result).toEqual(
        new Uint8Array([
          0x00, 0x00, 0x00, 0x02, // length = 2
          0x00, 0x48, // 'H'
          0x00, 0x69, // 'i'
        ])
      );
    });

    it('should write empty wide string', () => {
      const writer = new BinaryWriter();
      writer.writeWideString('');
      const result = writer.toUint8Array();
      expect(result).toEqual(new Uint8Array([0x00, 0x00, 0x00, 0x00]));
    });
  });

  describe('buffer management', () => {
    it('should grow buffer as needed', () => {
      const writer = new BinaryWriter(4); // Start small
      for (let i = 0; i < 100; i++) {
        writer.writeByte(i);
      }
      expect(writer.length).toBe(100);
    });

    it('should return proper length', () => {
      const writer = new BinaryWriter();
      expect(writer.length).toBe(0);
      writer.writeUInt32(123);
      expect(writer.length).toBe(4);
    });
  });

  describe('error handling', () => {
    it('should throw on invalid FourCC length', () => {
      const writer = new BinaryWriter();
      expect(() => writer.writeFourCC('DIO')).toThrow();
      expect(() => writer.writeFourCC('DIOMX')).toThrow();
    });
  });

  describe('output formats', () => {
    it('should convert to Base64', () => {
      const writer = new BinaryWriter();
      writer.writeFourCC('DIOM');
      const base64 = writer.toBase64();
      expect(base64).toBe(btoa('DIOM'));
    });

    it('should convert to ArrayBuffer', () => {
      const writer = new BinaryWriter();
      writer.writeByte(0x42);
      const buffer = writer.toArrayBuffer();
      expect(buffer.byteLength).toBe(1);
      expect(new Uint8Array(buffer)[0]).toBe(0x42);
    });
  });
});

describe('Round-trip compatibility', () => {
  it('should read what was written - primitive types', () => {
    const writer = new BinaryWriter();
    writer.writeByte(0x42);
    writer.writeSByte(-10);
    writer.writeUInt16(12345);
    writer.writeInt16(-5000);
    writer.writeUInt32(0xdeadbeef);
    writer.writeInt32(-123456);
    writer.writeBoolean(true);
    writer.writeBoolean(false);
    writer.writeFloat(3.14);
    writer.writeDouble(2.71828);

    const reader = BinaryReader.fromUint8Array(writer.toUint8Array());
    expect(reader.readByte()).toBe(0x42);
    expect(reader.readSByte()).toBe(-10);
    expect(reader.readUInt16()).toBe(12345);
    expect(reader.readInt16()).toBe(-5000);
    expect(reader.readUInt32()).toBe(0xdeadbeef);
    expect(reader.readInt32()).toBe(-123456);
    expect(reader.readBoolean()).toBe(true);
    expect(reader.readBoolean()).toBe(false);
    expect(reader.readFloat()).toBeCloseTo(3.14, 5);
    expect(reader.readDouble()).toBeCloseTo(2.71828, 10);
  });

  it('should read what was written - strings', () => {
    const writer = new BinaryWriter();
    writer.writeWideString('Hello, World!');
    writer.writeWideString('');
    writer.writeWideString('Unicode: äöü');

    const reader = BinaryReader.fromUint8Array(writer.toUint8Array());
    expect(reader.readWideString()).toBe('Hello, World!');
    expect(reader.readWideString()).toBe('');
    expect(reader.readWideString()).toBe('Unicode: äöü');
  });

  it('should read what was written - FourCC', () => {
    const writer = new BinaryWriter();
    writer.writeFourCC('DIOM');
    writer.writeFourCC('DEVI');
    writer.writeFourCC('MAPP');

    const reader = BinaryReader.fromUint8Array(writer.toUint8Array());
    expect(reader.readFourCC()).toBe('DIOM');
    expect(reader.readFourCC()).toBe('DEVI');
    expect(reader.readFourCC()).toBe('MAPP');
  });

  it('should read what was written - 64-bit integers', () => {
    const writer = new BinaryWriter();
    writer.writeUInt64(BigInt('0xDEADBEEFCAFEBABE'));
    writer.writeInt64(BigInt('-9223372036854775808')); // Min Int64

    const reader = BinaryReader.fromUint8Array(writer.toUint8Array());
    expect(reader.readUInt64()).toBe(BigInt('0xDEADBEEFCAFEBABE'));
    expect(reader.readInt64()).toBe(BigInt('-9223372036854775808'));
  });
});

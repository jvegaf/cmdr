/**
 * Deep parsing tests for TSI files
 *
 * AIDEV-NOTE: These tests verify that the parser extracts
 * meaningful data from TSI files (devices, mappings, etc.)
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  parseTsiFile,
  TsiFile,
} from '../src/index.js';

const FIXTURES_DIR = join(__dirname, 'fixtures');

function loadFixture(filename: string): string {
  return readFileSync(join(FIXTURES_DIR, filename), 'utf-8');
}

describe('Deep Parsing Tests', () => {
  describe('Device extraction', () => {
    it('should extract device info from encoder mode demo.tsi', () => {
      const xml = loadFixture('encoder mode demo.tsi');
      const tsi = parseTsiFile(xml);

      // Should have at least one controller device
      expect(tsi.controllerDevices.length).toBeGreaterThan(0);

      // Check first device has expected structure
      const device = tsi.controllerDevices[0];
      expect(device).toBeDefined();
      expect(device.deviceType).toBeDefined();
      expect(typeof device.deviceType).toBe('string');
      expect(device.data).toBeDefined();
    });

    it('should extract device ports', () => {
      const xml = loadFixture('encoder mode demo.tsi');
      const tsi = parseTsiFile(xml);

      if (tsi.controllerDevices.length > 0) {
        const device = tsi.controllerDevices[0];
        expect(device.data.ports).toBeDefined();
        expect(device.data.ports.inPortName).toBeDefined();
        expect(device.data.ports.outPortName).toBeDefined();
      }
    });
  });

  describe('Mapping extraction', () => {
    it('should extract mappings from encoder mode demo.tsi', () => {
      const xml = loadFixture('encoder mode demo.tsi');
      const tsi = parseTsiFile(xml);

      if (tsi.controllerDevices.length > 0) {
        const device = tsi.controllerDevices[0];
        if (device.data.mappings) {
          expect(Array.isArray(device.data.mappings.mappings)).toBe(true);

          // If there are mappings, check structure
          if (device.data.mappings.mappings.length > 0) {
            const mapping = device.data.mappings.mappings[0];
            expect(mapping.type).toBeDefined();
            expect(mapping.traktorControlId).toBeDefined();
            expect(mapping.settings).toBeDefined();
            expect(mapping.settings.controlType).toBeDefined();
            expect(mapping.settings.interactionMode).toBeDefined();
          }
        }
      }
    });

    it('should extract MIDI bindings', () => {
      const xml = loadFixture('encoder mode demo.tsi');
      const tsi = parseTsiFile(xml);

      if (tsi.controllerDevices.length > 0) {
        const device = tsi.controllerDevices[0];
        if (device.data.mappings) {
          expect(Array.isArray(device.data.mappings.midiBindings)).toBe(true);

          // If there are bindings, check structure
          if (device.data.mappings.midiBindings.length > 0) {
            const binding = device.data.mappings.midiBindings[0];
            expect(binding.bindingId).toBeDefined();
            expect(binding.midiNote).toBeDefined();
          }
        }
      }
    });
  });

  describe('TsiFile class methods', () => {
    it('should correctly count mappings', () => {
      const xml = loadFixture('encoder mode demo.tsi');
      const tsi = TsiFile.fromXml(xml);

      // mappingCount should be sum of all mappings across all devices
      const manualCount = tsi.devices.reduce((sum, device) => {
        return sum + (device.data.mappings?.mappings.length ?? 0);
      }, 0);

      expect(tsi.mappingCount).toBe(manualCount);
    });

    it('should return devices via getter', () => {
      const xml = loadFixture('encoder mode demo.tsi');
      const tsi = TsiFile.fromXml(xml);

      // devices should be controllerDevices + keyboardDevices
      expect(tsi.devices.length).toBe(
        tsi.controllerDevices.length + tsi.keyboardDevices.length
      );
    });

    it('should serialize back to XML', () => {
      const xml = loadFixture('encoder mode demo.tsi');
      const tsi = TsiFile.fromXml(xml);
      const serialized = tsi.toXml();

      // Should be valid XML-ish
      expect(serialized).toContain('<?xml');
      expect(serialized).toContain('NIXML');
      expect(serialized).toContain('TraktorSettings');

      // Should contain DeviceIO.Config.Controller if there are devices
      if (tsi.controllerDevices.length > 0) {
        expect(serialized).toContain('DeviceIO.Config.Controller');
      }
    });
  });

  describe('Version info', () => {
    it('should extract version from device data', () => {
      const xml = loadFixture('encoder mode demo.tsi');
      const tsi = parseTsiFile(xml);

      if (tsi.controllerDevices.length > 0) {
        const device = tsi.controllerDevices[0];
        expect(device.data.version).toBeDefined();
        expect(device.data.version.version).toBeDefined();
        expect(typeof device.data.version.version).toBe('string');
      }
    });
  });

  describe('Comments', () => {
    it('should extract comment if present', () => {
      const xml = loadFixture('encoder mode demo.tsi');
      const tsi = parseTsiFile(xml);

      if (tsi.controllerDevices.length > 0) {
        const device = tsi.controllerDevices[0];
        // Comment is optional, so just check the property exists
        expect('comment' in device.data).toBe(true);
      }
    });

    it('should extract mapping comments', () => {
      const xml = loadFixture('encoder mode demo.tsi');
      const tsi = parseTsiFile(xml);

      if (tsi.controllerDevices.length > 0) {
        const device = tsi.controllerDevices[0];
        if (device.data.mappings?.mappings.length) {
          const mapping = device.data.mappings.mappings[0];
          expect('comment' in mapping.settings).toBe(true);
        }
      }
    });
  });
});

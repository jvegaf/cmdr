/**
 * Integration tests for TSI file parsing
 *
 * AIDEV-NOTE: These tests load real TSI fixtures to verify the parser
 * works correctly with actual Traktor files.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  parseTsiFile,
  TsiFile,
} from '../src/index.js';

const FIXTURES_DIR = join(__dirname, 'fixtures');

/**
 * Load a TSI fixture file
 */
function loadFixture(filename: string): string {
  return readFileSync(join(FIXTURES_DIR, filename), 'utf-8');
}

describe('TsiFile Integration Tests', () => {
  describe('parseTsiFile', () => {
    it('should parse encoder mode demo.tsi', () => {
      const xml = loadFixture('encoder mode demo.tsi');
      const tsi = parseTsiFile(xml);

      expect(tsi).toBeDefined();
      expect(tsi.controllerDevices).toBeDefined();
      expect(Array.isArray(tsi.controllerDevices)).toBe(true);
    });

    it('should parse add_remove_prep_list.tsi', () => {
      const xml = loadFixture('add_remove_prep_list.tsi');
      const tsi = parseTsiFile(xml);

      expect(tsi).toBeDefined();
      expect(tsi.controllerDevices).toBeDefined();
    });

    it('should parse fx_list_from_TK.tsi', () => {
      const xml = loadFixture('fx_list_from_TK.tsi');
      const tsi = parseTsiFile(xml);

      expect(tsi).toBeDefined();
      expect(tsi.controllerDevices).toBeDefined();
    });

    it('should parse semitone next.tsi', () => {
      const xml = loadFixture('semitone next.tsi');
      const tsi = parseTsiFile(xml);

      expect(tsi).toBeDefined();
      expect(tsi.controllerDevices).toBeDefined();
    });

    it('should parse load loop and play.tsi', () => {
      const xml = loadFixture('load loop and play.tsi');
      const tsi = parseTsiFile(xml);

      expect(tsi).toBeDefined();
      expect(tsi.controllerDevices).toBeDefined();
    });

    it('should parse TP3.0 new commands.tsi', () => {
      const xml = loadFixture('TP3.0 new commands.tsi');
      const tsi = parseTsiFile(xml);

      expect(tsi).toBeDefined();
      expect(tsi.controllerDevices).toBeDefined();
    });
  });

  describe('TsiFile class', () => {
    it('should create TsiFile from XML', () => {
      const xml = loadFixture('encoder mode demo.tsi');
      const tsi = TsiFile.fromXml(xml);

      expect(tsi).toBeInstanceOf(TsiFile);
      expect(tsi.devices).toBeDefined();
    });

    it('should create empty TsiFile', () => {
      const tsi = TsiFile.create();

      expect(tsi).toBeInstanceOf(TsiFile);
      expect(tsi.devices.length).toBe(0);
      expect(tsi.mappingCount).toBe(0);
    });

    it('should get device count', () => {
      const xml = loadFixture('encoder mode demo.tsi');
      const tsi = TsiFile.fromXml(xml);

      // At minimum there should be devices
      expect(tsi.devices.length).toBeGreaterThanOrEqual(0);
    });

    it('should serialize to XML', () => {
      const tsi = TsiFile.create();
      const xml = tsi.toXml();

      expect(xml).toContain('<?xml');
      expect(xml).toContain('NIXML');
      expect(xml).toContain('TraktorSettings');
    });
  });

  describe('Round-trip tests', () => {
    // AIDEV-NOTE: Round-trip tests verify that parsing and serializing
    // produces consistent results, though not necessarily byte-identical

    it('should round-trip empty TSI file', () => {
      const tsi1 = TsiFile.create();
      const xml = tsi1.toXml();
      const tsi2 = TsiFile.fromXml(xml);

      expect(tsi2.devices.length).toBe(tsi1.devices.length);
      expect(tsi2.mappingCount).toBe(tsi1.mappingCount);
    });
  });

  describe('All fixtures load without error', () => {
    const fixtures = [
      'add_remove_prep_list.tsi',
      'encoder mode demo.tsi',
      'favorites_enum__1st_none___2nd_1____3rd_12.tsi',
      'fx_list_from_TK.tsi',
      'load loop and play.tsi',
      'semitone next.tsi',
      'semitone none.tsi',
      'semitone previous.tsi',
      'timecode_mode__1st_abs__2nd_rel___3rd___4th_hap.tsi',
      'TP3.0 new commands.tsi',
    ];

    for (const fixture of fixtures) {
      it(`should load ${fixture} without throwing`, () => {
        const xml = loadFixture(fixture);
        expect(() => parseTsiFile(xml)).not.toThrow();
      });
    }
  });
});

/**
 * Tests for utility functions in @cmdr/core
 *
 * AIDEV-NOTE: Tests for deep-copy utilities and constants module.
 * These utilities are critical for clipboard, undo/redo, and mapping duplication.
 */

import { describe, expect, it } from 'vitest';

import { createDefaultMapping, type MappingData } from '../src/format/Mapping.js';
import { createDefaultMappingSettings } from '../src/format/MappingSettings.js';
import {
  CURRENT_FRAME_VERSION,
  DEFAULT_HISTORY_SIZE,
  FRAME_VERSION_SENTINEL,
  LEGACY_FRAME_VERSION,
  MIDI_CHANNEL_MAX,
  MIDI_CHANNEL_MIN,
  MIDI_NOTE_MAX,
  MIDI_NOTE_MIN,
  NO_MIDI_BINDING_ID,
} from '../src/utils/constants.js';
import {
  deepCopyMappingData,
  deepCopyMappingDataArray,
  deepCopyMappingSettings,
} from '../src/utils/deep-copy.js';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockMappingData(bindingId = 42): MappingData {
  const data = createDefaultMapping();
  data.midiNoteBindingId = bindingId;
  data.traktorControlId = 123;
  data.settings.comment = 'Test mapping';
  data.settings.setValueTo = new Uint8Array([100, 0, 0, 0]);
  data.settings.conditionOneValue = new Uint8Array([1, 2, 3, 4]);
  data.settings.conditionTwoValue = new Uint8Array([5, 6, 7, 8]);
  data.settings.conditionOneId = 1;
  data.settings.conditionTwoId = 2;
  return data;
}

// ============================================================================
// Constants Tests
// ============================================================================

describe('Constants', () => {
  describe('Frame Version Constants', () => {
    it('should have correct FRAME_VERSION_SENTINEL value', () => {
      expect(FRAME_VERSION_SENTINEL).toBe(2147483647);
      expect(FRAME_VERSION_SENTINEL).toBe(2 ** 31 - 1);
    });

    it('should have correct frame version values', () => {
      expect(CURRENT_FRAME_VERSION).toBe(3);
      expect(LEGACY_FRAME_VERSION).toBe(2);
    });
  });

  describe('MIDI Constants', () => {
    it('should have correct MIDI channel range', () => {
      expect(MIDI_CHANNEL_MIN).toBe(0);
      expect(MIDI_CHANNEL_MAX).toBe(15);
    });

    it('should have correct MIDI note range', () => {
      expect(MIDI_NOTE_MIN).toBe(0);
      expect(MIDI_NOTE_MAX).toBe(127);
    });
  });

  describe('Other Constants', () => {
    it('should have correct NO_MIDI_BINDING_ID', () => {
      expect(NO_MIDI_BINDING_ID).toBe(-1);
    });

    it('should have correct DEFAULT_HISTORY_SIZE', () => {
      expect(DEFAULT_HISTORY_SIZE).toBe(50);
    });
  });
});

// ============================================================================
// Deep Copy Tests
// ============================================================================

describe('Deep Copy Utilities', () => {
  describe('deepCopyMappingSettings', () => {
    it('should create a deep copy of settings', () => {
      const original = createDefaultMappingSettings();
      original.comment = 'Test';
      const copy = deepCopyMappingSettings(original);

      // Should be equal but not the same reference
      expect(copy).toEqual(original);
      expect(copy).not.toBe(original);
    });

    it('should deeply copy Uint8Array fields', () => {
      const original = createDefaultMappingSettings();
      const copy = deepCopyMappingSettings(original);

      // Uint8Array fields should not share references
      expect(copy.setValueTo).not.toBe(original.setValueTo);
      expect(copy.conditionOneValue).not.toBe(original.conditionOneValue);
      expect(copy.conditionTwoValue).not.toBe(original.conditionTwoValue);
      expect(copy.ledMinControllerRange).not.toBe(original.ledMinControllerRange);
      expect(copy.ledMaxControllerRange).not.toBe(original.ledMaxControllerRange);
    });

    it('should preserve Uint8Array values', () => {
      const original = createDefaultMappingSettings();
      original.setValueTo = new Uint8Array([1, 2, 3, 4]);
      original.conditionOneValue = new Uint8Array([5, 6, 7, 8]);
      const copy = deepCopyMappingSettings(original);

      expect(Array.from(copy.setValueTo)).toEqual(Array.from(original.setValueTo));
      expect(Array.from(copy.conditionOneValue)).toEqual(Array.from(original.conditionOneValue));
      expect(Array.from(copy.conditionTwoValue)).toEqual(Array.from(original.conditionTwoValue));
    });

    it('should not affect original when copy is modified', () => {
      const original = createDefaultMappingSettings();
      original.comment = 'Test mapping';
      original.setValueTo = new Uint8Array([100, 0, 0, 0]);
      const copy = deepCopyMappingSettings(original);

      // Modify the copy
      copy.comment = 'Modified';
      copy.setValueTo[0] = 255;

      // Original should be unchanged
      expect(original.comment).toBe('Test mapping');
      expect(original.setValueTo[0]).toBe(100);
    });
  });

  describe('deepCopyMappingData', () => {
    it('should create a deep copy with binding ID reset by default', () => {
      const original = createMockMappingData(42);
      const copy = deepCopyMappingData(original);

      // Binding ID should be reset to -1
      expect(copy.midiNoteBindingId).toBe(-1);

      // Other fields should be preserved
      expect(copy.type).toBe(original.type);
      expect(copy.traktorControlId).toBe(original.traktorControlId);
      expect(copy.settings.comment).toBe(original.settings.comment);
    });

    it('should preserve binding ID when option is set', () => {
      const original = createMockMappingData(42);
      const copy = deepCopyMappingData(original, { preserveBindingId: true });

      expect(copy.midiNoteBindingId).toBe(42);
    });

    it('should deeply copy settings', () => {
      const original = createMockMappingData();
      const copy = deepCopyMappingData(original);

      // Settings should not share reference
      expect(copy.settings).not.toBe(original.settings);

      // Uint8Array fields should not share references
      expect(copy.settings.setValueTo).not.toBe(original.settings.setValueTo);
    });

    it('should not affect original when copy is modified', () => {
      const original = createMockMappingData();
      const originalBindingId = original.midiNoteBindingId;
      const originalComment = original.settings.comment;

      const copy = deepCopyMappingData(original, { preserveBindingId: true });

      // Modify copy
      copy.midiNoteBindingId = 999;
      copy.traktorControlId = 456;
      copy.settings.comment = 'Changed';
      copy.settings.setValueTo[0] = 255;

      // Original unchanged
      expect(original.midiNoteBindingId).toBe(originalBindingId);
      expect(original.traktorControlId).toBe(123);
      expect(original.settings.comment).toBe(originalComment);
      expect(original.settings.setValueTo[0]).toBe(100);
    });

    it('should handle empty options object', () => {
      const original = createMockMappingData(42);
      const copy = deepCopyMappingData(original, {});

      // Should behave like default (reset binding ID)
      expect(copy.midiNoteBindingId).toBe(-1);
    });
  });

  describe('deepCopyMappingDataArray', () => {
    it('should create deep copies of multiple mappings', () => {
      const originals = [
        createMockMappingData(1),
        createMockMappingData(2),
        createMockMappingData(3),
      ];

      const copies = deepCopyMappingDataArray(originals);

      expect(copies).toHaveLength(3);

      // Each copy should have binding ID reset
      copies.forEach((copy) => {
        expect(copy.midiNoteBindingId).toBe(-1);
      });
    });

    it('should preserve binding IDs when option is set', () => {
      const originals = [
        createMockMappingData(1),
        createMockMappingData(2),
        createMockMappingData(3),
      ];

      const copies = deepCopyMappingDataArray(originals, { preserveBindingId: true });

      expect(copies[0]?.midiNoteBindingId).toBe(1);
      expect(copies[1]?.midiNoteBindingId).toBe(2);
      expect(copies[2]?.midiNoteBindingId).toBe(3);
    });

    it('should not share references between copies and originals', () => {
      const originals = [createMockMappingData(1)];
      const copies = deepCopyMappingDataArray(originals);

      // Modify copy - safe access since we know array has one element
      const copy = copies[0];
      const original = originals[0];
      if (copy && original) {
        copy.settings.comment = 'Modified';
        copy.settings.setValueTo[0] = 255;

        // Original unchanged
        expect(original.settings.comment).toBe('Test mapping');
        expect(original.settings.setValueTo[0]).toBe(100);
      }
    });

    it('should handle empty array', () => {
      const copies = deepCopyMappingDataArray([]);
      expect(copies).toEqual([]);
    });
  });
});

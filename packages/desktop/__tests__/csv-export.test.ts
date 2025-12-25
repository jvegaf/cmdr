/**
 * Tests for csv-export.ts - CSV Export Utility
 *
 * AIDEV-NOTE: Tests the CSV export functionality including:
 * - Field escaping and formatting
 * - Column configuration
 * - Device/mapping export
 * - Report generation (Commands, Conditions)
 */

import { describe, expect, it, vi } from 'vitest';

// Mock @cmdr/core before importing csv-export
vi.mock('@cmdr/core', () => ({
  MappingType: {
    In: 0,
    Out: 1,
  },
  getCommandDescription: vi.fn((id: number) => {
    if (id === 1) return { id: 1, name: 'Play/Pause', category: 'Transport' };
    if (id === 2) return { id: 2, name: 'Cue', category: 'Transport' };
    if (id === 100) return { id: 100, name: 'Loop Active', category: 'Loop' };
    return null;
  }),
  getConditionDescription: vi.fn((id: number) => {
    if (id === 1) return { id: 1, name: 'Is Playing', category: 'Transport' };
    if (id === 2) return { id: 2, name: 'Is Looping', category: 'Loop' };
    return null;
  }),
  getControlTypeName: vi.fn((type: number) => {
    const names: Record<number, string> = { 0: 'Button', 1: 'Fader', 2: 'Encoder' };
    return names[type] ?? 'Unknown';
  }),
  getInteractionModeName: vi.fn((mode: number) => {
    const names: Record<number, string> = { 0: 'Trigger', 1: 'Toggle', 2: 'Hold', 3: 'Direct' };
    return names[mode] ?? 'Unknown';
  }),
  getTargetDeckName: vi.fn((target: number) => {
    const names: Record<number, string> = {
      0: 'Device Target',
      1: 'Deck A',
      2: 'Deck B',
    };
    return names[target] ?? `Unknown (${target})`;
  }),
}));

import type { Device, Mapping } from '@cmdr/core';
import {
  type CommandReportRow,
  type ConditionCombinationRow,
  type CsvColumnConfig,
  DEFAULT_CSV_COLUMNS,
  exportCommandsReportToCsv,
  exportConditionsSummaryToCsv,
  exportDeviceToCsv,
  exportToCsv,
  generateCommandsReport,
  generateConditionsSummary,
} from '../src/renderer/lib/csv-export';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock Mapping for testing
 */
function createMockMapping(overrides: Partial<Mapping> = {}): Mapping {
  return {
    id: 1,
    type: 0, // In
    commandId: 1,
    target: 0, // Device Target
    controlType: 0, // Button
    interactionMode: 0, // Trigger
    comment: '',
    hasConditions: false,
    condition1: null,
    condition2: null,
    midiBinding: null,
    ...overrides,
  } as unknown as Mapping;
}

/**
 * Create a mock Device for testing
 */
function createMockDevice(
  mappings: Mapping[] = [],
  comment = 'Test Device',
  typeStr = 'Generic MIDI'
): Device {
  return {
    comment,
    typeStr,
    mappings,
  } as unknown as Device;
}

// ============================================================================
// Tests
// ============================================================================

describe('csv-export', () => {
  // ==========================================================================
  // DEFAULT_CSV_COLUMNS
  // ==========================================================================

  describe('DEFAULT_CSV_COLUMNS', () => {
    it('should have all required columns', () => {
      const expectedColumns = [
        'device',
        'id',
        'type',
        'command',
        'assignment',
        'conditions',
        'interaction',
        'midiBinding',
        'comment',
      ];

      const keys = DEFAULT_CSV_COLUMNS.map((c) => c.key);
      expect(keys).toEqual(expectedColumns);
    });

    it('should have all columns enabled by default', () => {
      for (const col of DEFAULT_CSV_COLUMNS) {
        expect(col.enabled).toBe(true);
      }
    });

    it('should have human-readable labels', () => {
      const deviceCol = DEFAULT_CSV_COLUMNS.find((c) => c.key === 'device');
      expect(deviceCol?.label).toBe('Device');

      const midiCol = DEFAULT_CSV_COLUMNS.find((c) => c.key === 'midiBinding');
      expect(midiCol?.label).toBe('MIDI Binding');
    });
  });

  // ==========================================================================
  // exportToCsv - Basic functionality
  // ==========================================================================

  describe('exportToCsv - Basic', () => {
    it('should export empty devices array', () => {
      const result = exportToCsv([], {
        columns: DEFAULT_CSV_COLUMNS,
        includeHeader: true,
      });

      // Should have BOM + header
      expect(result.startsWith('\uFEFF')).toBe(true);
      expect(result).toContain('Device,ID,Type,Command');
    });

    it('should include BOM for Excel compatibility', () => {
      const result = exportToCsv([], { columns: DEFAULT_CSV_COLUMNS });
      expect(result.charCodeAt(0)).toBe(0xfeff);
    });

    it('should include header row by default', () => {
      const result = exportToCsv([], { columns: DEFAULT_CSV_COLUMNS });
      expect(result).toContain('Device,ID,Type,Command');
    });

    it('should exclude header row when includeHeader is false', () => {
      const result = exportToCsv([], {
        columns: DEFAULT_CSV_COLUMNS,
        includeHeader: false,
      });

      // Only BOM and empty
      expect(result).toBe('\uFEFF');
    });

    it('should use comma as default separator', () => {
      const device = createMockDevice([createMockMapping()]);
      const result = exportToCsv([device], { columns: DEFAULT_CSV_COLUMNS });

      expect(result).toContain(',');
    });

    it('should use custom separator when provided', () => {
      const device = createMockDevice([createMockMapping()]);
      const result = exportToCsv([device], {
        columns: DEFAULT_CSV_COLUMNS,
        separator: ';',
      });

      expect(result).toContain(';');
    });
  });

  // ==========================================================================
  // exportToCsv - Column filtering
  // ==========================================================================

  describe('exportToCsv - Column filtering', () => {
    it('should only export enabled columns', () => {
      const columns: CsvColumnConfig[] = [
        { key: 'device', label: 'Device', enabled: true },
        { key: 'id', label: 'ID', enabled: false },
        { key: 'command', label: 'Command', enabled: true },
      ];

      const device = createMockDevice([createMockMapping()]);
      const result = exportToCsv([device], { columns });

      expect(result).toContain('Device');
      expect(result).toContain('Command');
      expect(result).not.toContain('ID');
    });

    it('should export columns in configured order', () => {
      const columns: CsvColumnConfig[] = [
        { key: 'command', label: 'Command', enabled: true },
        { key: 'device', label: 'Device', enabled: true },
      ];

      const result = exportToCsv([], { columns });

      // Header should be "Command,Device"
      const headerLine = result.split('\n')[0];
      expect(headerLine).toBe('\uFEFFCommand,Device');
    });
  });

  // ==========================================================================
  // exportToCsv - Field values
  // ==========================================================================

  describe('exportToCsv - Field values', () => {
    it('should export device name correctly', () => {
      const device = createMockDevice([createMockMapping()], 'My Controller');
      const result = exportToCsv([device], { columns: DEFAULT_CSV_COLUMNS });

      expect(result).toContain('My Controller');
    });

    it('should use device index if no comment', () => {
      const device = createMockDevice([createMockMapping()], '');
      const result = exportToCsv([device], { columns: DEFAULT_CSV_COLUMNS });

      expect(result).toContain('Device 1');
    });

    it('should export mapping type correctly', () => {
      const inMapping = createMockMapping({ type: 0 });
      const outMapping = createMockMapping({ type: 1 });

      const device = createMockDevice([inMapping, outMapping]);
      const result = exportToCsv([device], { columns: DEFAULT_CSV_COLUMNS });

      expect(result).toContain(',In,');
      expect(result).toContain(',Out,');
    });

    it('should export MIDI binding when present', () => {
      const mapping = createMockMapping({
        midiBinding: { note: 'CC.00.001', channel: 0, noteNumber: 1, isCC: true },
      });

      const device = createMockDevice([mapping]);
      const result = exportToCsv([device], { columns: DEFAULT_CSV_COLUMNS });

      expect(result).toContain('CC.00.001');
    });

    it('should export empty string when no MIDI binding', () => {
      const mapping = createMockMapping({ midiBinding: null });
      const device = createMockDevice([mapping]);
      const result = exportToCsv([device], { columns: DEFAULT_CSV_COLUMNS });

      // MIDI binding column should be empty between commas
      const lines = result.split('\n');
      const dataLine = lines.find((l) => l.includes('Test Device'));
      expect(dataLine).toBeDefined();
    });

    it('should export comment', () => {
      const mapping = createMockMapping({ comment: 'My important mapping' });
      const device = createMockDevice([mapping]);
      const result = exportToCsv([device], { columns: DEFAULT_CSV_COLUMNS });

      expect(result).toContain('My important mapping');
    });
  });

  // ==========================================================================
  // exportToCsv - Field escaping
  // ==========================================================================

  describe('exportToCsv - Field escaping', () => {
    it('should escape fields containing separator', () => {
      const mapping = createMockMapping({ comment: 'First, Second' });
      const device = createMockDevice([mapping]);
      const result = exportToCsv([device], { columns: DEFAULT_CSV_COLUMNS });

      expect(result).toContain('"First, Second"');
    });

    it('should escape fields containing quotes', () => {
      const mapping = createMockMapping({ comment: 'Say "Hello"' });
      const device = createMockDevice([mapping]);
      const result = exportToCsv([device], { columns: DEFAULT_CSV_COLUMNS });

      expect(result).toContain('"Say ""Hello"""');
    });

    it('should escape fields containing newlines', () => {
      const mapping = createMockMapping({ comment: 'Line1\nLine2' });
      const device = createMockDevice([mapping]);
      const result = exportToCsv([device], { columns: DEFAULT_CSV_COLUMNS });

      expect(result).toContain('"Line1\nLine2"');
    });

    it('should escape fields containing carriage returns', () => {
      const mapping = createMockMapping({ comment: 'Line1\rLine2' });
      const device = createMockDevice([mapping]);
      const result = exportToCsv([device], { columns: DEFAULT_CSV_COLUMNS });

      expect(result).toContain('"Line1\rLine2"');
    });

    it('should not escape simple fields', () => {
      const mapping = createMockMapping({ comment: 'Simple' });
      const device = createMockDevice([mapping]);
      const result = exportToCsv([device], { columns: DEFAULT_CSV_COLUMNS });

      // Should not be quoted
      expect(result).toContain(',Simple');
      expect(result).not.toContain('"Simple"');
    });
  });

  // ==========================================================================
  // exportToCsv - Device separators
  // ==========================================================================

  describe('exportToCsv - Device separators', () => {
    it('should add device separator comments', () => {
      const device1 = createMockDevice([createMockMapping()], 'Controller 1');
      const device2 = createMockDevice([createMockMapping()], 'Controller 2');

      const result = exportToCsv([device1, device2], {
        columns: DEFAULT_CSV_COLUMNS,
      });

      expect(result).toContain('# Page 1: (Controller 1)');
      expect(result).toContain('# Page 2: (Controller 2)');
    });
  });

  // ==========================================================================
  // exportToCsv - Selected only
  // ==========================================================================

  describe('exportToCsv - selectedOnly', () => {
    it('should export only selected mappings when selectedOnly is true', () => {
      const mapping1 = createMockMapping({ id: 1, comment: 'Selected' });
      const mapping2 = createMockMapping({ id: 2, comment: 'Not Selected' });
      const mapping3 = createMockMapping({ id: 3, comment: 'Also Selected' });

      const device = createMockDevice([mapping1, mapping2, mapping3]);
      const result = exportToCsv([device], {
        columns: DEFAULT_CSV_COLUMNS,
        selectedOnly: true,
        selectedIds: new Set([1, 3]),
      });

      expect(result).toContain('Selected');
      expect(result).toContain('Also Selected');
      expect(result).not.toContain('Not Selected');
    });

    it('should export all mappings when selectedOnly is false', () => {
      const mapping1 = createMockMapping({ id: 1, comment: 'First' });
      const mapping2 = createMockMapping({ id: 2, comment: 'Second' });

      const device = createMockDevice([mapping1, mapping2]);
      const result = exportToCsv([device], {
        columns: DEFAULT_CSV_COLUMNS,
        selectedOnly: false,
        selectedIds: new Set([1]),
      });

      expect(result).toContain('First');
      expect(result).toContain('Second');
    });
  });

  // ==========================================================================
  // exportDeviceToCsv
  // ==========================================================================

  describe('exportDeviceToCsv', () => {
    it('should export single device', () => {
      const mapping = createMockMapping({ comment: 'Test Mapping' });
      const device = createMockDevice([mapping], 'Single Device');

      const result = exportDeviceToCsv(device, 0, {
        columns: DEFAULT_CSV_COLUMNS,
      });

      expect(result).toContain('Single Device');
      expect(result).toContain('Test Mapping');
    });
  });

  // ==========================================================================
  // generateCommandsReport
  // ==========================================================================

  describe('generateCommandsReport', () => {
    it('should return empty array for empty devices', () => {
      const result = generateCommandsReport([]);
      expect(result).toEqual([]);
    });

    it('should group mappings by command and type', () => {
      const mapping1 = createMockMapping({ commandId: 1, type: 0 }); // Play In
      const mapping2 = createMockMapping({ commandId: 1, type: 0 }); // Play In (duplicate)
      const mapping3 = createMockMapping({ commandId: 1, type: 1 }); // Play Out
      const mapping4 = createMockMapping({ commandId: 2, type: 0 }); // Cue In

      const device = createMockDevice([mapping1, mapping2, mapping3, mapping4]);
      const result = generateCommandsReport([device]);

      expect(result.length).toBe(3); // 3 unique command+type combos

      const playIn = result.find((r) => r.command === 'Play/Pause' && r.type === 'In');
      expect(playIn?.count).toBe(2);

      const playOut = result.find((r) => r.command === 'Play/Pause' && r.type === 'Out');
      expect(playOut?.count).toBe(1);

      const cueIn = result.find((r) => r.command === 'Cue' && r.type === 'In');
      expect(cueIn?.count).toBe(1);
    });

    it('should include device name in report', () => {
      const device = createMockDevice([createMockMapping()], 'My Controller');
      const result = generateCommandsReport([device]);

      expect(result[0].device).toBe('My Controller');
    });

    it('should use typeStr as fallback device name', () => {
      const device = createMockDevice([createMockMapping()], '', 'Generic MIDI');
      const result = generateCommandsReport([device]);

      expect(result[0].device).toBe('Generic MIDI');
    });

    it('should sort results by command name', () => {
      const mapping1 = createMockMapping({ commandId: 2 }); // Cue
      const mapping2 = createMockMapping({ commandId: 1 }); // Play/Pause

      const device = createMockDevice([mapping1, mapping2]);
      const result = generateCommandsReport([device]);

      // Cue comes before Play/Pause alphabetically
      expect(result[0].command).toBe('Cue');
      expect(result[1].command).toBe('Play/Pause');
    });
  });

  // ==========================================================================
  // generateConditionsSummary
  // ==========================================================================

  describe('generateConditionsSummary', () => {
    it('should return empty array for empty devices', () => {
      const result = generateConditionsSummary([]);
      expect(result).toEqual([]);
    });

    it('should skip mappings without conditions', () => {
      const mapping = createMockMapping({ hasConditions: false });
      const device = createMockDevice([mapping]);
      const result = generateConditionsSummary([device]);

      expect(result).toEqual([]);
    });

    it('should group mappings by condition combination', () => {
      const mapping1 = createMockMapping({
        hasConditions: true,
        condition1: { id: 1, target: 0, rawValue: new Uint8Array([1]), description: null },
        condition2: null,
      });
      const mapping2 = createMockMapping({
        hasConditions: true,
        condition1: { id: 1, target: 0, rawValue: new Uint8Array([1]), description: null },
        condition2: null,
      });

      const device = createMockDevice([mapping1, mapping2]);
      const result = generateConditionsSummary([device]);

      expect(result.length).toBe(1);
      expect(result[0].count).toBe(2);
    });

    it('should handle two conditions', () => {
      const mapping = createMockMapping({
        hasConditions: true,
        condition1: { id: 1, target: 0, rawValue: new Uint8Array([1]), description: null },
        condition2: { id: 2, target: 0, rawValue: new Uint8Array([0]), description: null },
      });

      const device = createMockDevice([mapping]);
      const result = generateConditionsSummary([device]);

      expect(result.length).toBe(1);
      expect(result[0].condition1).toContain('Is Playing');
      expect(result[0].condition2).toContain('Is Looping');
    });
  });

  // ==========================================================================
  // exportCommandsReportToCsv
  // ==========================================================================

  describe('exportCommandsReportToCsv', () => {
    it('should export commands report with header', () => {
      const rows: CommandReportRow[] = [
        { device: 'Controller', command: 'Play', type: 'In', count: 5 },
      ];

      const result = exportCommandsReportToCsv(rows);

      expect(result).toContain('\uFEFF');
      expect(result).toContain('Device,Command,Type,Count');
      expect(result).toContain('Controller,Play,In,5');
    });

    it('should use custom separator', () => {
      const rows: CommandReportRow[] = [
        { device: 'Controller', command: 'Play', type: 'In', count: 5 },
      ];

      const result = exportCommandsReportToCsv(rows, ';');

      expect(result).toContain('Device;Command;Type;Count');
      expect(result).toContain('Controller;Play;In;5');
    });

    it('should escape fields with separator', () => {
      const rows: CommandReportRow[] = [
        { device: 'My, Controller', command: 'Play', type: 'In', count: 5 },
      ];

      const result = exportCommandsReportToCsv(rows);

      expect(result).toContain('"My, Controller"');
    });
  });

  // ==========================================================================
  // exportConditionsSummaryToCsv
  // ==========================================================================

  describe('exportConditionsSummaryToCsv', () => {
    it('should export conditions summary with header', () => {
      const rows: ConditionCombinationRow[] = [
        { device: 'Controller', condition1: 'Is Playing = 1', condition2: '', count: 3 },
      ];

      const result = exportConditionsSummaryToCsv(rows);

      expect(result).toContain('\uFEFF');
      expect(result).toContain('Device,Condition 1,Condition 2,Count');
      expect(result).toContain('Controller,Is Playing = 1,,3');
    });

    it('should use custom separator', () => {
      const rows: ConditionCombinationRow[] = [
        { device: 'Controller', condition1: 'Is Playing = 1', condition2: '', count: 3 },
      ];

      const result = exportConditionsSummaryToCsv(rows, ';');

      expect(result).toContain('Device;Condition 1;Condition 2;Count');
    });

    it('should handle two conditions', () => {
      const rows: ConditionCombinationRow[] = [
        {
          device: 'Controller',
          condition1: 'Is Playing = 1',
          condition2: 'Is Looping = 0',
          count: 2,
        },
      ];

      const result = exportConditionsSummaryToCsv(rows);

      expect(result).toContain('Is Playing = 1,Is Looping = 0,2');
    });
  });
});

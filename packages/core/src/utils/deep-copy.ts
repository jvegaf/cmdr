/**
 * Deep Copy Utilities for TSI Data Structures
 *
 * AIDEV-NOTE: This module provides utilities for creating deep copies of TSI data structures.
 * Deep copies are essential for:
 * - Clipboard operations (copy/paste mappings)
 * - Undo/redo snapshots
 * - Duplicating mappings
 *
 * Key consideration: MappingSettingsData contains Uint8Array fields that must be copied
 * to avoid shared references between the original and copy.
 */

import type { MappingData } from '../format/Mapping.js';
import type { MappingSettingsData } from '../format/MappingSettings.js';

/**
 * Options for deep copying MappingData
 */
export interface DeepCopyMappingOptions {
  /**
   * Whether to preserve the original midiNoteBindingId.
   * - true: Keep the original binding ID (for undo/redo snapshots)
   * - false: Reset to -1 (for clipboard copy/paste, duplicates)
   * @default false
   */
  preserveBindingId?: boolean;
}

/**
 * Create a deep copy of MappingSettingsData
 *
 * AIDEV-NOTE: This handles the Uint8Array fields that require explicit copying:
 * - setValueTo
 * - conditionOneValue
 * - conditionTwoValue
 * - ledMinControllerRange
 * - ledMaxControllerRange
 *
 * @param settings The settings to copy
 * @returns A new MappingSettingsData with all fields deeply copied
 */
export function deepCopyMappingSettings(settings: MappingSettingsData): MappingSettingsData {
  return {
    ...settings,
    // Deep copy Uint8Array fields
    setValueTo: new Uint8Array(settings.setValueTo),
    conditionOneValue: new Uint8Array(settings.conditionOneValue),
    conditionTwoValue: new Uint8Array(settings.conditionTwoValue),
    ledMinControllerRange: new Uint8Array(settings.ledMinControllerRange),
    ledMaxControllerRange: new Uint8Array(settings.ledMaxControllerRange),
  };
}

/**
 * Create a deep copy of MappingData
 *
 * This function creates a complete deep copy of a mapping, including all nested
 * Uint8Array fields in the settings. Use the options parameter to control
 * whether the MIDI binding ID is preserved.
 *
 * @param data The mapping data to copy
 * @param options Configuration for the copy operation
 * @returns A new MappingData with all fields deeply copied
 *
 * @example
 * // For clipboard operations (reset binding ID)
 * const copy = deepCopyMappingData(original);
 *
 * @example
 * // For undo/redo snapshots (preserve binding ID)
 * const snapshot = deepCopyMappingData(original, { preserveBindingId: true });
 */
export function deepCopyMappingData(
  data: MappingData,
  options: DeepCopyMappingOptions = {}
): MappingData {
  const { preserveBindingId = false } = options;

  return {
    midiNoteBindingId: preserveBindingId ? data.midiNoteBindingId : -1,
    type: data.type,
    traktorControlId: data.traktorControlId,
    settings: deepCopyMappingSettings(data.settings),
  };
}

/**
 * Create deep copies of multiple MappingData items
 *
 * @param mappings Array of mapping data to copy
 * @param options Configuration for the copy operation
 * @returns Array of new MappingData with all fields deeply copied
 */
export function deepCopyMappingDataArray(
  mappings: MappingData[],
  options: DeepCopyMappingOptions = {}
): MappingData[] {
  return mappings.map((data) => deepCopyMappingData(data, options));
}

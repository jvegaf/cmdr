/**
 * FourCC - Four Character Code utilities
 *
 * AIDEV-NOTE: FourCC codes are used throughout the TSI binary format to identify
 * frame types and data structures. Each code is exactly 4 ASCII characters.
 *
 * Common FourCC codes in TSI format:
 * - "DIOM" - Device I/O mapping (root frame for mappings)
 * - "DEVI" - Device definition
 * - "MAPP" - Mapping entry
 * - "CMND" - Command definition
 * - "COND" - Condition definition
 * - "MDEF" - MIDI definition
 */

/**
 * Known FourCC codes in TSI format
 */
export const FourCC = {
  // Root frames
  DIOM: 'DIOM', // Device I/O Mappings
  DEVI: 'DEVI', // Device
  MAPP: 'MAPP', // Mapping

  // Mapping components
  CMND: 'CMND', // Command
  COND: 'COND', // Condition

  // MIDI definitions
  MDEF: 'MDEF', // MIDI Definition
  CHNL: 'CHNL', // Channel
  NOTE: 'NOTE', // Note
  CTRL: 'CTRL', // Control Change

  // Settings
  SETT: 'SETT', // Settings
  FXST: 'FXST', // FX Settings
} as const;

export type FourCCType = (typeof FourCC)[keyof typeof FourCC];

/**
 * Validates that a string is a valid FourCC code
 */
export function isValidFourCC(value: string): boolean {
  if (value.length !== 4) {
    return false;
  }
  // FourCC should be printable ASCII characters
  for (let i = 0; i < 4; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code > 0x7e) {
      return false;
    }
  }
  return true;
}

/**
 * Convert FourCC string to UInt32 for comparison
 */
export function fourCCToUInt32(fourCC: string): number {
  if (fourCC.length !== 4) {
    throw new Error(`FourCC must be exactly 4 characters, got "${fourCC}"`);
  }
  return (
    (fourCC.charCodeAt(0) << 24) |
    (fourCC.charCodeAt(1) << 16) |
    (fourCC.charCodeAt(2) << 8) |
    fourCC.charCodeAt(3)
  );
}

/**
 * Convert UInt32 to FourCC string
 */
export function uint32ToFourCC(value: number): string {
  return String.fromCharCode(
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff
  );
}

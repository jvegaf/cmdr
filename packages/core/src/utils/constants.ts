/**
 * Constants for TSI Binary Format
 *
 * AIDEV-NOTE: This module centralizes magic numbers and constants used in TSI parsing.
 * By giving these values descriptive names, we improve code readability and maintainability.
 */

/**
 * Sentinel value in frame version field that indicates Traktor 3+ format.
 * When the frame version equals this value, it should be interpreted as version 3.
 *
 * This is the maximum positive value for a signed 32-bit integer (2^31 - 1).
 */
export const FRAME_VERSION_SENTINEL = 2147483647;

/**
 * Current frame version for Traktor 3+ format.
 * Used when FRAME_VERSION_SENTINEL is encountered.
 */
export const CURRENT_FRAME_VERSION = 3;

/**
 * Legacy frame version value used in older TSI files.
 */
export const LEGACY_FRAME_VERSION = 2;

/**
 * No MIDI binding ID (-1 indicates no binding)
 */
export const NO_MIDI_BINDING_ID = -1;

/**
 * MIDI channel range constants
 */
export const MIDI_CHANNEL_MIN = 0;
export const MIDI_CHANNEL_MAX = 15;

/**
 * MIDI note/CC number range constants
 */
export const MIDI_NOTE_MIN = 0;
export const MIDI_NOTE_MAX = 127;

/**
 * Default history size for undo/redo
 */
export const DEFAULT_HISTORY_SIZE = 50;

/**
 * Maximum value for signed 32-bit integer.
 * Used for wrapping counters and ID searches.
 */
export const INT32_MAX = 2147483647;

/**
 * Maximum valid binding ID (INT32_MAX - 1).
 * When searching for next available ID, we check if maxId < this value.
 */
export const MAX_BINDING_ID = 2147483646;

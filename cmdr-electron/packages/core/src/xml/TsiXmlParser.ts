/**
 * TSI XML Parser - Extracts binary data from TSI XML files
 *
 * AIDEV-NOTE: TSI files are XML documents with Base64-encoded binary data.
 * The binary data is stored in Entry elements with specific names:
 * - "DeviceIO.Config.Controller" - Controller device mappings
 * - "DeviceIO.Config.Keyboard" - Keyboard mappings
 *
 * XML Structure:
 * <NIXML>
 *   <TraktorSettings>
 *     <Entry Name="DeviceIO.Config.Controller" Type="3" Value="base64data..." />
 *   </TraktorSettings>
 * </NIXML>
 */

export interface TsiXmlEntry {
  name: string;
  type: string;
  value: string;
}

export interface TsiXmlData {
  controllerData: string | null; // Base64 encoded binary for controllers
  keyboardData: string | null; // Base64 encoded binary for keyboard
  traktorVersion: string | null;
  entries: Map<string, TsiXmlEntry>;
}

const CONTROLLER_ENTRY_NAME = 'DeviceIO.Config.Controller';
const KEYBOARD_ENTRY_NAME = 'DeviceIO.Config.Keyboard';
const BROWSER_DIR_ROOT = 'Browser.Dir.Root';

/**
 * Parse TSI XML content and extract entry values
 */
export function parseTsiXml(xmlContent: string): TsiXmlData {
  const result: TsiXmlData = {
    controllerData: null,
    keyboardData: null,
    traktorVersion: null,
    entries: new Map(),
  };

  // Simple regex-based XML parsing (TSI files have predictable structure)
  // AIDEV-NOTE: TSI entries can be either:
  // - Self-closing: <Entry Name="..." Type="..." Value="..." />
  // - Regular: <Entry Name="..." Type="..." Value="..."></Entry>
  const entryRegex = /<Entry\s+Name="([^"]+)"\s+Type="([^"]+)"\s+Value="([^"]*)"(?:\s*\/>|><\/Entry>)/g;

  for (const match of xmlContent.matchAll(entryRegex)) {
    const [, name, type, value] = match;
    if (name && type && value !== undefined) {
      result.entries.set(name, { name, type, value });

      if (name === CONTROLLER_ENTRY_NAME) {
        result.controllerData = value;
      } else if (name === KEYBOARD_ENTRY_NAME) {
        result.keyboardData = value;
      } else if (name === BROWSER_DIR_ROOT) {
        // Extract Traktor version from path like "C:\Users\...\Traktor 3.11.0\"
        const versionMatch = /Traktor\s+(\d+\.\d+\.\d+)/.exec(value);
        if (versionMatch?.[1]) {
          result.traktorVersion = versionMatch[1];
        }
      }
    }
  }

  return result;
}

/**
 * Build TSI XML content from entries
 */
export function buildTsiXml(data: TsiXmlData): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
    '<NIXML><TraktorSettings>',
  ];

  // Add all entries
  for (const entry of data.entries.values()) {
    lines.push(`<Entry Name="${entry.name}" Type="${entry.type}" Value="${entry.value}" />`);
  }

  // Add controller data if present
  if (data.controllerData && !data.entries.has(CONTROLLER_ENTRY_NAME)) {
    lines.push(
      `<Entry Name="${CONTROLLER_ENTRY_NAME}" Type="3" Value="${data.controllerData}" />`
    );
  }

  // Add keyboard data if present
  if (data.keyboardData && !data.entries.has(KEYBOARD_ENTRY_NAME)) {
    lines.push(`<Entry Name="${KEYBOARD_ENTRY_NAME}" Type="3" Value="${data.keyboardData}" />`);
  }

  lines.push('</TraktorSettings></NIXML>');

  return lines.join('\n');
}

/**
 * Read TSI file content as text
 * Works in both Node.js and browser environments
 */
export async function readTsiFile(file: File | ArrayBuffer | string): Promise<string> {
  if (typeof file === 'string') {
    // Already a string
    return file;
  }

  if (file instanceof ArrayBuffer) {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(file);
  }

  // File object (browser)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

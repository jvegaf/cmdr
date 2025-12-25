/**
 * CSV Export Utility
 *
 * AIDEV-NOTE: Exports mappings to CSV format.
 * Matches the WPF app's CSV export functionality with configurable columns.
 *
 * Columns available:
 * - Device: Device index/name
 * - Id: Mapping ID
 * - Type: In/Out mapping type
 * - Command: Traktor command name
 * - Assignment: Target assignment (Deck A, FX Unit 1, etc.)
 * - Conditions: Condition expression
 * - Interaction: Control type and interaction mode
 * - MidiBinding: MIDI note/CC binding
 * - Comment: User comment
 */

import type { Device, Mapping } from "@cmdr/core";
import {
	getCommandDescription,
	getConditionDescription,
	getControlTypeName,
	getInteractionModeName,
	getTargetDeckName,
	MappingType,
} from "@cmdr/core";

// ============================================================================
// Types
// ============================================================================

/**
 * Available columns for CSV export
 */
export type CsvColumn =
	| "device"
	| "id"
	| "type"
	| "command"
	| "assignment"
	| "conditions"
	| "interaction"
	| "midiBinding"
	| "comment";

/**
 * Column configuration
 */
export interface CsvColumnConfig {
	key: CsvColumn;
	label: string;
	enabled: boolean;
}

/**
 * Default column configuration
 */
export const DEFAULT_CSV_COLUMNS: CsvColumnConfig[] = [
	{ key: "device", label: "Device", enabled: true },
	{ key: "id", label: "ID", enabled: true },
	{ key: "type", label: "Type", enabled: true },
	{ key: "command", label: "Command", enabled: true },
	{ key: "assignment", label: "Assignment", enabled: true },
	{ key: "conditions", label: "Conditions", enabled: true },
	{ key: "interaction", label: "Interaction", enabled: true },
	{ key: "midiBinding", label: "MIDI Binding", enabled: true },
	{ key: "comment", label: "Comment", enabled: true },
];

/**
 * Export options
 */
export interface CsvExportOptions {
	/** Columns to include */
	columns: CsvColumnConfig[];
	/** Field separator (default: comma) */
	separator?: string;
	/** Include header row */
	includeHeader?: boolean;
	/** Export only selected mappings */
	selectedOnly?: boolean;
	/** Selected mapping IDs (required if selectedOnly is true) */
	selectedIds?: Set<number>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Escape a CSV field value
 * - Wraps in quotes if contains separator, quotes, or newlines
 * - Escapes quotes by doubling them
 */
function escapeField(value: string, separator: string): string {
	if (
		value.includes(separator) ||
		value.includes('"') ||
		value.includes("\n") ||
		value.includes("\r")
	) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

/**
 * Get mapping type string
 */
function getMappingTypeString(mapping: Mapping): string {
	return mapping.type === MappingType.In ? "In" : "Out";
}

/**
 * Get command name
 */
function getCommandName(mapping: Mapping): string {
	const cmd = getCommandDescription(mapping.commandId);
	return cmd?.name ?? `Unknown (${mapping.commandId})`;
}

/**
 * Get assignment expression (target deck/FX unit)
 */
function getAssignmentExpression(mapping: Mapping): string {
	return getTargetDeckName(mapping.target);
}

/**
 * Get condition expression
 */
function getConditionExpression(mapping: Mapping): string {
	const parts: string[] = [];

	if (mapping.condition1) {
		const cond = getConditionDescription(mapping.condition1.id);
		const name = cond?.name ?? `Condition ${mapping.condition1.id}`;
		const target = getTargetDeckName(mapping.condition1.target);
		parts.push(`${name} (${target}) = ${mapping.condition1.rawValue}`);
	}

	if (mapping.condition2) {
		const cond = getConditionDescription(mapping.condition2.id);
		const name = cond?.name ?? `Condition ${mapping.condition2.id}`;
		const target = getTargetDeckName(mapping.condition2.target);
		parts.push(`${name} (${target}) = ${mapping.condition2.rawValue}`);
	}

	return parts.join(" AND ");
}

/**
 * Get interaction mode string
 */
function getInteractionString(mapping: Mapping): string {
	const controlType = getControlTypeName(mapping.controlType);
	const interactionMode = getInteractionModeName(mapping.interactionMode);
	return `${controlType} - ${interactionMode}`;
}

/**
 * Get MIDI binding string
 */
function getMidiBindingString(mapping: Mapping): string {
	if (!mapping.midiBinding) {
		return "";
	}
	return mapping.midiBinding.note;
}

/**
 * Get field value for a mapping
 */
function getFieldValue(
	mapping: Mapping,
	column: CsvColumn,
	deviceIndex: number,
	deviceName: string,
): string {
	switch (column) {
		case "device":
			return deviceName || `Device ${deviceIndex}`;
		case "id":
			return String(mapping.id);
		case "type":
			return getMappingTypeString(mapping);
		case "command":
			return getCommandName(mapping);
		case "assignment":
			return getAssignmentExpression(mapping);
		case "conditions":
			return getConditionExpression(mapping);
		case "interaction":
			return getInteractionString(mapping);
		case "midiBinding":
			return getMidiBindingString(mapping);
		case "comment":
			return mapping.comment;
		default:
			return "";
	}
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Export devices/mappings to CSV string
 */
export function exportToCsv(
	devices: Device[],
	options: CsvExportOptions,
): string {
	const separator = options.separator ?? ",";
	const includeHeader = options.includeHeader ?? true;
	const enabledColumns = options.columns.filter((c) => c.enabled);

	const lines: string[] = [];

	// Add BOM for Excel compatibility
	const BOM = "\uFEFF";

	// Header row
	if (includeHeader) {
		const headerRow = enabledColumns
			.map((c) => escapeField(c.label, separator))
			.join(separator);
		lines.push(headerRow);
	}

	// Data rows
	devices.forEach((device, deviceIndex) => {
		const deviceName = device.comment || `Device ${deviceIndex + 1}`;

		// Add device separator comment (like WPF app)
		lines.push(`#`);
		lines.push(`# Page ${deviceIndex + 1}: (${deviceName})`);
		lines.push(`#`);

		for (const mapping of device.mappings) {
			// Skip if selectedOnly and not in selection
			if (options.selectedOnly && options.selectedIds) {
				if (!options.selectedIds.has(mapping.id)) {
					continue;
				}
			}

			const row = enabledColumns
				.map((col) =>
					escapeField(
						getFieldValue(mapping, col.key, deviceIndex + 1, deviceName),
						separator,
					),
				)
				.join(separator);

			lines.push(row);
		}
	});

	return BOM + lines.join("\n");
}

/**
 * Export single device's mappings to CSV
 */
export function exportDeviceToCsv(
	device: Device,
	_deviceIndex: number,
	options: CsvExportOptions,
): string {
	return exportToCsv([device], {
		...options,
		// Override to treat as single device
	});
}

// ============================================================================
// Reports
// ============================================================================

/**
 * Command usage report row
 */
export interface CommandReportRow {
	device: string;
	command: string;
	type: string;
	count: number;
}

/**
 * Generate command usage report
 * Groups mappings by device, command, and type
 */
export function generateCommandsReport(devices: Device[]): CommandReportRow[] {
	const rows: CommandReportRow[] = [];

	for (const device of devices) {
		const deviceName = device.comment || device.typeStr || "Unknown Device";

		// Group by command + type
		const groups = new Map<string, CommandReportRow>();

		for (const mapping of device.mappings) {
			const command = getCommandName(mapping);
			const type = getMappingTypeString(mapping);
			const key = `${command}|${type}`;

			const existing = groups.get(key);
			if (existing) {
				existing.count++;
			} else {
				groups.set(key, {
					device: deviceName,
					command,
					type,
					count: 1,
				});
			}
		}

		rows.push(...groups.values());
	}

	// Sort by command name
	return rows.sort((a, b) => a.command.localeCompare(b.command));
}

/**
 * Condition combination row
 */
export interface ConditionCombinationRow {
	device: string;
	condition1: string;
	condition2: string;
	count: number;
}

/**
 * Generate conditions summary report
 * Shows unique condition combinations used
 */
export function generateConditionsSummary(
	devices: Device[],
): ConditionCombinationRow[] {
	const rows: ConditionCombinationRow[] = [];

	for (const device of devices) {
		const deviceName = device.comment || device.typeStr || "Unknown Device";

		// Group by condition combination
		const groups = new Map<string, ConditionCombinationRow>();

		for (const mapping of device.mappings) {
			if (!mapping.hasConditions) continue;

			const cond1 = mapping.condition1
				? `${getConditionDescription(mapping.condition1.id)?.name ?? "Unknown"} = ${mapping.condition1.rawValue}`
				: "";
			const cond2 = mapping.condition2
				? `${getConditionDescription(mapping.condition2.id)?.name ?? "Unknown"} = ${mapping.condition2.rawValue}`
				: "";

			const key = `${cond1}|${cond2}`;

			const existing = groups.get(key);
			if (existing) {
				existing.count++;
			} else {
				groups.set(key, {
					device: deviceName,
					condition1: cond1,
					condition2: cond2,
					count: 1,
				});
			}
		}

		rows.push(...groups.values());
	}

	// Sort by condition1
	return rows.sort((a, b) => a.condition1.localeCompare(b.condition1));
}

/**
 * Export commands report to CSV
 */
export function exportCommandsReportToCsv(
	rows: CommandReportRow[],
	separator = ",",
): string {
	const BOM = "\uFEFF";
	const lines: string[] = [];

	// Header
	lines.push(
		["Device", "Command", "Type", "Count"]
			.map((h) => escapeField(h, separator))
			.join(separator),
	);

	// Data
	for (const row of rows) {
		lines.push(
			[row.device, row.command, row.type, String(row.count)]
				.map((v) => escapeField(v, separator))
				.join(separator),
		);
	}

	return BOM + lines.join("\n");
}

/**
 * Export conditions summary to CSV
 */
export function exportConditionsSummaryToCsv(
	rows: ConditionCombinationRow[],
	separator = ",",
): string {
	const BOM = "\uFEFF";
	const lines: string[] = [];

	// Header
	lines.push(
		["Device", "Condition 1", "Condition 2", "Count"]
			.map((h) => escapeField(h, separator))
			.join(separator),
	);

	// Data
	for (const row of rows) {
		lines.push(
			[row.device, row.condition1, row.condition2, String(row.count)]
				.map((v) => escapeField(v, separator))
				.join(separator),
		);
	}

	return BOM + lines.join("\n");
}

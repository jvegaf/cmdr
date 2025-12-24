/**
 * Export Dialog Component
 *
 * AIDEV-NOTE: Modal dialog for configuring CSV export options.
 * Allows users to select which columns to include in the export.
 */

import { Download, FileSpreadsheet } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
	type CsvColumnConfig,
	DEFAULT_CSV_COLUMNS,
} from "../../lib/csv-export";
import { cn } from "../../lib/utils";
import { Button, Checkbox } from "../ui";

// ============================================================================
// Types
// ============================================================================

export interface ExportDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** Number of mappings to export */
	mappingCount: number;
	/** Whether exporting selected mappings only */
	selectedOnly: boolean;
	/** Called when export is confirmed */
	onExport: (columns: CsvColumnConfig[]) => void;
	/** Called when cancelled */
	onCancel: () => void;
}

// ============================================================================
// ExportDialog Component
// ============================================================================

/**
 * Modal dialog for CSV export configuration
 */
export function ExportDialog({
	open,
	mappingCount,
	selectedOnly,
	onExport,
	onCancel,
}: ExportDialogProps) {
	const dialogRef = useRef<HTMLDivElement>(null);
	const [columns, setColumns] = useState<CsvColumnConfig[]>(
		() => structuredClone(DEFAULT_CSV_COLUMNS),
	);

	// Reset columns when dialog opens
	useEffect(() => {
		if (open) {
			setColumns(structuredClone(DEFAULT_CSV_COLUMNS));
		}
	}, [open]);

	// Escape key handling
	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				onCancel();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [open, onCancel]);

	// Focus the dialog when opened
	useEffect(() => {
		if (open && dialogRef.current) {
			dialogRef.current.focus();
		}
	}, [open]);

	// Toggle column
	const toggleColumn = useCallback((key: string) => {
		setColumns((prev) =>
			prev.map((col) =>
				col.key === key ? { ...col, enabled: !col.enabled } : col,
			),
		);
	}, []);

	// Select all columns
	const selectAll = useCallback(() => {
		setColumns((prev) => prev.map((col) => ({ ...col, enabled: true })));
	}, []);

	// Deselect all columns
	const deselectAll = useCallback(() => {
		setColumns((prev) => prev.map((col) => ({ ...col, enabled: false })));
	}, []);

	// Handle export
	const handleExport = useCallback(() => {
		onExport(columns);
	}, [columns, onExport]);

	// Check if any columns are selected
	const hasSelectedColumns = columns.some((c) => c.enabled);

	if (!open) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			{/* Backdrop */}
			<button
				type="button"
				className="absolute inset-0 cursor-default"
				onClick={onCancel}
				aria-label="Close dialog"
			/>
			<div
				ref={dialogRef}
				className={cn(
					"bg-card border border-border rounded-lg shadow-lg",
					"min-w-[400px] max-w-[500px] p-6",
					"animate-in fade-in-0 zoom-in-95",
				)}
				role="dialog"
				aria-modal="true"
				aria-labelledby="export-dialog-title"
				tabIndex={-1}
			>
				{/* Header */}
				<div className="flex items-center gap-3 mb-4">
					<div className="p-2 bg-primary/10 rounded-lg">
						<FileSpreadsheet className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h2 id="export-dialog-title" className="text-lg font-semibold">
							Export to CSV
						</h2>
						<p className="text-sm text-muted-foreground">
							{selectedOnly
								? `Export ${mappingCount} selected mapping${mappingCount !== 1 ? "s" : ""}`
								: `Export all ${mappingCount} mapping${mappingCount !== 1 ? "s" : ""}`}
						</p>
					</div>
				</div>

				{/* Column selection */}
				<div className="mb-6">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-medium">Columns to include</h3>
						<div className="flex gap-2">
							<Button variant="ghost" size="sm" onClick={selectAll}>
								Select All
							</Button>
							<Button variant="ghost" size="sm" onClick={deselectAll}>
								Deselect All
							</Button>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg">
						{columns.map((col) => (
							<button
								key={col.key}
								type="button"
								className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded text-left"
								onClick={() => toggleColumn(col.key)}
							>
								<Checkbox
									checked={col.enabled}
									onChange={() => toggleColumn(col.key)}
								/>
								<span className="text-sm">{col.label}</span>
							</button>
						))}
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center justify-end gap-2">
					<Button variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button onClick={handleExport} disabled={!hasSelectedColumns}>
						<Download className="mr-2 h-4 w-4" />
						Export CSV
					</Button>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// useExportDialog Hook
// ============================================================================

export interface UseExportDialogOptions {
	/** Number of mappings to export */
	mappingCount: number;
	/** Whether exporting selected mappings only */
	selectedOnly: boolean;
}

export interface UseExportDialogReturn {
	/** Whether the dialog is open */
	isOpen: boolean;
	/** Open the dialog and return a promise that resolves with columns or null if cancelled */
	openDialog: () => Promise<CsvColumnConfig[] | null>;
	/** Dialog props to spread onto ExportDialog */
	dialogProps: ExportDialogProps;
	/** Update the options (mapping count, selectedOnly) */
	updateOptions: (options: Partial<UseExportDialogOptions>) => void;
}

/**
 * Hook for programmatic export dialog control
 */
export function useExportDialog(
	initialOptions: UseExportDialogOptions,
): UseExportDialogReturn {
	const [isOpen, setIsOpen] = useState(false);
	const [options, setOptions] =
		useState<UseExportDialogOptions>(initialOptions);
	const resolverRef = useRef<
		((value: CsvColumnConfig[] | null) => void) | null
	>(null);

	const openDialog = useCallback(() => {
		setIsOpen(true);
		return new Promise<CsvColumnConfig[] | null>((resolve) => {
			resolverRef.current = resolve;
		});
	}, []);

	const handleExport = useCallback((columns: CsvColumnConfig[]) => {
		setIsOpen(false);
		resolverRef.current?.(columns);
		resolverRef.current = null;
	}, []);

	const handleCancel = useCallback(() => {
		setIsOpen(false);
		resolverRef.current?.(null);
		resolverRef.current = null;
	}, []);

	const updateOptions = useCallback(
		(newOptions: Partial<UseExportDialogOptions>) => {
			setOptions((prev) => ({ ...prev, ...newOptions }));
		},
		[],
	);

	const dialogProps: ExportDialogProps = {
		open: isOpen,
		mappingCount: options.mappingCount,
		selectedOnly: options.selectedOnly,
		onExport: handleExport,
		onCancel: handleCancel,
	};

	return {
		isOpen,
		openDialog,
		dialogProps,
		updateOptions,
	};
}

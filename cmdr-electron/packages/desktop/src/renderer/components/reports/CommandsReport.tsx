/**
 * Commands Report Component
 *
 * AIDEV-NOTE: Shows command usage grouped by device.
 * Displays count of each command type used across devices.
 */

import { X } from "lucide-react";
import { useMemo, useState } from "react";

import type { CommandReportRow } from "../../lib/csv-export";
import { cn } from "../../lib/utils";
import { Button, Input } from "../ui";

// ============================================================================
// Types
// ============================================================================

export interface CommandsReportProps {
	/** Whether the dialog is open */
	open: boolean;
	/** Report data rows */
	rows: CommandReportRow[];
	/** Called when closed */
	onClose: () => void;
	/** Called to export as CSV */
	onExportCsv?: () => void;
}

// ============================================================================
// CommandsReport Component
// ============================================================================

export function CommandsReport({
	open,
	rows,
	onClose,
	onExportCsv,
}: CommandsReportProps) {
	const [search, setSearch] = useState("");
	const [sortColumn, setSortColumn] = useState<keyof CommandReportRow>("command");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

	// Filter and sort rows
	const filteredRows = useMemo(() => {
		let result = rows;

		// Filter by search
		if (search) {
			const lower = search.toLowerCase();
			result = result.filter(
				(row) =>
					row.command.toLowerCase().includes(lower) ||
					row.device.toLowerCase().includes(lower) ||
					row.type.toLowerCase().includes(lower),
			);
		}

		// Sort
		result = [...result].sort((a, b) => {
			const aVal = a[sortColumn];
			const bVal = b[sortColumn];
			const cmp =
				typeof aVal === "number" && typeof bVal === "number"
					? aVal - bVal
					: String(aVal).localeCompare(String(bVal));
			return sortDirection === "asc" ? cmp : -cmp;
		});

		return result;
	}, [rows, search, sortColumn, sortDirection]);

	// Toggle sort
	const handleSort = (column: keyof CommandReportRow) => {
		if (sortColumn === column) {
			setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortColumn(column);
			setSortDirection("asc");
		}
	};

	// Get sort indicator
	const getSortIndicator = (column: keyof CommandReportRow) => {
		if (sortColumn !== column) return null;
		return sortDirection === "asc" ? " ↑" : " ↓";
	};

	// Summary stats
	const totalCommands = rows.length;
	const totalMappings = rows.reduce((sum, r) => sum + r.count, 0);
	const uniqueDevices = new Set(rows.map((r) => r.device)).size;

	if (!open) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			{/* Backdrop */}
			<button
				type="button"
				className="absolute inset-0 cursor-default"
				onClick={onClose}
				aria-label="Close dialog"
			/>
			<div
				className={cn(
					"bg-card border border-border rounded-lg shadow-lg",
					"w-[800px] max-w-[90vw] max-h-[80vh] flex flex-col",
					"animate-in fade-in-0 zoom-in-95",
				)}
				role="dialog"
				aria-modal="true"
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border px-4 py-3">
					<div>
						<h2 className="text-lg font-semibold">Commands Overview</h2>
						<p className="text-sm text-muted-foreground">
							{uniqueDevices} device{uniqueDevices !== 1 ? "s" : ""} •{" "}
							{totalCommands} unique command{totalCommands !== 1 ? "s" : ""} •{" "}
							{totalMappings} total mapping{totalMappings !== 1 ? "s" : ""}
						</p>
					</div>
					<Button variant="ghost" size="sm" onClick={onClose}>
						<X className="h-4 w-4" />
					</Button>
				</div>

				{/* Toolbar */}
				<div className="flex items-center gap-2 border-b border-border px-4 py-2">
					<Input
						placeholder="Search commands..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-64"
					/>
					{onExportCsv && (
						<Button variant="outline" size="sm" onClick={onExportCsv}>
							Export CSV
						</Button>
					)}
				</div>

				{/* Table */}
				<div className="flex-1 overflow-auto">
					<table className="w-full text-sm">
						<thead className="sticky top-0 bg-muted">
							<tr>
								<th
									className="px-4 py-2 text-left font-medium cursor-pointer hover:bg-muted/80"
									onClick={() => handleSort("device")}
								>
									Device{getSortIndicator("device")}
								</th>
								<th
									className="px-4 py-2 text-left font-medium cursor-pointer hover:bg-muted/80"
									onClick={() => handleSort("command")}
								>
									Command{getSortIndicator("command")}
								</th>
								<th
									className="px-4 py-2 text-left font-medium cursor-pointer hover:bg-muted/80"
									onClick={() => handleSort("type")}
								>
									Type{getSortIndicator("type")}
								</th>
								<th
									className="px-4 py-2 text-right font-medium cursor-pointer hover:bg-muted/80"
									onClick={() => handleSort("count")}
								>
									Count{getSortIndicator("count")}
								</th>
							</tr>
						</thead>
						<tbody>
							{filteredRows.map((row, idx) => (
								<tr
									key={`${row.device}-${row.command}-${row.type}-${idx}`}
									className="border-b border-border hover:bg-muted/30"
								>
									<td className="px-4 py-2 text-muted-foreground">
										{row.device}
									</td>
									<td className="px-4 py-2">{row.command}</td>
									<td className="px-4 py-2">
										<span
											className={cn(
												"px-2 py-0.5 rounded-full text-xs",
												row.type === "In"
													? "bg-blue-500/20 text-blue-400"
													: "bg-green-500/20 text-green-400",
											)}
										>
											{row.type}
										</span>
									</td>
									<td className="px-4 py-2 text-right font-mono">
										{row.count}
									</td>
								</tr>
							))}
							{filteredRows.length === 0 && (
								<tr>
									<td
										colSpan={4}
										className="px-4 py-8 text-center text-muted-foreground"
									>
										No commands found
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

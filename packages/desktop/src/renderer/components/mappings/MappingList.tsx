/**
 * MappingList Component
 *
 * AIDEV-NOTE: Displays mappings in a virtualized table with sorting, selection, and resizable columns.
 * Uses @tanstack/react-table for the data table and @tanstack/react-virtual for virtualization.
 *
 * Features:
 * - Virtualized rows for large mapping lists (1000+ mappings)
 * - Column sorting (click header)
 * - Column resizing (drag column borders) - persisted to localStorage
 * - Multi-select with Ctrl+click and Shift+click
 * - Row highlight for selected items
 * - Columns: #, I/O, Command, MIDI, Conditions, Comment
 * - Search highlighting (Phase 15)
 */

import type { Mapping } from "@cmdr/core";
import {
	type ColumnDef,
	type ColumnSizingState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type RowSelectionState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, ArrowUpDown, SearchX } from "lucide-react";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { cn } from "../../lib/utils";
import {
	type ColumnWidths,
	DEFAULT_COLUMN_WIDTHS,
	useColumnWidths,
	useUpdateColumnWidths,
} from "../../store/appStore";

// ============================================================================
// Types
// ============================================================================

export interface MappingListProps {
	/** List of mappings to display (already filtered) */
	mappings: readonly Mapping[];
	/** Set of selected mapping IDs */
	selectedIds: Set<number>;
	/** Callback when selection changes */
	onSelectionChange?: (selectedIds: Set<number>) => void;
	/** Callback when a mapping is double-clicked (edit) */
	onMappingDoubleClick?: (mapping: Mapping) => void;
	/** Height of the container (for virtualization) */
	height?: number;
	/** Total count before filtering (for showing "X of Y" message) */
	totalCount?: number;
	/** Whether filtering is active */
	isFiltered?: boolean;
	/** Search query for highlighting matches */
	searchQuery?: string;
}

// ============================================================================
// Column Definitions
// ============================================================================

// AIDEV-NOTE: Column sizes are stored in appStore and persisted to localStorage.
// Default sizes are defined in DEFAULT_COLUMN_WIDTHS.
// Columns can be resized by dragging the border between column headers.
// The 'index' and 'io' columns have fixed sizes (not resizable).
function createColumns(): ColumnDef<Mapping>[] {
	return [
		{
			id: "index",
			header: "#",
			size: DEFAULT_COLUMN_WIDTHS.index,
			minSize: 35,
			maxSize: 60,
			enableResizing: false,
			cell: ({ row }) => (
				<span className="text-muted-foreground">{row.index + 1}</span>
			),
			enableSorting: false,
		},
		{
			id: "io",
			header: "I/O",
			size: DEFAULT_COLUMN_WIDTHS.io,
			minSize: 35,
			maxSize: 60,
			enableResizing: false,
			cell: ({ row }) => {
				const isInput = row.original.isInput;
				return (
					<span
						className={cn(
							"text-xs font-medium px-1.5 py-0.5 rounded",
							isInput
								? "bg-blue-500/20 text-blue-400"
								: "bg-amber-500/20 text-amber-400",
						)}
						title={isInput ? "Input: MIDI → Traktor" : "Output: Traktor → LED"}
					>
						{isInput ? "In" : "Out"}
					</span>
				);
			},
			accessorFn: (row) => (row.isInput ? "In" : "Out"),
		},
		{
			id: "commandName",
			accessorKey: "commandName",
			header: ({ column }) => {
				const sorted = column.getIsSorted();
				return (
					<button
						type="button"
						className="flex items-center gap-1 hover:text-foreground"
						onClick={() => column.toggleSorting()}
					>
						Command
						{sorted === "asc" ? (
							<ArrowUp className="h-3 w-3" />
						) : sorted === "desc" ? (
							<ArrowDown className="h-3 w-3" />
						) : (
							<ArrowUpDown className="h-3 w-3 opacity-50" />
						)}
					</button>
				);
			},
			size: DEFAULT_COLUMN_WIDTHS.commandName,
			minSize: 100,
			enableResizing: true,
			cell: ({ row }) => (
				<span className="font-medium truncate" title={row.original.commandName}>
					{row.original.commandName}
				</span>
			),
		},
		{
			id: "midi",
			header: "MIDI",
			size: DEFAULT_COLUMN_WIDTHS.midi,
			minSize: 70,
			enableResizing: true,
			cell: ({ row }) => {
				const binding = row.original.midiBinding;
				if (!binding) {
					return <span className="text-muted-foreground">—</span>;
				}
				return <span className="font-mono text-xs">{binding.note}</span>;
			},
			accessorFn: (row) => row.midiBinding?.note ?? "",
		},
		{
			id: "conditions",
			header: "Conditions",
			size: DEFAULT_COLUMN_WIDTHS.conditions,
			minSize: 100,
			enableResizing: true,
			cell: ({ row }) => {
				const cond1 = row.original.condition1;
				const cond2 = row.original.condition2;

				if (!cond1 && !cond2) {
					return <span className="text-muted-foreground">—</span>;
				}

				const parts: string[] = [];
				if (cond1) {
					const name = cond1.description?.name ?? `Condition ${cond1.id}`;
					const value =
						cond1.rawValue !== undefined ? ` = ${cond1.rawValue}` : "";
					parts.push(`${name}${value}`);
				}
				if (cond2) {
					const name = cond2.description?.name ?? `Condition ${cond2.id}`;
					const value =
						cond2.rawValue !== undefined ? ` = ${cond2.rawValue}` : "";
					parts.push(`${name}${value}`);
				}

				const fullText = parts.join(" + ");

				return (
					<span className="text-xs truncate" title={fullText}>
						{fullText}
					</span>
				);
			},
		},
		{
			id: "comment",
			accessorKey: "comment",
			header: "Comment",
			size: DEFAULT_COLUMN_WIDTHS.comment,
			minSize: 60,
			enableResizing: true,
			cell: ({ row }) => {
				const comment = row.original.comment;
				if (!comment) {
					return <span className="text-muted-foreground">—</span>;
				}
				return (
					<span className="truncate text-muted-foreground" title={comment}>
						{comment}
					</span>
				);
			},
		},
	];
}

// ============================================================================
// Column Resize Handle Component
// AIDEV-NOTE: This component handles column resizing via mouse/touch drag.
// The resize handler is passed from react-table's header.getResizeHandler()
// ============================================================================

interface ResizeHandleProps {
	getHandler: () => (e: unknown) => void;
	isResizing: boolean;
}

/**
 * Visual resize handle that appears between column headers.
 * Supports mouse and touch events for dragging.
 */
const ResizeHandle = ({ getHandler, isResizing }: ResizeHandleProps) => {
	const handler = getHandler();
	// Using onPointerDown which is better for both mouse and touch
	const onPointerDown = (e: React.PointerEvent) => {
		e.preventDefault();
		handler(e);
	};

	return (
		<div
			onPointerDown={onPointerDown}
			className={cn(
				"absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none z-10",
				"hover:bg-primary/50",
				isResizing && "bg-primary",
			)}
			style={{ transform: "translateX(50%)" }}
		/>
	);
};

// ============================================================================
// MappingList Component
// ============================================================================

export function MappingList({
	mappings,
	selectedIds,
	onSelectionChange,
	onMappingDoubleClick,
	height: propHeight,
	totalCount,
	isFiltered = false,
	searchQuery = "",
}: MappingListProps) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const tableContainerRef = useRef<HTMLDivElement>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

	// AIDEV-NOTE: We need a numeric height for the virtualizer to work.
	// If propHeight is provided, use it. Otherwise, measure the available space
	// in the wrapper container using ResizeObserver.
	const [measuredHeight, setMeasuredHeight] = useState<number>(400);

	useLayoutEffect(() => {
		// If explicit height provided, use it
		if (propHeight !== undefined) {
			setMeasuredHeight(propHeight);
			return;
		}

		const wrapper = wrapperRef.current;
		if (!wrapper) return;

		// Measure available height using ResizeObserver
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				// Use contentBoxSize if available, otherwise fall back to contentRect
				const height =
					entry.contentBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
				if (height > 0) {
					setMeasuredHeight(height);
				}
			}
		});

		resizeObserver.observe(wrapper);

		// Initial measurement
		const rect = wrapper.getBoundingClientRect();
		if (rect.height > 0) {
			setMeasuredHeight(rect.height);
		}

		return () => {
			resizeObserver.disconnect();
		};
	}, [propHeight]);

	// Get persisted column widths from store (hook always returns valid defaults)
	const storedColumnWidths = useColumnWidths();
	const updateColumnWidths = useUpdateColumnWidths();

	// AIDEV-NOTE: Column sizing state for react-table.
	// Initialized with DEFAULT_COLUMN_WIDTHS to avoid issues with Zustand hydration.
	// The useEffect below syncs with persisted widths after store hydrates.
	const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({
		index: DEFAULT_COLUMN_WIDTHS.index,
		io: DEFAULT_COLUMN_WIDTHS.io,
		commandName: DEFAULT_COLUMN_WIDTHS.commandName,
		midi: DEFAULT_COLUMN_WIDTHS.midi,
		conditions: DEFAULT_COLUMN_WIDTHS.conditions,
		comment: DEFAULT_COLUMN_WIDTHS.comment,
	});

	// Track if user is currently resizing (to avoid overwriting their changes)
	const isResizingRef = useRef(false);

	// Sync column sizing from persisted store (on mount and when store hydrates)
	useEffect(() => {
		// Don't override if user is actively resizing
		if (isResizingRef.current) return;

		setColumnSizing({
			index: storedColumnWidths.index,
			io: storedColumnWidths.io,
			commandName: storedColumnWidths.commandName,
			midi: storedColumnWidths.midi,
			conditions: storedColumnWidths.conditions,
			comment: storedColumnWidths.comment,
		});
	}, [storedColumnWidths]);

	// Persist column widths when they change (debounced)
	const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		// Clear any pending save
		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
		}

		// Debounce save to avoid excessive writes during resize
		saveTimeoutRef.current = setTimeout(() => {
			const updates: Partial<ColumnWidths> = {};
			let hasChanges = false;

			// Only save columns that have changed
			for (const [key, value] of Object.entries(columnSizing)) {
				const columnKey = key as keyof ColumnWidths;
				if (storedColumnWidths[columnKey] !== value) {
					updates[columnKey] = value;
					hasChanges = true;
				}
			}

			if (hasChanges) {
				updateColumnWidths(updates);
			}
		}, 300);

		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, [columnSizing, storedColumnWidths, updateColumnWidths]);

	// Convert mappings to mutable array for table
	const data = useMemo(() => [...mappings], [mappings]);
	const columns = useMemo(() => createColumns(), []);

	// Convert selectedIds Set to RowSelectionState for react-table
	const rowSelection = useMemo<RowSelectionState>(() => {
		const selection: RowSelectionState = {};
		for (let i = 0; i < data.length; i++) {
			const mapping = data[i];
			if (mapping && selectedIds.has(mapping.id)) {
				selection[i] = true;
			}
		}
		return selection;
	}, [data, selectedIds]);

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			rowSelection,
			columnSizing,
		},
		onSortingChange: setSorting,
		onColumnSizingChange: (updater) => {
			// Mark that user is actively resizing
			isResizingRef.current = true;
			setColumnSizing(updater);
			// Reset flag after a short delay (user finished dragging)
			setTimeout(() => {
				isResizingRef.current = false;
			}, 500);
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		enableRowSelection: true,
		enableMultiRowSelection: true,
		columnResizeMode: "onChange",
		enableColumnResizing: true,
	});

	const { rows } = table.getRowModel();

	// Virtualization
	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => tableContainerRef.current,
		estimateSize: () => 36, // Row height
		overscan: 10,
	});

	const virtualRows = rowVirtualizer.getVirtualItems();
	const totalSize = rowVirtualizer.getTotalSize();

	// Handle row click with multi-select support
	const handleRowClick = useCallback(
		(e: React.MouseEvent, rowIndex: number) => {
			const mapping = rows[rowIndex]?.original;
			if (!mapping) return;

			const newSelection = new Set(selectedIds);

			if (e.shiftKey && lastClickedIndex !== null) {
				// Range selection
				const start = Math.min(lastClickedIndex, rowIndex);
				const end = Math.max(lastClickedIndex, rowIndex);

				for (let i = start; i <= end; i++) {
					const m = rows[i]?.original;
					if (m) newSelection.add(m.id);
				}
			} else if (e.ctrlKey || e.metaKey) {
				// Toggle selection
				if (newSelection.has(mapping.id)) {
					newSelection.delete(mapping.id);
				} else {
					newSelection.add(mapping.id);
				}
			} else {
				// Single selection
				newSelection.clear();
				newSelection.add(mapping.id);
			}

			setLastClickedIndex(rowIndex);
			onSelectionChange?.(newSelection);
		},
		[rows, selectedIds, lastClickedIndex, onSelectionChange],
	);

	// Handle row double click
	const handleRowDoubleClick = useCallback(
		(rowIndex: number) => {
			const mapping = rows[rowIndex]?.original;
			if (mapping) {
				onMappingDoubleClick?.(mapping);
			}
		},
		[rows, onMappingDoubleClick],
	);

	// Show empty state with appropriate message
	if (mappings.length === 0) {
		// Check if filtering is active but no results
		if (isFiltered) {
			return (
				<div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
					<SearchX className="h-8 w-8 opacity-50" />
					<p>No mappings match your search</p>
					{searchQuery && (
						<p className="text-xs">Try a different search term</p>
					)}
				</div>
			);
		}
		return (
			<div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
				No mappings
			</div>
		);
	}

	// Calculate display text for filtered results
	const filteredInfo =
		isFiltered && totalCount !== undefined && totalCount !== mappings.length
			? `Showing ${mappings.length} of ${totalCount}`
			: null;

	return (
		<div className="flex flex-col h-full">
			{/* Filter results info */}
			{filteredInfo && (
				<div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
					<span>{filteredInfo}</span>
				</div>
			)}

			{/* Table Header with resize handles */}
			<div className="border-b border-border bg-muted/50">
				{table.getHeaderGroups().map((headerGroup) => (
					<div key={headerGroup.id} className="flex">
						{headerGroup.headers.map((header) => {
							const canResize = header.column.getCanResize();
							return (
								<div
									key={header.id}
									className="relative px-3 py-2 text-left text-xs font-medium text-muted-foreground"
									style={{ width: header.getSize() }}
								>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
									{canResize && (
										<ResizeHandle
											getHandler={header.getResizeHandler}
											isResizing={header.column.getIsResizing()}
										/>
									)}
								</div>
							);
						})}
					</div>
				))}
			</div>

			{/* Virtualized Table Body - wrapper for height measurement */}
			<div ref={wrapperRef} className="flex-1 min-h-0">
				<div
					ref={tableContainerRef}
					className="overflow-auto h-full"
					style={{ height: measuredHeight }}
				>
					<div
						style={{
							height: `${totalSize}px`,
							width: "100%",
							position: "relative",
						}}
					>
						{virtualRows.map((virtualRow) => {
							const row = rows[virtualRow.index];
							if (!row) return null;

							const isSelected = selectedIds.has(row.original.id);

							return (
								<button
									type="button"
									key={row.id}
									data-index={virtualRow.index}
									className={cn(
										"absolute left-0 flex w-full cursor-pointer border-b border-border text-left transition-colors",
										"hover:bg-accent/50",
										isSelected && "bg-accent text-accent-foreground",
									)}
									style={{
										height: `${virtualRow.size}px`,
										transform: `translateY(${virtualRow.start}px)`,
									}}
									onClick={(e) => handleRowClick(e, virtualRow.index)}
									onDoubleClick={() => handleRowDoubleClick(virtualRow.index)}
								>
									{row.getVisibleCells().map((cell) => (
										<div
											key={cell.id}
											className="flex items-center overflow-hidden px-3 py-2 text-sm"
											style={{ width: cell.column.getSize() }}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</div>
									))}
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}

export default MappingList;

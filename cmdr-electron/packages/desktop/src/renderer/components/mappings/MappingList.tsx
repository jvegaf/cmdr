/**
 * MappingList Component
 *
 * AIDEV-NOTE: Displays mappings in a virtualized table with sorting and selection.
 * Uses @tanstack/react-table for the data table and @tanstack/react-virtual for virtualization.
 *
 * Features:
 * - Virtualized rows for large mapping lists (1000+ mappings)
 * - Column sorting (click header)
 * - Multi-select with Ctrl+click and Shift+click
 * - Row highlight for selected items
 * - Columns: #, Command, MIDI, Conditions, Comment
 */

import type { Mapping } from '@cmdr/core';
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { cn } from '../../lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface MappingListProps {
  /** List of mappings to display */
  mappings: readonly Mapping[];
  /** Set of selected mapping IDs */
  selectedIds: Set<number>;
  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: Set<number>) => void;
  /** Callback when a mapping is double-clicked (edit) */
  onMappingDoubleClick?: (mapping: Mapping) => void;
  /** Height of the container (for virtualization) */
  height?: number;
}

// ============================================================================
// Column Definitions
// ============================================================================

function createColumns(): ColumnDef<Mapping>[] {
  return [
    {
      id: 'index',
      header: '#',
      size: 50,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.index + 1}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'commandName',
      header: ({ column }) => {
        const sorted = column.getIsSorted();
        return (
          <button
            type="button"
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => column.toggleSorting()}
          >
            Command
            {sorted === 'asc' ? (
              <ArrowUp className="h-3 w-3" />
            ) : sorted === 'desc' ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-50" />
            )}
          </button>
        );
      },
      size: 200,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.commandName}</span>
      ),
    },
    {
      id: 'midi',
      header: 'MIDI',
      size: 100,
      cell: ({ row }) => {
        const binding = row.original.midiBinding;
        if (!binding) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <span className="font-mono text-xs">
            {binding.note}
          </span>
        );
      },
      accessorFn: (row) => row.midiBinding?.note ?? '',
    },
    {
      id: 'conditions',
      header: 'Conditions',
      size: 150,
      cell: ({ row }) => {
        const cond1 = row.original.condition1;
        const cond2 = row.original.condition2;
        
        if (!cond1 && !cond2) {
          return <span className="text-muted-foreground">—</span>;
        }
        
        const parts: string[] = [];
        if (cond1) parts.push(cond1.description?.name ?? `C${cond1.id}`);
        if (cond2) parts.push(cond2.description?.name ?? `C${cond2.id}`);
        
        return (
          <span className="text-xs" title={parts.join(' + ')}>
            {parts.join(' + ')}
          </span>
        );
      },
    },
    {
      accessorKey: 'comment',
      header: 'Comment',
      size: 200,
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
// MappingList Component
// ============================================================================

export function MappingList({
  mappings,
  selectedIds,
  onSelectionChange,
  onMappingDoubleClick,
  height = 400,
}: MappingListProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

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
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    enableMultiRowSelection: true,
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
    [rows, selectedIds, lastClickedIndex, onSelectionChange]
  );

  // Handle row double click
  const handleRowDoubleClick = useCallback(
    (rowIndex: number) => {
      const mapping = rows[rowIndex]?.original;
      if (mapping) {
        onMappingDoubleClick?.(mapping);
      }
    },
    [rows, onMappingDoubleClick]
  );

  if (mappings.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No mappings
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Table Header */}
      <div className="border-b border-border bg-muted/50">
        {table.getHeaderGroups().map((headerGroup) => (
          <div key={headerGroup.id} className="flex">
            {headerGroup.headers.map((header) => (
              <div
                key={header.id}
                className="px-3 py-2 text-left text-xs font-medium text-muted-foreground"
                style={{ width: header.getSize() }}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Virtualized Table Body */}
      <div
        ref={tableContainerRef}
        className="overflow-auto"
        style={{ height }}
      >
        <div
          style={{
            height: `${totalSize}px`,
            width: '100%',
            position: 'relative',
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
                  'absolute left-0 flex w-full cursor-pointer border-b border-border text-left transition-colors',
                  'hover:bg-accent/50',
                  isSelected && 'bg-accent text-accent-foreground'
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MappingList;

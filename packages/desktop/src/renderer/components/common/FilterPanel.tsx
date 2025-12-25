/**
 * FilterPanel Component
 *
 * AIDEV-NOTE: Provides filter controls for the mapping list.
 * Filters can be combined (AND logic) to narrow down mappings.
 *
 * Available filters:
 * - Control type (Button, Fader, Encoder, LED)
 * - Has conditions (Yes/No)
 * - Has MIDI binding (Yes/No)
 *
 * Phase 15: Search and Filters
 */

import { MappingControlType } from "@cmdr/core";
import { Filter, X } from "lucide-react";
import { type ChangeEvent, useCallback, useMemo, useState } from "react";

import { cn } from "../../lib/utils";
import type { MappingFilters } from "../../store/tsiStore";
import { Button } from "../ui/Button";
import { Select, type SelectOption } from "../ui/Select";

// ============================================================================
// Types
// ============================================================================

export interface FilterPanelProps {
	/** Current filter values */
	filters: MappingFilters;
	/** Callback when filters change */
	onFiltersChange: (filters: Partial<MappingFilters>) => void;
	/** Callback to clear all filters */
	onClearFilters: () => void;
	/** Whether any filters are active */
	hasActiveFilters: boolean;
	/** Additional CSS classes */
	className?: string;
}

// ============================================================================
// Options
// ============================================================================

const CONTROL_TYPE_OPTIONS: SelectOption[] = [
	{ value: "", label: "All Types" },
	{ value: String(MappingControlType.Button), label: "Button" },
	{ value: String(MappingControlType.FaderOrKnob), label: "Fader/Knob" },
	{ value: String(MappingControlType.Encoder), label: "Encoder" },
	{ value: String(MappingControlType.LED), label: "LED" },
];

const HAS_CONDITIONS_OPTIONS: SelectOption[] = [
	{ value: "", label: "Any" },
	{ value: "true", label: "With Conditions" },
	{ value: "false", label: "No Conditions" },
];

const HAS_MIDI_OPTIONS: SelectOption[] = [
	{ value: "", label: "Any" },
	{ value: "true", label: "With MIDI" },
	{ value: "false", label: "No MIDI" },
];

// ============================================================================
// Component
// ============================================================================

export function FilterPanel({
	filters,
	onFiltersChange,
	onClearFilters,
	hasActiveFilters,
	className,
}: FilterPanelProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	// Convert filter values to select values
	const controlTypeValue = filters.controlType ?? "";
	const hasConditionsValue =
		filters.hasConditions === null || filters.hasConditions === undefined
			? ""
			: String(filters.hasConditions);
	const hasMidiValue =
		filters.hasMidiBinding === null || filters.hasMidiBinding === undefined
			? ""
			: String(filters.hasMidiBinding);

	// Handlers
	const handleControlTypeChange = useCallback(
		(e: ChangeEvent<HTMLSelectElement>) => {
			const value = e.target.value;
			onFiltersChange({ controlType: value || null });
		},
		[onFiltersChange],
	);

	const handleHasConditionsChange = useCallback(
		(e: ChangeEvent<HTMLSelectElement>) => {
			const value = e.target.value;
			onFiltersChange({
				hasConditions: value === "" ? null : value === "true",
			});
		},
		[onFiltersChange],
	);

	const handleHasMidiChange = useCallback(
		(e: ChangeEvent<HTMLSelectElement>) => {
			const value = e.target.value;
			onFiltersChange({
				hasMidiBinding: value === "" ? null : value === "true",
			});
		},
		[onFiltersChange],
	);

	// Count active filters
	const activeFilterCount = useMemo(() => {
		let count = 0;
		if (filters.controlType) count++;
		if (filters.hasConditions !== null && filters.hasConditions !== undefined)
			count++;
		if (filters.hasMidiBinding !== null && filters.hasMidiBinding !== undefined)
			count++;
		if (filters.commandCategory) count++;
		return count;
	}, [filters]);

	return (
		<div className={cn("flex items-center gap-2", className)}>
			{/* Filter toggle button */}
			<Button
				variant={hasActiveFilters ? "secondary" : "ghost"}
				size="sm"
				onClick={() => setIsExpanded(!isExpanded)}
				title={isExpanded ? "Hide filters" : "Show filters"}
				className={cn(hasActiveFilters && "border border-primary/50")}
			>
				<Filter className="h-4 w-4" />
				{activeFilterCount > 0 && (
					<span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
						{activeFilterCount}
					</span>
				)}
			</Button>

			{/* Clear filters button (only when filters are active) */}
			{hasActiveFilters && (
				<Button
					variant="ghost"
					size="sm"
					onClick={onClearFilters}
					title="Clear all filters"
				>
					<X className="h-4 w-4" />
				</Button>
			)}

			{/* Expanded filter controls */}
			{isExpanded && (
				<div className="flex items-center gap-2">
					{/* Control Type */}
					<Select
						value={controlTypeValue}
						options={CONTROL_TYPE_OPTIONS}
						onChange={handleControlTypeChange}
						className="w-32"
					/>

					{/* Has Conditions */}
					<Select
						value={hasConditionsValue}
						options={HAS_CONDITIONS_OPTIONS}
						onChange={handleHasConditionsChange}
						className="w-36"
					/>

					{/* Has MIDI */}
					<Select
						value={hasMidiValue}
						options={HAS_MIDI_OPTIONS}
						onChange={handleHasMidiChange}
						className="w-28"
					/>
				</div>
			)}
		</div>
	);
}

export default FilterPanel;

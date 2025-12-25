/**
 * ConditionSelector Component
 *
 * AIDEV-NOTE: A dropdown for selecting Traktor conditions.
 * Similar to CommandSelector but for the ~85 conditions.
 * Includes option to clear the condition (set to "None").
 */

import {
	CATEGORY_DESCRIPTIONS,
	type Categories,
	CONDITION_METADATA,
	type ConditionDescription,
	MappingTargetDeck,
} from "@cmdr/core";
import { ChevronDown, Search, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { cn } from "../../../lib/utils";
import { Select, type SelectOption } from "../../ui";

// ============================================================================
// Types
// ============================================================================

export interface ConditionSelectorProps {
	/** Currently selected condition ID (0 = none) */
	value: number;
	/** Target deck for the condition */
	target: MappingTargetDeck;
	/** Callback when condition changes */
	onChange: (conditionId: number, target: MappingTargetDeck) => void;
	/** Callback to clear the condition */
	onClear: () => void;
	/** Label for this condition (e.g., "Condition 1") */
	label: string;
	/** Whether the selector is disabled */
	disabled?: boolean;
	/** Additional class names */
	className?: string;
}

interface GroupedConditions {
	category: Categories;
	categoryName: string;
	conditions: ConditionDescription[];
}

// ============================================================================
// Constants
// ============================================================================

const TARGET_OPTIONS: SelectOption[] = [
	{ value: MappingTargetDeck.DeviceTarget, label: "Device Target" },
	{ value: MappingTargetDeck.DeckA, label: "Deck A" },
	{ value: MappingTargetDeck.DeckB, label: "Deck B" },
	{ value: MappingTargetDeck.DeckC, label: "Deck C" },
	{ value: MappingTargetDeck.DeckD, label: "Deck D" },
	{ value: MappingTargetDeck.DeckFocusedSlotLeft, label: "Focused Slot Left" },
	{
		value: MappingTargetDeck.DeckFocusedSlotRight,
		label: "Focused Slot Right",
	},
];

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get all conditions grouped by category
 */
function getGroupedConditions(): GroupedConditions[] {
	const groups = new Map<Categories, ConditionDescription[]>();

	for (const [idStr, input] of Object.entries(CONDITION_METADATA)) {
		const id = Number(idStr);
		const cond: ConditionDescription = { id, ...input };

		if (!groups.has(input.category)) {
			groups.set(input.category, []);
		}
		groups.get(input.category)?.push(cond);
	}

	const result: GroupedConditions[] = [];
	for (const [category, conditions] of groups) {
		result.push({
			category,
			categoryName: CATEGORY_DESCRIPTIONS[category] ?? "Unknown",
			conditions: conditions.sort((a, b) => a.name.localeCompare(b.name)),
		});
	}

	return result.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
}

/**
 * Filter conditions by search query
 */
function filterConditions(
	groups: GroupedConditions[],
	query: string,
): GroupedConditions[] {
	if (!query.trim()) return groups;

	const lowerQuery = query.toLowerCase();

	return groups
		.map((group) => ({
			...group,
			conditions: group.conditions.filter(
				(cond) =>
					cond.name.toLowerCase().includes(lowerQuery) ||
					group.categoryName.toLowerCase().includes(lowerQuery),
			),
		}))
		.filter((group) => group.conditions.length > 0);
}

// ============================================================================
// Component
// ============================================================================

export function ConditionSelector({
	value,
	target,
	onChange,
	onClear,
	label,
	disabled = false,
	className,
}: ConditionSelectorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const allGroups = useMemo(() => getGroupedConditions(), []);

	const filteredGroups = useMemo(
		() => filterConditions(allGroups, searchQuery),
		[allGroups, searchQuery],
	);

	const currentCondition = useMemo(() => {
		if (value === 0) return null;
		const meta = CONDITION_METADATA[value];
		return meta?.name ?? `Unknown (${value})`;
	}, [value]);

	const handleOpen = useCallback(() => {
		if (disabled) return;
		setIsOpen(true);
		setSearchQuery("");
		setTimeout(() => inputRef.current?.focus(), 10);
	}, [disabled]);

	const handleClose = useCallback(() => {
		setIsOpen(false);
		setSearchQuery("");
	}, []);

	const handleSelect = useCallback(
		(conditionId: number) => {
			onChange(conditionId, target);
			handleClose();
		},
		[onChange, target, handleClose],
	);

	const handleTargetChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			onChange(value, Number(e.target.value) as MappingTargetDeck);
		},
		[onChange, value],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape") {
				handleClose();
			}
		},
		[handleClose],
	);

	const totalConditions = useMemo(
		() => filteredGroups.reduce((acc, g) => acc + g.conditions.length, 0),
		[filteredGroups],
	);

	// If no condition is set, show a simple "Add Condition" button
	if (value === 0) {
		return (
			<div className={cn("space-y-2", className)}>
				<div className="text-xs text-muted-foreground">{label}</div>
				<button
					type="button"
					onClick={handleOpen}
					disabled={disabled}
					className={cn(
						"flex h-9 w-full items-center justify-center rounded-md border border-dashed border-muted-foreground/50 bg-transparent text-sm text-muted-foreground",
						"hover:border-muted-foreground hover:text-foreground",
						"disabled:cursor-not-allowed disabled:opacity-50",
					)}
				>
					+ Add Condition
				</button>

				{/* Dropdown for adding condition */}
				{isOpen && (
					<ConditionDropdown
						searchQuery={searchQuery}
						setSearchQuery={setSearchQuery}
						inputRef={inputRef}
						filteredGroups={filteredGroups}
						totalConditions={totalConditions}
						selectedId={value}
						onSelect={handleSelect}
						onClose={handleClose}
						onKeyDown={handleKeyDown}
					/>
				)}
			</div>
		);
	}

	// Condition is set - show condition name with edit/remove options
	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: keyboard handler for escape
		<div className={cn("space-y-2", className)} onKeyDown={handleKeyDown}>
			<div className="flex items-center justify-between">
				<div className="text-xs text-muted-foreground">{label}</div>
				<button
					type="button"
					onClick={onClear}
					disabled={disabled}
					className="text-xs text-muted-foreground hover:text-destructive"
				>
					Remove
				</button>
			</div>

			{/* Condition dropdown */}
			<div className="relative">
				<button
					type="button"
					onClick={handleOpen}
					disabled={disabled}
					className={cn(
						"flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm",
						"focus:outline-none focus:ring-2 focus:ring-ring",
						"disabled:cursor-not-allowed disabled:opacity-50",
						isOpen && "ring-2 ring-ring",
					)}
				>
					<span className="truncate">{currentCondition}</span>
					<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</button>

				{isOpen && (
					<ConditionDropdown
						searchQuery={searchQuery}
						setSearchQuery={setSearchQuery}
						inputRef={inputRef}
						filteredGroups={filteredGroups}
						totalConditions={totalConditions}
						selectedId={value}
						onSelect={handleSelect}
						onClose={handleClose}
						onKeyDown={handleKeyDown}
					/>
				)}
			</div>

			{/* Target dropdown */}
			<Select
				options={TARGET_OPTIONS}
				value={target}
				onChange={handleTargetChange}
				disabled={disabled}
				className="h-8 text-xs"
			/>
		</div>
	);
}

// ============================================================================
// ConditionDropdown sub-component
// ============================================================================

interface ConditionDropdownProps {
	searchQuery: string;
	setSearchQuery: (q: string) => void;
	inputRef: React.RefObject<HTMLInputElement>;
	filteredGroups: GroupedConditions[];
	totalConditions: number;
	selectedId: number;
	onSelect: (id: number) => void;
	onClose: () => void;
	onKeyDown: (e: React.KeyboardEvent) => void;
}

function ConditionDropdown({
	searchQuery,
	setSearchQuery,
	inputRef,
	filteredGroups,
	totalConditions,
	selectedId,
	onSelect,
	onClose,
}: ConditionDropdownProps) {
	return (
		<>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: escape handled on parent */}
			<div className="fixed inset-0 z-40" onClick={onClose} />

			<div className="absolute left-0 top-full z-50 mt-1 w-[320px] rounded-md border border-border bg-popover shadow-lg">
				{/* Search */}
				<div className="relative border-b border-border p-2">
					<Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						ref={inputRef}
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search conditions..."
						className="w-full rounded-md border-0 bg-transparent py-1.5 pl-8 pr-8 text-sm outline-none placeholder:text-muted-foreground"
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={() => setSearchQuery("")}
							className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</div>

				{/* List */}
				<div className="max-h-[300px] overflow-y-auto p-1">
					{filteredGroups.length === 0 ? (
						<div className="py-6 text-center text-sm text-muted-foreground">
							No conditions found
						</div>
					) : (
						filteredGroups.map((group) => (
							<div key={group.category} className="mb-2">
								<div className="sticky top-0 bg-popover px-2 py-1 text-xs font-semibold text-muted-foreground">
									{group.categoryName}
								</div>
								{group.conditions.map((cond) => (
									<button
										key={cond.id}
										type="button"
										onClick={() => onSelect(cond.id)}
										className={cn(
											"flex w-full items-center rounded-sm px-2 py-1.5 text-sm",
											"hover:bg-accent hover:text-accent-foreground",
											cond.id === selectedId &&
												"bg-accent text-accent-foreground",
										)}
									>
										{cond.name}
									</button>
								))}
							</div>
						))
					)}
				</div>

				{/* Footer */}
				<div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
					{totalConditions} condition{totalConditions !== 1 ? "s" : ""}
					{searchQuery && " matching"}
				</div>
			</div>
		</>
	);
}

export default ConditionSelector;

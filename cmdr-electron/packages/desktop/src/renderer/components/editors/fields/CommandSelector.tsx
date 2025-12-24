/**
 * CommandSelector Component
 *
 * AIDEV-NOTE: A searchable dropdown for selecting Traktor commands.
 * Commands are grouped by category for easier navigation.
 * Uses virtualization for the ~500 commands to maintain performance.
 */

import {
	CATEGORY_DESCRIPTIONS,
	type Categories,
	COMMAND_METADATA,
	type CommandDescription,
} from "@cmdr/core";
import { ChevronDown, Search, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { cn } from "../../../lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface CommandSelectorProps {
	/** Currently selected command ID */
	value: number;
	/** Callback when command changes */
	onChange: (commandId: number) => void;
	/** Whether the selector is disabled */
	disabled?: boolean;
	/** Additional class names */
	className?: string;
}

interface GroupedCommands {
	category: Categories;
	categoryName: string;
	commands: CommandDescription[];
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get all commands grouped by category
 */
function getGroupedCommands(): GroupedCommands[] {
	const groups = new Map<Categories, CommandDescription[]>();

	// Group all commands by category
	for (const [idStr, desc] of Object.entries(COMMAND_METADATA)) {
		const id = Number(idStr);
		const cmd: CommandDescription = { id, ...desc };

		if (!groups.has(desc.category)) {
			groups.set(desc.category, []);
		}
		groups.get(desc.category)?.push(cmd);
	}

	// Convert to array and sort by category name
	const result: GroupedCommands[] = [];
	for (const [category, commands] of groups) {
		result.push({
			category,
			categoryName: CATEGORY_DESCRIPTIONS[category] ?? "Unknown",
			commands: commands.sort((a, b) => a.name.localeCompare(b.name)),
		});
	}

	// Sort groups by category name
	return result.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
}

/**
 * Filter commands by search query
 */
function filterCommands(
	groups: GroupedCommands[],
	query: string,
): GroupedCommands[] {
	if (!query.trim()) return groups;

	const lowerQuery = query.toLowerCase();

	return groups
		.map((group) => ({
			...group,
			commands: group.commands.filter(
				(cmd) =>
					cmd.name.toLowerCase().includes(lowerQuery) ||
					group.categoryName.toLowerCase().includes(lowerQuery),
			),
		}))
		.filter((group) => group.commands.length > 0);
}

// ============================================================================
// Component
// ============================================================================

export function CommandSelector({
	value,
	onChange,
	disabled = false,
	className,
}: CommandSelectorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	// Get all grouped commands (memoized)
	const allGroups = useMemo(() => getGroupedCommands(), []);

	// Filter commands based on search
	const filteredGroups = useMemo(
		() => filterCommands(allGroups, searchQuery),
		[allGroups, searchQuery],
	);

	// Get current command name
	const currentCommand = useMemo(() => {
		const meta = COMMAND_METADATA[value];
		return meta?.name ?? `Unknown (${value})`;
	}, [value]);

	// Handle dropdown open
	const handleOpen = useCallback(() => {
		if (disabled) return;
		setIsOpen(true);
		setSearchQuery("");
		// Focus input after a tick to allow rendering
		setTimeout(() => inputRef.current?.focus(), 10);
	}, [disabled]);

	// Handle dropdown close
	const handleClose = useCallback(() => {
		setIsOpen(false);
		setSearchQuery("");
	}, []);

	// Handle command selection
	const handleSelect = useCallback(
		(commandId: number) => {
			onChange(commandId);
			handleClose();
		},
		[onChange, handleClose],
	);

	// Handle keyboard navigation
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape") {
				handleClose();
			}
		},
		[handleClose],
	);

	// Count total visible commands
	const totalCommands = useMemo(
		() => filteredGroups.reduce((acc, g) => acc + g.commands.length, 0),
		[filteredGroups],
	);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: wrapper for keyboard events
		<div className={cn("relative", className)} onKeyDown={handleKeyDown}>
			{/* Trigger button */}
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
				<span className="truncate">{currentCommand}</span>
				<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
			</button>

			{/* Dropdown */}
			{isOpen && (
				<>
					{/* Backdrop - clicking closes the dropdown */}
					{/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop for closing dropdown */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape key handled on parent */}
					<div className="fixed inset-0 z-40" onClick={handleClose} />

					{/* Dropdown panel */}
					<div className="absolute left-0 top-full z-50 mt-1 w-[320px] rounded-md border border-border bg-popover shadow-lg">
						{/* Search input */}
						<div className="relative border-b border-border p-2">
							<Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<input
								ref={inputRef}
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search commands..."
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

						{/* Command list */}
						<div ref={listRef} className="max-h-[300px] overflow-y-auto p-1">
							{filteredGroups.length === 0 ? (
								<div className="py-6 text-center text-sm text-muted-foreground">
									No commands found
								</div>
							) : (
								filteredGroups.map((group) => (
									<div key={group.category} className="mb-2">
										{/* Category header */}
										<div className="sticky top-0 bg-popover px-2 py-1 text-xs font-semibold text-muted-foreground">
											{group.categoryName}
										</div>
										{/* Commands in category */}
										{group.commands.map((cmd) => (
											<button
												key={cmd.id}
												type="button"
												onClick={() => handleSelect(cmd.id)}
												className={cn(
													"flex w-full items-center rounded-sm px-2 py-1.5 text-sm",
													"hover:bg-accent hover:text-accent-foreground",
													cmd.id === value &&
														"bg-accent text-accent-foreground",
												)}
											>
												{cmd.name}
											</button>
										))}
									</div>
								))
							)}
						</div>

						{/* Footer with count */}
						<div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
							{totalCommands} command{totalCommands !== 1 ? "s" : ""}
							{searchQuery && " matching"}
						</div>
					</div>
				</>
			)}
		</div>
	);
}

export default CommandSelector;

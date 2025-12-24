/**
 * SearchInput Component
 *
 * AIDEV-NOTE: A search input with debounced value updates.
 * Used for searching/filtering mappings in the editor.
 *
 * Features:
 * - Debounced onChange to avoid excessive updates
 * - Clear button when there's input
 * - Optional keyboard shortcut indicator
 * - Focus ref for external focus control (Ctrl+F)
 */

import { Search, X } from "lucide-react";
import {
	type ChangeEvent,
	forwardRef,
	useCallback,
	useEffect,
	useState,
} from "react";

import { cn } from "../../lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface SearchInputProps {
	/** Current search value */
	value: string;
	/** Callback when search value changes (debounced) */
	onChange: (value: string) => void;
	/** Placeholder text */
	placeholder?: string;
	/** Debounce delay in ms (default: 200) */
	debounceMs?: number;
	/** Additional CSS classes */
	className?: string;
	/** Show keyboard shortcut hint */
	showShortcut?: boolean;
	/** Whether the input is disabled */
	disabled?: boolean;
}

// ============================================================================
// Hook: useDebounce
// ============================================================================

/**
 * Hook to debounce a value
 */
function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(timer);
		};
	}, [value, delay]);

	return debouncedValue;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Search input with debouncing and clear button
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 * <SearchInput
 *   value={search}
 *   onChange={setSearch}
 *   placeholder="Search mappings..."
 * />
 * ```
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
	(
		{
			value,
			onChange,
			placeholder = "Search...",
			debounceMs = 200,
			className,
			showShortcut = false,
			disabled = false,
		},
		ref,
	) => {
		// Local state for immediate visual feedback
		const [localValue, setLocalValue] = useState(value);

		// Sync local value with external value when it changes
		useEffect(() => {
			setLocalValue(value);
		}, [value]);

		// Debounce the local value
		const debouncedValue = useDebounce(localValue, debounceMs);

		// Call onChange when debounced value changes
		useEffect(() => {
			if (debouncedValue !== value) {
				onChange(debouncedValue);
			}
		}, [debouncedValue, onChange, value]);

		const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
			setLocalValue(e.target.value);
		}, []);

		const handleClear = useCallback(() => {
			setLocalValue("");
			onChange("");
		}, [onChange]);

		return (
			<div className={cn("relative flex items-center", className)}>
				{/* Search icon */}
				<Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />

				{/* Input */}
				<input
					ref={ref}
					type="text"
					value={localValue}
					onChange={handleChange}
					placeholder={placeholder}
					disabled={disabled}
					className={cn(
						"h-8 w-full rounded-md border border-input bg-background pl-8 pr-8 text-sm shadow-sm transition-colors",
						"placeholder:text-muted-foreground",
						"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
						"disabled:cursor-not-allowed disabled:opacity-50",
						showShortcut && !localValue && "pr-16",
					)}
				/>

				{/* Clear button or shortcut hint */}
				{localValue ? (
					<button
						type="button"
						onClick={handleClear}
						className="absolute right-2 rounded p-0.5 hover:bg-accent"
						title="Clear search"
					>
						<X className="h-3.5 w-3.5 text-muted-foreground" />
					</button>
				) : showShortcut ? (
					<span className="pointer-events-none absolute right-2 text-xs text-muted-foreground">
						Ctrl+F
					</span>
				) : null}
			</div>
		);
	},
);

SearchInput.displayName = "SearchInput";

export default SearchInput;

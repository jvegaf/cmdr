/**
 * Select Component
 *
 * AIDEV-NOTE: A styled select component following shadcn/ui patterns.
 * For more complex needs (searchable, multi-select), consider Combobox.
 */

import { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface SelectOption {
	value: string | number;
	label: string;
	disabled?: boolean;
}

export interface SelectProps
	extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
	options: SelectOption[];
	placeholder?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Select component with consistent styling
 *
 * @example
 * ```tsx
 * <Select
 *   options={[
 *     { value: '1', label: 'Option 1' },
 *     { value: '2', label: 'Option 2' },
 *   ]}
 *   value={selectedValue}
 *   onChange={(e) => setValue(e.target.value)}
 * />
 * ```
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
	({ className, options, placeholder, ...props }, ref) => {
		return (
			<select
				className={cn(
					"flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm",
					"focus:outline-none focus:ring-2 focus:ring-ring",
					"disabled:cursor-not-allowed disabled:opacity-50",
					"[&>option]:bg-background",
					className,
				)}
				ref={ref}
				{...props}
			>
				{placeholder && (
					<option value="" disabled>
						{placeholder}
					</option>
				)}
				{options.map((option) => (
					<option
						key={option.value}
						value={option.value}
						disabled={option.disabled}
					>
						{option.label}
					</option>
				))}
			</select>
		);
	},
);

Select.displayName = "Select";

export { Select };

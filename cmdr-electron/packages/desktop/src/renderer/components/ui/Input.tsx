/**
 * Input Component
 *
 * AIDEV-NOTE: A styled input component following shadcn/ui patterns.
 * Supports text, number, and other standard input types.
 */

import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

// ============================================================================
// Component
// ============================================================================

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

/**
 * Input component with consistent styling
 *
 * @example
 * ```tsx
 * <Input placeholder="Enter text..." />
 * <Input type="number" min={0} max={127} />
 * ```
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					"flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",
					"file:border-0 file:bg-transparent file:text-sm file:font-medium",
					"placeholder:text-muted-foreground",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					"disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);

Input.displayName = "Input";

export { Input };

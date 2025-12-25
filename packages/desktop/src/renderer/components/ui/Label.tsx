/**
 * Label Component
 *
 * AIDEV-NOTE: A styled label component following shadcn/ui patterns.
 */

import { forwardRef, type LabelHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

// ============================================================================
// Component
// ============================================================================

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

/**
 * Label component with consistent styling
 *
 * @example
 * ```tsx
 * <Label htmlFor="name">Name</Label>
 * <Input id="name" />
 * ```
 */
const Label = forwardRef<HTMLLabelElement, LabelProps>(
	({ className, ...props }, ref) => {
		return (
			// biome-ignore lint/a11y/noLabelWithoutControl: Label is designed to be used with htmlFor
			<label
				className={cn(
					"text-sm font-medium leading-none",
					"peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);

Label.displayName = "Label";

export { Label };

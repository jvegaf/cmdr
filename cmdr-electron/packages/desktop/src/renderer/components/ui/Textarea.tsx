/**
 * Textarea Component
 *
 * AIDEV-NOTE: A styled textarea component following shadcn/ui patterns.
 * Supports auto-resize and character count.
 */

import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

// ============================================================================
// Component
// ============================================================================

export interface TextareaProps
	extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Textarea component with consistent styling
 *
 * @example
 * ```tsx
 * <Textarea
 *   placeholder="Enter comment..."
 *   value={comment}
 *   onChange={(e) => setComment(e.target.value)}
 * />
 * ```
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, ...props }, ref) => {
		return (
			<textarea
				className={cn(
					"flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
					"placeholder:text-muted-foreground",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					"disabled:cursor-not-allowed disabled:opacity-50",
					"resize-y",
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);

Textarea.displayName = "Textarea";

export { Textarea };

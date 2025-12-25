/**
 * Checkbox Component
 *
 * AIDEV-NOTE: A styled checkbox component following shadcn/ui patterns.
 * Supports labels and description text.
 */

import { Check } from "lucide-react";
import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface CheckboxProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
	label?: string;
	description?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Checkbox component with optional label
 *
 * @example
 * ```tsx
 * <Checkbox
 *   checked={isEnabled}
 *   onChange={(e) => setEnabled(e.target.checked)}
 *   label="Enable feature"
 * />
 * ```
 */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
	({ className, label, description, id, ...props }, ref) => {
		const checkboxId =
			id ?? `checkbox-${Math.random().toString(36).slice(2, 9)}`;

		return (
			<div className="flex items-start gap-2">
				<div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
					<input
						type="checkbox"
						id={checkboxId}
						className={cn(
							"peer h-4 w-4 shrink-0 rounded-sm border border-input bg-background",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
							"disabled:cursor-not-allowed disabled:opacity-50",
							"checked:bg-primary checked:border-primary",
							"appearance-none cursor-pointer",
							className,
						)}
						ref={ref}
						{...props}
					/>
					<Check
						className={cn(
							"absolute h-3 w-3 text-primary-foreground pointer-events-none",
							"hidden peer-checked:block",
						)}
						strokeWidth={3}
					/>
				</div>
				{(label || description) && (
					<div className="grid gap-0.5 leading-none">
						{label && (
							<label
								htmlFor={checkboxId}
								className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								{label}
							</label>
						)}
						{description && (
							<p className="text-xs text-muted-foreground">{description}</p>
						)}
					</div>
				)}
			</div>
		);
	},
);

Checkbox.displayName = "Checkbox";

export { Checkbox };

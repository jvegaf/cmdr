/**
 * Dialog Components
 *
 * AIDEV-NOTE: Simple dialog components for confirmations and prompts.
 * Uses a portal to render outside the normal DOM hierarchy.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "../../lib/utils";
import { Button } from "../ui";

// ============================================================================
// Types
// ============================================================================

export interface ConfirmDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** Dialog title */
	title: string;
	/** Dialog message/description */
	message: string;
	/** Text for confirm button */
	confirmText?: string;
	/** Text for cancel button */
	cancelText?: string;
	/** Text for third option (e.g., "Don't Save") */
	thirdOptionText?: string;
	/** Variant for confirm button */
	confirmVariant?: "default" | "destructive";
	/** Called when confirmed */
	onConfirm: () => void;
	/** Called when cancelled */
	onCancel: () => void;
	/** Called when third option is clicked */
	onThirdOption?: () => void;
}

// ============================================================================
// ConfirmDialog Component
// ============================================================================

/**
 * A modal confirmation dialog
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={showConfirm}
 *   title="Unsaved Changes"
 *   message="Do you want to save changes before closing?"
 *   confirmText="Save"
 *   cancelText="Cancel"
 *   thirdOptionText="Don't Save"
 *   onConfirm={handleSave}
 *   onCancel={handleCancel}
 *   onThirdOption={handleDontSave}
 * />
 * ```
 */
export function ConfirmDialog({
	open,
	title,
	message,
	confirmText = "OK",
	cancelText = "Cancel",
	thirdOptionText,
	confirmVariant = "default",
	onConfirm,
	onCancel,
	onThirdOption,
}: ConfirmDialogProps) {
	const dialogRef = useRef<HTMLDivElement>(null);

	// Focus trap and escape key handling
	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				onCancel();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [open, onCancel]);

	// Focus the dialog when opened
	useEffect(() => {
		if (open && dialogRef.current) {
			dialogRef.current.focus();
		}
	}, [open]);

	if (!open) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			{/* Backdrop click handler as a button for accessibility */}
			<button
				type="button"
				className="absolute inset-0 cursor-default"
				onClick={onCancel}
				aria-label="Close dialog"
			/>
			<div
				ref={dialogRef}
				className={cn(
					"bg-card border border-border rounded-lg shadow-lg",
					"min-w-[320px] max-w-[480px] p-6",
					"animate-in fade-in-0 zoom-in-95",
				)}
				role="dialog"
				aria-modal="true"
				aria-labelledby="dialog-title"
				aria-describedby="dialog-message"
				tabIndex={-1}
			>
				{/* Title */}
				<h2 id="dialog-title" className="text-lg font-semibold mb-2">
					{title}
				</h2>

				{/* Message */}
				<p id="dialog-message" className="text-muted-foreground mb-6">
					{message}
				</p>

				{/* Actions */}
				<div className="flex items-center justify-end gap-2">
					{thirdOptionText && onThirdOption && (
						<Button variant="ghost" onClick={onThirdOption} className="mr-auto">
							{thirdOptionText}
						</Button>
					)}
					<Button variant="outline" onClick={onCancel}>
						{cancelText}
					</Button>
					<Button
						variant={confirmVariant === "destructive" ? "destructive" : "default"}
						onClick={onConfirm}
					>
						{confirmText}
					</Button>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// useConfirmDialog Hook
// ============================================================================

export interface UseConfirmDialogOptions {
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	thirdOptionText?: string;
	confirmVariant?: "default" | "destructive";
}

export interface UseConfirmDialogReturn {
	/** Whether the dialog is open */
	isOpen: boolean;
	/** Open the dialog and return a promise that resolves with the result */
	confirm: () => Promise<"confirm" | "cancel" | "third">;
	/** Dialog props to spread onto ConfirmDialog */
	dialogProps: ConfirmDialogProps;
}

/**
 * Hook for programmatic dialog control
 *
 * @example
 * ```tsx
 * const { confirm, dialogProps } = useConfirmDialog({
 *   title: "Delete?",
 *   message: "This cannot be undone.",
 *   confirmText: "Delete",
 *   confirmVariant: "destructive",
 * });
 *
 * const handleDelete = async () => {
 *   const result = await confirm();
 *   if (result === "confirm") {
 *     // Do delete
 *   }
 * };
 *
 * return (
 *   <>
 *     <button onClick={handleDelete}>Delete</button>
 *     <ConfirmDialog {...dialogProps} />
 *   </>
 * );
 * ```
 */
export function useConfirmDialog(
	options: UseConfirmDialogOptions,
): UseConfirmDialogReturn {
	const [isOpen, setIsOpen] = useState(false);
	const resolverRef = useRef<
		((value: "confirm" | "cancel" | "third") => void) | null
	>(null);

	const confirm = useCallback(() => {
		setIsOpen(true);
		return new Promise<"confirm" | "cancel" | "third">((resolve) => {
			resolverRef.current = resolve;
		});
	}, []);

	const handleConfirm = useCallback(() => {
		setIsOpen(false);
		resolverRef.current?.("confirm");
		resolverRef.current = null;
	}, []);

	const handleCancel = useCallback(() => {
		setIsOpen(false);
		resolverRef.current?.("cancel");
		resolverRef.current = null;
	}, []);

	const handleThirdOption = useCallback(() => {
		setIsOpen(false);
		resolverRef.current?.("third");
		resolverRef.current = null;
	}, []);

	const dialogProps: ConfirmDialogProps = {
		open: isOpen,
		title: options.title,
		message: options.message,
		confirmText: options.confirmText,
		cancelText: options.cancelText,
		thirdOptionText: options.thirdOptionText,
		confirmVariant: options.confirmVariant,
		onConfirm: handleConfirm,
		onCancel: handleCancel,
		onThirdOption: options.thirdOptionText ? handleThirdOption : undefined,
	};

	return {
		isOpen,
		confirm,
		dialogProps,
	};
}

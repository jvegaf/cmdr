/**
 * Keyboard Shortcuts Dialog Component
 *
 * AIDEV-NOTE: Modal dialog showing all available keyboard shortcuts.
 * Organized by category for easy reference.
 */

import { Keyboard, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { SHORTCUTS } from "../../hooks/useKeyboardShortcuts";
import { cn } from "../../lib/utils";
import { Button } from "../ui";

// ============================================================================
// Types
// ============================================================================

export interface KeyboardShortcutsDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** Called when the dialog should close */
	onClose: () => void;
}

interface ShortcutItem {
	label: string;
	shortcut: string;
}

interface ShortcutGroup {
	title: string;
	shortcuts: ShortcutItem[];
}

// ============================================================================
// Shortcut definitions
// ============================================================================

const SHORTCUT_GROUPS: ShortcutGroup[] = [
	{
		title: "File",
		shortcuts: [
			{ label: "New File", shortcut: SHORTCUTS.new },
			{ label: "Open File", shortcut: SHORTCUTS.open },
			{ label: "Save", shortcut: SHORTCUTS.save },
			{ label: "Save As", shortcut: SHORTCUTS.saveAs },
		],
	},
	{
		title: "Edit",
		shortcuts: [
			{ label: "Undo", shortcut: SHORTCUTS.undo },
			{ label: "Redo", shortcut: SHORTCUTS.redo },
			{ label: "Copy", shortcut: SHORTCUTS.copy },
			{ label: "Cut", shortcut: SHORTCUTS.cut },
			{ label: "Paste", shortcut: SHORTCUTS.paste },
			{ label: "Duplicate", shortcut: SHORTCUTS.duplicate },
			{ label: "Delete", shortcut: SHORTCUTS.delete },
		],
	},
	{
		title: "Selection",
		shortcuts: [
			{ label: "Select All", shortcut: SHORTCUTS.selectAll },
			{ label: "Clear Selection", shortcut: "Escape" },
			{ label: "Multi-select", shortcut: "Ctrl+Click" },
			{ label: "Range Select", shortcut: "Shift+Click" },
		],
	},
	{
		title: "Navigation",
		shortcuts: [
			{ label: "Search", shortcut: SHORTCUTS.search },
		],
	},
];

// ============================================================================
// KeyboardShortcutsDialog Component
// ============================================================================

/**
 * Modal dialog showing keyboard shortcuts
 */
export function KeyboardShortcutsDialog({
	open,
	onClose,
}: KeyboardShortcutsDialogProps) {
	const dialogRef = useRef<HTMLDivElement>(null);

	// Handle escape key
	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				onClose();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [open, onClose]);

	// Focus dialog when opened
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
			{/* Backdrop */}
			<button
				type="button"
				className="absolute inset-0 cursor-default"
				onClick={onClose}
				aria-label="Close dialog"
			/>

			<div
				ref={dialogRef}
				className={cn(
					"bg-card border border-border rounded-lg shadow-lg",
					"w-[500px] max-h-[80vh] flex flex-col",
					"animate-in fade-in-0 zoom-in-95",
				)}
				role="dialog"
				aria-modal="true"
				aria-labelledby="shortcuts-dialog-title"
				tabIndex={-1}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-border">
					<div className="flex items-center gap-3">
						<Keyboard className="h-5 w-5 text-primary" />
						<h2
							id="shortcuts-dialog-title"
							className="text-lg font-semibold"
						>
							Keyboard Shortcuts
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1 rounded hover:bg-muted"
						aria-label="Close"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-auto p-6">
					<div className="space-y-6">
						{SHORTCUT_GROUPS.map((group) => (
							<div key={group.title}>
								<h3 className="text-sm font-medium text-muted-foreground mb-3">
									{group.title}
								</h3>
								<div className="space-y-2">
									{group.shortcuts.map((item) => (
										<div
											key={item.label}
											className="flex items-center justify-between py-1"
										>
											<span className="text-sm">{item.label}</span>
											<kbd
												className={cn(
													"px-2 py-1 text-xs rounded",
													"bg-muted border border-border",
													"font-mono",
												)}
											>
												{item.shortcut}
											</kbd>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Footer */}
				<div className="flex justify-end px-6 py-4 border-t border-border">
					<Button variant="outline" onClick={onClose}>
						Close
					</Button>
				</div>
			</div>
		</div>
	);
}

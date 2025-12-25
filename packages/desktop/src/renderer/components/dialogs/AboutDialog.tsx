/**
 * About Dialog Component
 *
 * AIDEV-NOTE: Modal dialog showing application information.
 * Displays version, description, credits, and links.
 */

import { ExternalLink, Github, Heart, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import { cn } from "../../lib/utils";
import { Button } from "../ui";

// ============================================================================
// Types
// ============================================================================

export interface AboutDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** Called when the dialog should close */
	onClose: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const APP_VERSION = "2.0.0-beta";
const APP_NAME = "CMDR";
const APP_DESCRIPTION = "TSI File Editor for NI Traktor Pro";

const LINKS = [
	{
		label: "GitHub Repository",
		url: "https://github.com/cmdr-editor/cmdr",
		icon: Github,
	},
	{
		label: "Documentation",
		url: "https://github.com/cmdr-editor/cmdr/blob/main/docs/README.md",
		icon: ExternalLink,
	},
	{
		label: "Report Issue",
		url: "https://github.com/cmdr-editor/cmdr/issues",
		icon: ExternalLink,
	},
];

const CREDITS = [
	{ name: "Original CMDR", role: "WPF/.NET version" },
	{ name: "Electron Migration", role: "React/TypeScript rewrite" },
];

// ============================================================================
// AboutDialog Component
// ============================================================================

/**
 * Modal dialog showing application information
 */
export function AboutDialog({ open, onClose }: AboutDialogProps) {
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

	// Handle link click
	const handleLinkClick = useCallback((url: string) => {
		window.open(url, "_blank", "noopener,noreferrer");
	}, []);

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
					"min-w-[400px] max-w-[500px] p-6",
					"animate-in fade-in-0 zoom-in-95",
				)}
				role="dialog"
				aria-modal="true"
				aria-labelledby="about-dialog-title"
				tabIndex={-1}
			>
				{/* Close button */}
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 p-1 rounded hover:bg-muted"
					aria-label="Close"
				>
					<X className="h-4 w-4" />
				</button>

				{/* Header */}
				<div className="text-center mb-6">
					{/* App Icon placeholder */}
					<div className="mx-auto w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
						<span className="text-2xl font-bold text-primary">C</span>
					</div>
					<h2
						id="about-dialog-title"
						className="text-2xl font-bold tracking-tight"
					>
						{APP_NAME}
					</h2>
					<p className="text-muted-foreground mt-1">{APP_DESCRIPTION}</p>
					<p className="text-sm text-muted-foreground mt-2">
						Version {APP_VERSION}
					</p>
				</div>

				{/* Links */}
				<div className="space-y-2 mb-6">
					{LINKS.map((link) => (
						<button
							key={link.url}
							type="button"
							onClick={() => handleLinkClick(link.url)}
							className={cn(
								"w-full flex items-center gap-3 px-3 py-2 rounded-lg",
								"text-left text-sm",
								"hover:bg-muted transition-colors",
							)}
						>
							<link.icon className="h-4 w-4 text-muted-foreground" />
							<span>{link.label}</span>
						</button>
					))}
				</div>

				{/* Credits */}
				<div className="border-t border-border pt-4 mb-4">
					<h3 className="text-sm font-medium mb-2 flex items-center gap-2">
						<Heart className="h-4 w-4 text-red-500" />
						Credits
					</h3>
					<div className="space-y-1">
						{CREDITS.map((credit) => (
							<div
								key={credit.name}
								className="flex justify-between text-sm text-muted-foreground"
							>
								<span>{credit.name}</span>
								<span>{credit.role}</span>
							</div>
						))}
					</div>
				</div>

				{/* License */}
				<div className="text-center text-xs text-muted-foreground">
					<p>Licensed under MIT License</p>
					<p className="mt-1">© 2024 CMDR Contributors</p>
				</div>

				{/* Close button */}
				<div className="mt-6 flex justify-center">
					<Button variant="outline" onClick={onClose}>
						Close
					</Button>
				</div>
			</div>
		</div>
	);
}

/**
 * FileTabs Component
 *
 * AIDEV-NOTE: Displays tabs for multiple open TSI files.
 * Features:
 * - Tab for each open file
 * - Dirty indicator (*) for unsaved changes
 * - Close button on each tab
 * - Click to switch active file
 * - Middle-click to close
 */

import { X } from "lucide-react";
import { useCallback } from "react";

import { cn } from "../../lib/utils";
import type { OpenFile } from "../../store/tsiStore";

// ============================================================================
// Types
// ============================================================================

export interface FileTabsProps {
	/** List of open files */
	files: OpenFile[];
	/** ID of the active file */
	activeFileId: string | null;
	/** Called when a tab is clicked */
	onSelectFile: (fileId: string) => void;
	/** Called when close button is clicked */
	onCloseFile: (fileId: string) => void;
}

// ============================================================================
// FileTab Component
// ============================================================================

interface FileTabProps {
	file: OpenFile;
	isActive: boolean;
	onSelect: () => void;
	onClose: () => void;
}

function FileTab({ file, isActive, onSelect, onClose }: FileTabProps) {
	const handleClose = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onClose();
		},
		[onClose],
	);

	const handleMiddleClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.button === 1) {
				e.preventDefault();
				onClose();
			}
		},
		[onClose],
	);

	return (
		<button
			type="button"
			onClick={onSelect}
			onMouseDown={handleMiddleClick}
			className={cn(
				"group flex items-center gap-2 px-3 py-1.5 text-sm border-r border-border",
				"hover:bg-accent/50 transition-colors min-w-[120px] max-w-[200px]",
				isActive
					? "bg-background text-foreground"
					: "bg-muted/30 text-muted-foreground",
			)}
		>
			{/* File name with dirty indicator */}
			<span className="truncate flex-1 text-left">
				{file.displayName}
				{file.isDirty && <span className="text-orange-500 ml-0.5">*</span>}
			</span>

			{/* Close button */}
			<button
				type="button"
				onClick={handleClose}
				className={cn(
					"p-0.5 rounded hover:bg-destructive/20 hover:text-destructive",
					"opacity-0 group-hover:opacity-100 transition-opacity",
					isActive && "opacity-60",
				)}
			>
				<X className="h-3 w-3" />
			</button>
		</button>
	);
}

// ============================================================================
// FileTabs Component
// ============================================================================

export function FileTabs({
	files,
	activeFileId,
	onSelectFile,
	onCloseFile,
}: FileTabsProps) {
	if (files.length === 0) {
		return null;
	}

	return (
		<div className="flex items-center bg-muted/50 border-b border-border overflow-x-auto">
			{files.map((file) => (
				<FileTab
					key={file.id}
					file={file}
					isActive={file.id === activeFileId}
					onSelect={() => onSelectFile(file.id)}
					onClose={() => onCloseFile(file.id)}
				/>
			))}
		</div>
	);
}

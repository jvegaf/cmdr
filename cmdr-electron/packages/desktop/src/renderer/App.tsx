/**
 * Main Application Component
 *
 * AIDEV-NOTE: Root component for the CMDR application.
 * Manages the overall layout with toolbar, file tabs, device tree, mapping list, and property editor.
 *
 * Phase 13 additions:
 * - FileTabs for multiple open files
 * - New File functionality
 * - Save/Save As with dirty state handling
 * - Close file with unsaved changes confirmation
 *
 * Phase 14 additions:
 * - Keyboard shortcuts for copy/cut/paste/duplicate/delete
 * - Edit toolbar buttons
 * - Clipboard operations
 *
 * Phase 15 additions:
 * - Search input for filtering mappings
 * - Filter panel with control type, conditions, MIDI filters
 * - Combined search + filter logic
 */

import { type Device, type Mapping, TsiFile } from "@cmdr/core";
import {
	ClipboardCopy,
	ClipboardPaste,
	Clock,
	Copy,
	FilePlus,
	FolderOpen,
	Redo2,
	Save,
	SaveAll,
	Scissors,
	Trash2,
	Undo2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FilterPanel, SearchInput } from "./components/common";
import { DeviceList } from "./components/devices";
import { ConfirmDialog, useConfirmDialog } from "./components/dialogs";
import { MappingEditor } from "./components/editors";
import { FileTabs } from "./components/files";
import { MappingList } from "./components/mappings";
import { ThemeProvider, ThemeToggle } from "./components/theme";
import { Button } from "./components/ui";
import { SHORTCUTS, useKeyboardShortcuts } from "./hooks";
import { ipcClient } from "./lib/ipc-client";
import { useAppStore, useRecentFiles } from "./store/appStore";
import { useHistoryInfo } from "./store/historyStore";
import { useMidiStore } from "./store/midiStore";
import {
	filterMappings,
	useActiveFile,
	useCanPaste,
	useHasActiveFilters,
	useOpenFiles,
	useTsiStore,
} from "./store/tsiStore";

// ============================================================================
// AppLayout Component
// ============================================================================

/**
 * Main application layout with file tabs and 3-panel design
 */
function AppLayout() {
	const activeFile = useActiveFile();
	const openFiles = useOpenFiles();
	const recentFiles = useRecentFiles();
	const canPaste = useCanPaste();
	const hasActiveFilters = useHasActiveFilters();
	const historyInfo = useHistoryInfo(activeFile?.id ?? null);
	const addRecentFile = useAppStore((s) => s.addRecentFile);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const {
		openFile,
		createNewFile,
		closeFile,
		setActiveFile,
		selectMappings,
		markClean,
		updateFilePath,
		// Phase 14: Edit operations
		copyMappings,
		cutMappings,
		pasteMappings,
		duplicateMappings,
		deleteMappings,
		// Phase 14.5: Undo/Redo
		undo,
		redo,
		// Phase 15: Search and Filters
		setSearchQuery,
		setFilters,
		clearFilters,
	} = useTsiStore();
	const { initialize: initMidi, isEnabled: midiEnabled } = useMidiStore();

	// State for the file to close (when confirmation is needed)
	// AIDEV-NOTE: This tracks which file triggered the unsaved changes dialog
	const [_pendingCloseFileId, setPendingCloseFileId] = useState<string | null>(
		null,
	);

	// Confirm dialog for unsaved changes
	const unsavedChangesDialog = useConfirmDialog({
		title: "Unsaved Changes",
		message: "Do you want to save changes before closing?",
		confirmText: "Save",
		cancelText: "Cancel",
		thirdOptionText: "Don't Save",
	});

	// Initialize MIDI on mount
	useEffect(() => {
		initMidi();
	}, [initMidi]);

	// ========================================================================
	// File Operations
	// ========================================================================

	// Handle new file
	const handleNewFile = useCallback(() => {
		const tsiFile = TsiFile.create();
		createNewFile(tsiFile);
	}, [createNewFile]);

	// Handle open file
	const handleOpenFile = useCallback(async () => {
		try {
			const result = await ipcClient.openTsiFile();
			if (result) {
				openFile(result.filePath, result.tsiFile);
				addRecentFile(result.filePath);
			}
		} catch (error) {
			console.error("Failed to open file:", error);
		}
	}, [openFile, addRecentFile]);

	// Handle open recent file
	const handleOpenRecentFile = useCallback(
		async (filePath: string) => {
			try {
				const tsiFile = await ipcClient.readTsiFile(filePath);
				openFile(filePath, tsiFile);
				addRecentFile(filePath);
			} catch (error) {
				console.error("Failed to open recent file:", error);
				// TODO: Show error toast and possibly remove from recent files
			}
		},
		[openFile, addRecentFile],
	);

	// Handle save file
	const handleSaveFile = useCallback(async () => {
		if (!activeFile) return;

		try {
			if (activeFile.filePath) {
				// File has a path - save directly
				await ipcClient.writeTsiFile(activeFile.tsiFile, activeFile.filePath);
				markClean(activeFile.id);
				addRecentFile(activeFile.filePath);
			} else {
				// No path - use Save As dialog
				const savedPath = await ipcClient.saveTsiFile(activeFile.tsiFile);
				if (savedPath) {
					updateFilePath(activeFile.id, savedPath);
					markClean(activeFile.id);
					addRecentFile(savedPath);
				}
			}
		} catch (error) {
			console.error("Failed to save file:", error);
		}
	}, [activeFile, markClean, updateFilePath, addRecentFile]);

	// Handle save as
	const handleSaveAsFile = useCallback(async () => {
		if (!activeFile) return;

		try {
			const savedPath = await ipcClient.saveTsiFile(
				activeFile.tsiFile,
				activeFile.filePath ?? undefined,
			);
			if (savedPath) {
				updateFilePath(activeFile.id, savedPath);
				markClean(activeFile.id);
				addRecentFile(savedPath);
			}
		} catch (error) {
			console.error("Failed to save file:", error);
		}
	}, [activeFile, markClean, updateFilePath, addRecentFile]);

	// Handle close file request (may show confirmation)
	const handleCloseFileRequest = useCallback(
		async (fileId: string) => {
			const file = useTsiStore.getState().openFiles.get(fileId);
			if (!file) return;

			if (file.isDirty) {
				// Show confirmation dialog
				setPendingCloseFileId(fileId);
				const result = await unsavedChangesDialog.confirm();

				if (result === "confirm") {
					// Save then close
					try {
						if (file.filePath) {
							await ipcClient.writeTsiFile(file.tsiFile, file.filePath);
						} else {
							const savedPath = await ipcClient.saveTsiFile(file.tsiFile);
							if (!savedPath) {
								// User cancelled save dialog - don't close
								setPendingCloseFileId(null);
								return;
							}
						}
						closeFile(fileId);
					} catch (error) {
						console.error("Failed to save file:", error);
					}
				} else if (result === "third") {
					// Don't save, just close
					closeFile(fileId);
				}
				// "cancel" - do nothing

				setPendingCloseFileId(null);
			} else {
				// No unsaved changes - close directly
				closeFile(fileId);
			}
		},
		[closeFile, unsavedChangesDialog],
	);

	// ========================================================================
	// Edit Operations (Phase 14)
	// ========================================================================

	const handleCopy = useCallback(() => {
		if (activeFile && activeFile.selectedMappingIds.size > 0) {
			copyMappings(activeFile.id);
		}
	}, [activeFile, copyMappings]);

	const handleCut = useCallback(() => {
		if (activeFile && activeFile.selectedMappingIds.size > 0) {
			cutMappings(activeFile.id);
		}
	}, [activeFile, cutMappings]);

	const handlePaste = useCallback(() => {
		if (activeFile && canPaste) {
			pasteMappings(activeFile.id);
		}
	}, [activeFile, canPaste, pasteMappings]);

	const handleDuplicate = useCallback(() => {
		if (activeFile && activeFile.selectedMappingIds.size > 0) {
			duplicateMappings(activeFile.id);
		}
	}, [activeFile, duplicateMappings]);

	const handleDelete = useCallback(() => {
		if (activeFile && activeFile.selectedMappingIds.size > 0) {
			deleteMappings(activeFile.id);
		}
	}, [activeFile, deleteMappings]);

	// Phase 14.5: Undo/Redo handlers
	const handleUndo = useCallback(() => {
		if (activeFile && historyInfo.canUndo) {
			undo(activeFile.id);
		}
	}, [activeFile, historyInfo.canUndo, undo]);

	const handleRedo = useCallback(() => {
		if (activeFile && historyInfo.canRedo) {
			redo(activeFile.id);
		}
	}, [activeFile, historyInfo.canRedo, redo]);

	// Phase 15: Focus search input (for Ctrl+F shortcut)
	const handleFocusSearch = useCallback(() => {
		searchInputRef.current?.focus();
	}, []);

	// Enable state for edit buttons
	const hasSelection =
		activeFile !== null && activeFile.selectedMappingIds.size > 0;

	// Keyboard shortcuts
	useKeyboardShortcuts({
		onNew: handleNewFile,
		onOpen: handleOpenFile,
		onSave: handleSaveFile,
		onSaveAs: handleSaveAsFile,
		onCopy: handleCopy,
		onCut: handleCut,
		onPaste: handlePaste,
		onDuplicate: handleDuplicate,
		onDelete: handleDelete,
		onUndo: handleUndo,
		onRedo: handleRedo,
		onSearch: handleFocusSearch,
	});

	// ========================================================================
	// Device/Mapping Selection
	// ========================================================================

	// Get device and mapping counts
	const deviceCount = activeFile?.devices.length ?? 0;
	const mappingCount = activeFile
		? activeFile.devices.reduce(
				(sum: number, d: Device) => sum + d.mappingCount,
				0,
			)
		: 0;

	// Get selected device
	const selectedDevice = useMemo(() => {
		if (!activeFile || activeFile.selectedDeviceIndex === null) return null;
		return activeFile.devices[activeFile.selectedDeviceIndex] ?? null;
	}, [activeFile]);

	// Get selected mappings
	const selectedMappings = useMemo(() => {
		if (!selectedDevice || !activeFile) return [];
		return selectedDevice.mappings.filter((m: Mapping) =>
			activeFile.selectedMappingIds.has(m.id),
		);
	}, [selectedDevice, activeFile]);

	// Handle mapping selection change
	const handleMappingSelectionChange = useCallback(
		(newSelection: Set<number>) => {
			if (!activeFile) return;
			selectMappings(activeFile.id, Array.from(newSelection));
		},
		[activeFile, selectMappings],
	);

	// ========================================================================
	// Search and Filters (Phase 15)
	// ========================================================================

	// Handle search query change
	const handleSearchChange = useCallback(
		(query: string) => {
			if (!activeFile) return;
			setSearchQuery(activeFile.id, query);
		},
		[activeFile, setSearchQuery],
	);

	// Handle filter change
	const handleFiltersChange = useCallback(
		(newFilters: Parameters<typeof setFilters>[1]) => {
			if (!activeFile) return;
			setFilters(activeFile.id, newFilters);
		},
		[activeFile, setFilters],
	);

	// Handle clear filters
	const handleClearFilters = useCallback(() => {
		if (!activeFile) return;
		clearFilters(activeFile.id);
	}, [activeFile, clearFilters]);

	// Filter mappings based on search query and filters
	const filteredMappings = useMemo(() => {
		if (!selectedDevice || !activeFile) return { filtered: [], matchingIds: new Set<number>() };

		const searchQuery = activeFile.searchQuery;
		const filters = activeFile.filters;

		// If no search or filters, return all mappings
		if (!searchQuery && !hasActiveFilters) {
			return {
				filtered: [...selectedDevice.mappings],
				matchingIds: new Set(selectedDevice.mappings.map((m) => m.id)),
			};
		}

		return filterMappings(selectedDevice.mappings, searchQuery, filters);
	}, [selectedDevice, activeFile, hasActiveFilters]);

	// ========================================================================
	// Render
	// ========================================================================

	return (
		<div className="flex h-screen flex-col">
			{/* Toolbar */}
			<header className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
				<div className="flex items-center gap-4">
					<h1 className="text-lg font-semibold">CMDR</h1>
					<span className="text-sm text-muted-foreground">TSI Editor</span>

					{/* File actions */}
					<div className="ml-4 flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleNewFile}
							title={`New (${SHORTCUTS.new})`}
						>
							<FilePlus className="mr-2 h-4 w-4" />
							New
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleOpenFile}
							title={`Open (${SHORTCUTS.open})`}
						>
							<FolderOpen className="mr-2 h-4 w-4" />
							Open
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleSaveFile}
							disabled={!activeFile}
							title={`Save (${SHORTCUTS.save})`}
						>
							<Save className="mr-2 h-4 w-4" />
							Save
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleSaveAsFile}
							disabled={!activeFile}
							title={`Save As (${SHORTCUTS.saveAs})`}
						>
							<SaveAll className="mr-2 h-4 w-4" />
							Save As
						</Button>
					</div>

					{/* Separator */}
					<div className="h-6 w-px bg-border" />

					{/* Undo/Redo (Phase 14.5) */}
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleUndo}
							disabled={!historyInfo.canUndo}
							title={`Undo${historyInfo.undoDescription ? ` "${historyInfo.undoDescription}"` : ""} (${SHORTCUTS.undo})`}
						>
							<Undo2 className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleRedo}
							disabled={!historyInfo.canRedo}
							title={`Redo${historyInfo.redoDescription ? ` "${historyInfo.redoDescription}"` : ""} (${SHORTCUTS.redo})`}
						>
							<Redo2 className="h-4 w-4" />
						</Button>
					</div>

					{/* Separator */}
					<div className="h-6 w-px bg-border" />

					{/* Edit actions (Phase 14) */}
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleCopy}
							disabled={!hasSelection}
							title={`Copy (${SHORTCUTS.copy})`}
						>
							<Copy className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleCut}
							disabled={!hasSelection}
							title={`Cut (${SHORTCUTS.cut})`}
						>
							<Scissors className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handlePaste}
							disabled={!canPaste}
							title={`Paste (${SHORTCUTS.paste})`}
						>
							<ClipboardPaste className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleDuplicate}
							disabled={!hasSelection}
							title={`Duplicate (${SHORTCUTS.duplicate})`}
						>
							<ClipboardCopy className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleDelete}
							disabled={!hasSelection}
							title={`Delete (${SHORTCUTS.delete})`}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>

				<div className="flex items-center gap-2">
					{/* MIDI status indicator */}
					<span
						className={`mr-2 flex items-center gap-1.5 text-xs ${
							midiEnabled ? "text-green-500" : "text-muted-foreground"
						}`}
					>
						<span
							className={`h-2 w-2 rounded-full ${
								midiEnabled ? "bg-green-500" : "bg-muted-foreground"
							}`}
						/>
						MIDI {midiEnabled ? "Ready" : "Off"}
					</span>

					{/* Theme toggle */}
					<ThemeToggle />
				</div>
			</header>

			{/* File Tabs */}
			<FileTabs
				files={openFiles}
				activeFileId={activeFile?.id ?? null}
				onSelectFile={setActiveFile}
				onCloseFile={handleCloseFileRequest}
			/>

			{/* Main Content */}
			<main className="flex flex-1 overflow-hidden">
				{/* Left Panel - Device Tree */}
				<aside className="w-64 overflow-auto border-r border-border bg-card p-4">
					<h2 className="mb-4 text-sm font-medium">Devices</h2>
					{activeFile ? (
						<DeviceList
							devices={activeFile.devices}
							selectedIndex={activeFile.selectedDeviceIndex}
							fileId={activeFile.id}
						/>
					) : (
						<p className="text-sm text-muted-foreground">No file loaded</p>
					)}
				</aside>

				{/* Center - Mapping List */}
				<section className="flex flex-1 flex-col overflow-hidden">
					{activeFile && selectedDevice ? (
						<>
							{/* Search and Filter Bar (Phase 15) */}
							<div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
								<SearchInput
									ref={searchInputRef}
									value={activeFile.searchQuery}
									onChange={handleSearchChange}
									placeholder="Search mappings..."
									showShortcut
									className="w-64"
								/>
								<FilterPanel
									filters={activeFile.filters}
									onFiltersChange={handleFiltersChange}
									onClearFilters={handleClearFilters}
									hasActiveFilters={hasActiveFilters}
								/>
								<div className="ml-auto text-sm text-muted-foreground">
									{hasActiveFilters || activeFile.searchQuery
										? `${filteredMappings.filtered.length} of ${selectedDevice.mappingCount} mappings`
										: `${selectedDevice.mappingCount} mappings`}
								</div>
							</div>
							<div className="flex-1 overflow-hidden">
								<MappingList
									mappings={filteredMappings.filtered}
									selectedIds={activeFile.selectedMappingIds}
									onSelectionChange={handleMappingSelectionChange}
									height={undefined} // Let it fill available space
									totalCount={selectedDevice.mappingCount}
									isFiltered={hasActiveFilters || !!activeFile.searchQuery}
									searchQuery={activeFile.searchQuery}
								/>
							</div>
						</>
					) : activeFile ? (
						// File loaded but no device selected
						<div className="flex h-full items-center justify-center">
							<p className="text-muted-foreground">
								Select a device to view mappings
							</p>
						</div>
					) : (
						// No file loaded - show welcome screen
						<div className="flex h-full items-center justify-center">
							<div className="text-center max-w-md">
								<p className="text-muted-foreground mb-4">
									Open a TSI file to start editing
								</p>
								<div className="flex items-center justify-center gap-2 mb-6">
									<Button variant="outline" onClick={handleNewFile}>
										<FilePlus className="mr-2 h-4 w-4" />
										New File
									</Button>
									<Button variant="outline" onClick={handleOpenFile}>
										<FolderOpen className="mr-2 h-4 w-4" />
										Open File
									</Button>
								</div>

								{/* Recent Files */}
								{recentFiles.length > 0 && (
									<div className="border-t border-border pt-4">
										<h3 className="text-sm font-medium mb-2 flex items-center justify-center gap-2">
											<Clock className="h-4 w-4" />
											Recent Files
										</h3>
										<ul className="space-y-1 text-left">
											{recentFiles.slice(0, 5).map((file) => (
												<li key={file.path}>
													<button
														type="button"
														onClick={() => handleOpenRecentFile(file.path)}
														className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent rounded truncate"
														title={file.path}
													>
														{file.name}
													</button>
												</li>
											))}
										</ul>
									</div>
								)}
							</div>
						</div>
					)}
				</section>

				{/* Right Panel - Properties */}
				<aside className="w-80 overflow-auto border-l border-border bg-card">
					<div className="border-b border-border px-4 py-2">
						<h2 className="text-sm font-medium">Properties</h2>
					</div>
					<MappingEditor
						mappings={selectedMappings}
						fileId={activeFile?.id ?? null}
					/>
				</aside>
			</main>

			{/* Status Bar */}
			<footer className="flex items-center justify-between border-t border-border bg-card px-4 py-1">
				<p className="text-xs text-muted-foreground">
					{activeFile
						? `${activeFile.displayName}${activeFile.isDirty ? " •" : ""}`
						: "Ready"}
				</p>
				<p className="text-xs text-muted-foreground">
					{activeFile
						? `${deviceCount} device${deviceCount !== 1 ? "s" : ""}, ${mappingCount} mapping${mappingCount !== 1 ? "s" : ""}`
						: ""}
				</p>
			</footer>

			{/* Unsaved Changes Confirmation Dialog */}
			<ConfirmDialog {...unsavedChangesDialog.dialogProps} />
		</div>
	);
}

// ============================================================================
// App Root Component
// ============================================================================

/**
 * Root App component with providers
 */
export function App() {
	return (
		<ThemeProvider defaultTheme="dark">
			<AppLayout />
		</ThemeProvider>
	);
}

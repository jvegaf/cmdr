/**
 * Main Application Component
 *
 * AIDEV-NOTE: Root component for the CMDR application.
 * Manages the overall layout with toolbar, device tree, mapping list, and property editor.
 * Uses dedicated components for each panel: DeviceList, MappingList, MappingEditor.
 * Wraps everything in ThemeProvider for consistent theming.
 */

import type { Device, Mapping } from "@cmdr/core";
import { FolderOpen, Save } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";

import { DeviceList } from "./components/devices";
import { MappingEditor } from "./components/editors";
import { MappingList } from "./components/mappings";
import { ThemeProvider, ThemeToggle } from "./components/theme";
import { Button } from "./components/ui";
import { ipcClient } from "./lib/ipc-client";
import { useMidiStore } from "./store/midiStore";
import { useActiveFile, useTsiStore } from "./store/tsiStore";

// ============================================================================
// AppLayout Component
// ============================================================================

/**
 * Main application layout with 3-panel design
 */
function AppLayout() {
	const activeFile = useActiveFile();
	const openFile = useTsiStore((s) => s.openFile);
	const selectMappings = useTsiStore((s) => s.selectMappings);
	const { initialize: initMidi, isEnabled: midiEnabled } = useMidiStore();

	// Initialize MIDI on mount
	useEffect(() => {
		initMidi();
	}, [initMidi]);

	// Handle open file
	const handleOpenFile = useCallback(async () => {
		try {
			const result = await ipcClient.openTsiFile();
			if (result) {
				openFile(result.filePath, result.tsiFile);
			}
		} catch (error) {
			console.error("Failed to open file:", error);
		}
	}, [openFile]);

	// Handle save file
	const handleSaveFile = useCallback(async () => {
		if (!activeFile) return;

		try {
			if (activeFile.filePath) {
				await ipcClient.writeTsiFile(activeFile.tsiFile, activeFile.filePath);
			} else {
				await ipcClient.saveTsiFile(activeFile.tsiFile);
			}
		} catch (error) {
			console.error("Failed to save file:", error);
		}
	}, [activeFile]);

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

	return (
		<div className="flex h-screen flex-col">
			{/* Toolbar */}
			<header className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
				<div className="flex items-center gap-4">
					<h1 className="text-lg font-semibold">CMDR</h1>
					<span className="text-sm text-muted-foreground">TSI Editor</span>

					{/* File actions */}
					<div className="ml-4 flex items-center gap-1">
						<Button variant="ghost" size="sm" onClick={handleOpenFile}>
							<FolderOpen className="mr-2 h-4 w-4" />
							Open
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleSaveFile}
							disabled={!activeFile}
						>
							<Save className="mr-2 h-4 w-4" />
							Save
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
							<div className="border-b border-border bg-muted/30 px-4 py-2">
								<h2 className="text-sm font-medium">
									Mappings ({selectedDevice.mappingCount})
								</h2>
							</div>
							<div className="flex-1 overflow-hidden">
								<MappingList
									mappings={selectedDevice.mappings}
									selectedIds={activeFile.selectedMappingIds}
									onSelectionChange={handleMappingSelectionChange}
									height={undefined} // Let it fill available space
								/>
							</div>
						</>
					) : (
						<div className="flex h-full items-center justify-center">
							<div className="text-center">
								<p className="text-muted-foreground">
									{activeFile
										? "Select a device to view mappings"
										: "Open a TSI file to start editing"}
								</p>
								{!activeFile && (
									<p className="mt-2 text-sm text-muted-foreground">
										File → Open or Ctrl+O
									</p>
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

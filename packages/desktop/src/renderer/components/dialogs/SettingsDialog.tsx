/**
 * Settings Dialog Component
 *
 * AIDEV-NOTE: Modal dialog for configuring application settings.
 * Organized into tabs matching the legacy cmdr application:
 * - Paths: File system locations
 * - Traktor: Traktor integration settings
 * - TSI: TSI file optimization
 * - Editor: Display and behavior
 * - Confirmations: Delete confirmations
 * - MIDI: MIDI device settings
 * - Advanced: Debug and startup options
 */

import { FolderOpen, RotateCcw, Settings2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "../../lib/utils";
import {
	type AppSettings,
	useAppStore,
	useSettings,
} from "../../store/appStore";
import { Button, Checkbox, Input } from "../ui";

// ============================================================================
// Types
// ============================================================================

export interface SettingsDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** Called when the dialog should close */
	onClose: () => void;
}

type SettingsTab =
	| "paths"
	| "traktor"
	| "tsi"
	| "editor"
	| "confirmations"
	| "midi"
	| "advanced";

// ============================================================================
// Tab definitions
// ============================================================================

const TABS: { id: SettingsTab; label: string }[] = [
	{ id: "paths", label: "Paths" },
	{ id: "traktor", label: "Traktor" },
	{ id: "tsi", label: "TSI Optimization" },
	{ id: "editor", label: "Editor" },
	{ id: "confirmations", label: "Confirmations" },
	{ id: "midi", label: "MIDI" },
	{ id: "advanced", label: "Advanced" },
];

// ============================================================================
// SettingsDialog Component
// ============================================================================

/**
 * Modal dialog for application settings
 */
export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
	const dialogRef = useRef<HTMLDivElement>(null);
	const [activeTab, setActiveTab] = useState<SettingsTab>("paths");
	const settings = useSettings();
	const {
		updatePathsSettings,
		updateTraktorSettings,
		updateTsiOptimizationSettings,
		updateEditorSettings,
		updateConfirmationsSettings,
		updateMidiSettings,
		updateAdvancedSettings,
		resetSettings,
	} = useAppStore();

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

	// Reset to active tab on open
	useEffect(() => {
		if (open) {
			setActiveTab("paths");
		}
	}, [open]);

	// Handle reset
	const handleReset = useCallback(() => {
		if (window.confirm("Reset all settings to defaults?")) {
			resetSettings();
		}
	}, [resetSettings]);

	if (!open) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			{/* Backdrop - AIDEV-NOTE: stopPropagation on dialog prevents clicks inside from closing */}
			<button
				type="button"
				className="absolute inset-0 cursor-default"
				onClick={onClose}
				aria-label="Close dialog"
			/>

			{/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation is for mouse only */}
			<div
				ref={dialogRef}
				className={cn(
					"relative bg-card border border-border rounded-lg shadow-lg",
					"w-[750px] max-w-[95vw] h-[85vh] max-h-[800px] flex flex-col",
					"animate-in fade-in-0 zoom-in-95",
				)}
				role="dialog"
				aria-modal="true"
				aria-labelledby="settings-dialog-title"
				tabIndex={-1}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-border">
					<div className="flex items-center gap-3">
						<Settings2 className="h-5 w-5 text-primary" />
						<h2 id="settings-dialog-title" className="text-lg font-semibold">
							Settings
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
				<div className="flex flex-1 overflow-hidden">
					{/* Sidebar tabs */}
					<div className="w-44 border-r border-border p-2 space-y-1 overflow-y-auto">
						{TABS.map((tab) => (
							<button
								key={tab.id}
								type="button"
								onClick={() => setActiveTab(tab.id)}
								className={cn(
									"w-full px-3 py-2 text-sm text-left rounded-md transition-colors",
									activeTab === tab.id
										? "bg-primary text-primary-foreground"
										: "hover:bg-muted",
								)}
							>
								{tab.label}
							</button>
						))}
					</div>

					{/* Settings content */}
					<div className="flex-1 p-6 overflow-auto">
						{activeTab === "paths" && (
							<PathsSettings
								settings={settings.paths}
								onUpdate={updatePathsSettings}
							/>
						)}
						{activeTab === "traktor" && (
							<TraktorSettingsPanel
								settings={settings.traktor}
								onUpdate={updateTraktorSettings}
							/>
						)}
						{activeTab === "tsi" && (
							<TsiOptimizationSettings
								settings={settings.tsiOptimization}
								onUpdate={updateTsiOptimizationSettings}
							/>
						)}
						{activeTab === "editor" && (
							<EditorSettings
								settings={settings.editor}
								onUpdate={updateEditorSettings}
							/>
						)}
						{activeTab === "confirmations" && (
							<ConfirmationsSettings
								settings={settings.confirmations}
								onUpdate={updateConfirmationsSettings}
							/>
						)}
						{activeTab === "midi" && (
							<MidiSettings
								settings={settings.midi}
								onUpdate={updateMidiSettings}
							/>
						)}
						{activeTab === "advanced" && (
							<AdvancedSettings
								settings={settings.advanced}
								onUpdate={updateAdvancedSettings}
							/>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between px-6 py-4 border-t border-border">
					<Button variant="ghost" size="sm" onClick={handleReset}>
						<RotateCcw className="mr-2 h-4 w-4" />
						Reset to Defaults
					</Button>
					<Button onClick={onClose}>Done</Button>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// Path Input Component
// ============================================================================

interface PathInputProps {
	id: string;
	label: string;
	description?: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	browseType?: "folder" | "file";
}

function PathInput({
	id,
	label,
	description,
	value,
	onChange,
	placeholder,
	browseType = "folder",
}: PathInputProps) {
	const handleBrowse = async () => {
		// TODO: Implement file/folder browser via IPC
		// For now, just show an alert
		const message =
			browseType === "folder"
				? "Folder browser will be implemented via Electron IPC"
				: "File browser will be implemented via Electron IPC";
		alert(message);
	};

	return (
		<div className="space-y-1.5">
			<label htmlFor={id} className="text-sm font-medium">
				{label}
			</label>
			{description && (
				<p className="text-xs text-muted-foreground">{description}</p>
			)}
			<div className="flex gap-2">
				<Input
					id={id}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					className="flex-1"
				/>
				<Button
					variant="outline"
					size="sm"
					onClick={handleBrowse}
					className="px-3"
					title={browseType === "folder" ? "Browse folder" : "Browse file"}
				>
					<FolderOpen className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}

// ============================================================================
// Paths Settings
// ============================================================================

interface PathsSettingsProps {
	settings: AppSettings["paths"];
	onUpdate: (updates: Partial<AppSettings["paths"]>) => void;
}

function PathsSettings({ settings, onUpdate }: PathsSettingsProps) {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-sm font-medium mb-4">File Paths</h3>
				<div className="space-y-5">
					<PathInput
						id="default-workspace"
						label="Default Workspace"
						description="This is where your TSI mapping files are stored"
						value={settings.defaultWorkspace}
						onChange={(value) => onUpdate({ defaultWorkspace: value })}
						placeholder="/path/to/your/mappings"
						browseType="folder"
					/>

					<PathInput
						id="controller-mappings"
						label="Path to Controller Default Mappings"
						description="Usually: /Traktor {Version}/Settings/Default Settings/Controller"
						value={settings.pathToControllerDefaultMappings}
						onChange={(value) =>
							onUpdate({ pathToControllerDefaultMappings: value })
						}
						placeholder="/path/to/Traktor/Settings/Default Settings/Controller"
						browseType="folder"
					/>

					<PathInput
						id="traktor-settings"
						label='Path to "Traktor Settings.tsi"'
						description="Usually: /Traktor {Version}/Traktor Settings.tsi"
						value={settings.pathToTraktorSettings}
						onChange={(value) => onUpdate({ pathToTraktorSettings: value })}
						placeholder="/path/to/Traktor Settings.tsi"
						browseType="file"
					/>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// Traktor Settings
// ============================================================================

interface TraktorSettingsPanelProps {
	settings: AppSettings["traktor"];
	onUpdate: (updates: Partial<AppSettings["traktor"]>) => void;
}

function TraktorSettingsPanel({
	settings,
	onUpdate,
}: TraktorSettingsPanelProps) {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-sm font-medium mb-4">Traktor Version</h3>
				<p className="text-xs text-muted-foreground mb-4">
					This version is written into TSI files, so Traktor can check
					compatibility.
				</p>
				<div className="space-y-4">
					<div className="space-y-1.5">
						<label htmlFor="traktor-version" className="text-sm font-medium">
							Traktor Version
						</label>
						<Input
							id="traktor-version"
							value={settings.traktorVersion}
							onChange={(e) => onUpdate({ traktorVersion: e.target.value })}
							placeholder="3.11.0"
							disabled={!settings.overrideTraktorVersion}
							className={cn(
								!settings.overrideTraktorVersion && "opacity-50 italic",
							)}
						/>
					</div>
					<Checkbox
						label="Override auto-detected version"
						description="Manually specify the Traktor version instead of auto-detecting from settings"
						checked={settings.overrideTraktorVersion}
						onChange={(e) =>
							onUpdate({ overrideTraktorVersion: e.target.checked })
						}
					/>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// TSI Optimization Settings
// ============================================================================

interface TsiOptimizationSettingsProps {
	settings: AppSettings["tsiOptimization"];
	onUpdate: (updates: Partial<AppSettings["tsiOptimization"]>) => void;
}

function TsiOptimizationSettings({
	settings,
	onUpdate,
}: TsiOptimizationSettingsProps) {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-sm font-medium mb-4">TSI File Optimization</h3>
				<p className="text-xs text-muted-foreground mb-4">
					These options help reduce TSI file size and improve loading times.
				</p>
				<div className="space-y-4">
					<Checkbox
						label="Optimize TSI (remove unused MIDI definitions)"
						description="When loading, remove unused MIDI entries. This leads to faster loading and much smaller files when saving."
						checked={settings.removeUnusedMidiDefinitions}
						onChange={(e) =>
							onUpdate({ removeUnusedMidiDefinitions: e.target.checked })
						}
					/>
					<Checkbox
						label="Reduce FX list"
						description="When saving, reduce the FX list to only the effects actually used. Keep unchecked to preserve all FX as-is."
						checked={settings.optimizeFxList}
						onChange={(e) => onUpdate({ optimizeFxList: e.target.checked })}
					/>
					<Checkbox
						label="Remove empty devices"
						description="When saving, remove devices that have no mappings."
						checked={settings.removeEmptyDevices}
						onChange={(e) => onUpdate({ removeEmptyDevices: e.target.checked })}
					/>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// Editor Settings
// ============================================================================

interface EditorSettingsProps {
	settings: AppSettings["editor"];
	onUpdate: (updates: Partial<AppSettings["editor"]>) => void;
}

function EditorSettings({ settings, onUpdate }: EditorSettingsProps) {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-sm font-medium mb-4">Display Options</h3>
				<div className="space-y-4">
					<Checkbox
						label="Show MIDI binding column"
						checked={settings.showMidiColumn}
						onChange={(e) => onUpdate({ showMidiColumn: e.target.checked })}
					/>
					<Checkbox
						label="Show conditions column"
						checked={settings.showConditionsColumn}
						onChange={(e) =>
							onUpdate({ showConditionsColumn: e.target.checked })
						}
					/>
					<Checkbox
						label="Show comment column"
						checked={settings.showCommentColumn}
						onChange={(e) => onUpdate({ showCommentColumn: e.target.checked })}
					/>
					<Checkbox
						label="Show decimal MIDI notes"
						description='Display decimal note values alongside note names (e.g., "C4 (60)")'
						checked={settings.showDecimalNotes}
						onChange={(e) => onUpdate({ showDecimalNotes: e.target.checked })}
					/>
					<Checkbox
						label="Show Notes before CCs"
						description="In MIDI value menus, display Notes before Control Changes"
						checked={settings.showNotesBeforeCc}
						onChange={(e) => onUpdate({ showNotesBeforeCc: e.target.checked })}
					/>
				</div>
			</div>

			<div>
				<h3 className="text-sm font-medium mb-4">Filter Behavior</h3>
				<div className="space-y-4">
					<Checkbox
						label="Clear filter when changing pages"
						description="Automatically clear search/filter when switching devices"
						checked={settings.clearFilterAtPageChanges}
						onChange={(e) =>
							onUpdate({ clearFilterAtPageChanges: e.target.checked })
						}
					/>
					<Checkbox
						label="Clear filter after modifications"
						description="Automatically clear search/filter when modifying mappings"
						checked={settings.clearFilterAtModifications}
						onChange={(e) =>
							onUpdate({ clearFilterAtModifications: e.target.checked })
						}
					/>
					<div className="space-y-1.5">
						<label htmlFor="filter-menu-size" className="text-sm font-medium">
							Filter menu size
						</label>
						<p className="text-xs text-muted-foreground">
							Maximum number of entries in filter dropdown menus
						</p>
						<Input
							id="filter-menu-size"
							type="number"
							min={5}
							max={100}
							value={settings.filterMenuSize}
							onChange={(e) =>
								onUpdate({ filterMenuSize: Number(e.target.value) || 20 })
							}
							className="w-24"
						/>
					</div>
				</div>
			</div>

			<div>
				<h3 className="text-sm font-medium mb-4">Default View</h3>
				<div className="flex items-center gap-4">
					<label htmlFor="view-mode" className="text-sm text-muted-foreground">
						View mode:
					</label>
					<select
						id="view-mode"
						value={settings.defaultViewMode}
						onChange={(e) =>
							onUpdate({
								defaultViewMode: e.target.value as "table" | "grid",
							})
						}
						className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
					>
						<option value="table">Table</option>
						<option value="grid">Grid (coming soon)</option>
					</select>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// Confirmations Settings
// ============================================================================

interface ConfirmationsSettingsProps {
	settings: AppSettings["confirmations"];
	onUpdate: (updates: Partial<AppSettings["confirmations"]>) => void;
}

function ConfirmationsSettings({
	settings,
	onUpdate,
}: ConfirmationsSettingsProps) {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-sm font-medium mb-4">Delete Confirmations</h3>
				<p className="text-xs text-muted-foreground mb-4">
					Configure when to show confirmation dialogs before deleting items.
				</p>
				<div className="space-y-4">
					<Checkbox
						label="Confirm before deleting devices"
						description="Show a confirmation dialog when deleting devices"
						checked={settings.confirmDeleteDevices}
						onChange={(e) =>
							onUpdate({ confirmDeleteDevices: e.target.checked })
						}
					/>
					<div className="space-y-1.5">
						<label
							htmlFor="delete-mappings-threshold"
							className="text-sm font-medium"
						>
							Mapping delete confirmation threshold
						</label>
						<p className="text-xs text-muted-foreground">
							Show confirmation when deleting this many mappings or more (0 =
							disabled)
						</p>
						<Input
							id="delete-mappings-threshold"
							type="number"
							min={0}
							max={1000}
							value={settings.confirmDeleteMappingsThreshold}
							onChange={(e) =>
								onUpdate({
									confirmDeleteMappingsThreshold: Number(e.target.value) || 0,
								})
							}
							className="w-24"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// MIDI Settings
// ============================================================================

interface MidiSettingsProps {
	settings: AppSettings["midi"];
	onUpdate: (updates: Partial<AppSettings["midi"]>) => void;
}

function MidiSettings({ settings, onUpdate }: MidiSettingsProps) {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-sm font-medium mb-4">MIDI Settings</h3>
				<div className="space-y-4">
					<Checkbox
						label="Enable MIDI on startup"
						description="Automatically initialize MIDI when the app starts"
						checked={settings.enableOnStartup}
						onChange={(e) => onUpdate({ enableOnStartup: e.target.checked })}
					/>
				</div>
			</div>

			<div>
				<h3 className="text-sm font-medium mb-4">MIDI Learn</h3>
				<div className="flex items-center gap-4">
					<label
						htmlFor="learn-timeout"
						className="text-sm text-muted-foreground"
					>
						Learn timeout (seconds):
					</label>
					<select
						id="learn-timeout"
						value={settings.learnTimeout}
						onChange={(e) => onUpdate({ learnTimeout: Number(e.target.value) })}
						className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
					>
						<option value={5}>5 seconds</option>
						<option value={10}>10 seconds</option>
						<option value={15}>15 seconds</option>
						<option value={30}>30 seconds</option>
						<option value={60}>60 seconds</option>
					</select>
				</div>
			</div>

			<div>
				<h3 className="text-sm font-medium mb-4">Default Devices</h3>
				<p className="text-sm text-muted-foreground mb-2">
					Device selection will be available when MIDI devices are connected.
				</p>
				<div className="space-y-3">
					<div>
						<label
							htmlFor="default-input-device"
							className="text-sm text-muted-foreground block mb-1"
						>
							Default Input Device:
						</label>
						<Input
							id="default-input-device"
							value={settings.defaultInputDevice}
							onChange={(e) => onUpdate({ defaultInputDevice: e.target.value })}
							placeholder="(Auto-detect)"
						/>
					</div>
					<div>
						<label
							htmlFor="default-output-device"
							className="text-sm text-muted-foreground block mb-1"
						>
							Default Output Device:
						</label>
						<Input
							id="default-output-device"
							value={settings.defaultOutputDevice}
							onChange={(e) =>
								onUpdate({ defaultOutputDevice: e.target.value })
							}
							placeholder="(Auto-detect)"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// Advanced Settings
// ============================================================================

interface AdvancedSettingsProps {
	settings: AppSettings["advanced"];
	onUpdate: (updates: Partial<AppSettings["advanced"]>) => void;
}

function AdvancedSettings({ settings, onUpdate }: AdvancedSettingsProps) {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-sm font-medium mb-4">Startup</h3>
				<div className="space-y-4">
					<Checkbox
						label="Load last file at startup"
						description="Automatically load the most recently opened TSI file when starting"
						checked={settings.loadLastFileAtStartup}
						onChange={(e) =>
							onUpdate({ loadLastFileAtStartup: e.target.checked })
						}
					/>
				</div>
			</div>

			<div>
				<h3 className="text-sm font-medium mb-4">Debugging</h3>
				<div className="space-y-4">
					<Checkbox
						label="Verbose exceptions"
						description="Show detailed error information when errors occur. Enable this if you need to report a bug."
						checked={settings.verboseExceptions}
						onChange={(e) => onUpdate({ verboseExceptions: e.target.checked })}
					/>
				</div>
				<p className="text-xs text-muted-foreground mt-4">
					If you encounter errors, please report them at:{" "}
					<a
						href="https://github.com/pestrela/cmdr/issues"
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:underline"
					>
						github.com/pestrela/cmdr/issues
					</a>
				</p>
			</div>
		</div>
	);
}

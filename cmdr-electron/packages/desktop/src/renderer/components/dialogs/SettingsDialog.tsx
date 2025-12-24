/**
 * Settings Dialog Component
 *
 * AIDEV-NOTE: Modal dialog for configuring application settings.
 * Organized into tabs: General, Editor, MIDI.
 */

import { RotateCcw, Settings2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "../../lib/utils";
import {
	type AppSettings,
	useAppStore,
	useSettings,
} from "../../store/appStore";
import { Button, Checkbox } from "../ui";

// ============================================================================
// Types
// ============================================================================

export interface SettingsDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** Called when the dialog should close */
	onClose: () => void;
}

type SettingsTab = "general" | "editor" | "midi";

// ============================================================================
// Tab definitions
// ============================================================================

const TABS: { id: SettingsTab; label: string }[] = [
	{ id: "general", label: "General" },
	{ id: "editor", label: "Editor" },
	{ id: "midi", label: "MIDI" },
];

// ============================================================================
// SettingsDialog Component
// ============================================================================

/**
 * Modal dialog for application settings
 */
export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
	const dialogRef = useRef<HTMLDivElement>(null);
	const [activeTab, setActiveTab] = useState<SettingsTab>("general");
	const settings = useSettings();
	const {
		updateGeneralSettings,
		updateEditorSettings,
		updateMidiSettings,
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
			setActiveTab("general");
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
					"w-[600px] max-h-[80vh] flex flex-col",
					"animate-in fade-in-0 zoom-in-95",
				)}
				role="dialog"
				aria-modal="true"
				aria-labelledby="settings-dialog-title"
				tabIndex={-1}
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
					<div className="w-40 border-r border-border p-2 space-y-1">
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
						{activeTab === "general" && (
							<GeneralSettings
								settings={settings.general}
								onUpdate={updateGeneralSettings}
							/>
						)}
						{activeTab === "editor" && (
							<EditorSettings
								settings={settings.editor}
								onUpdate={updateEditorSettings}
							/>
						)}
						{activeTab === "midi" && (
							<MidiSettings
								settings={settings.midi}
								onUpdate={updateMidiSettings}
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
// General Settings
// ============================================================================

interface GeneralSettingsProps {
	settings: AppSettings["general"];
	onUpdate: (updates: Partial<AppSettings["general"]>) => void;
}

function GeneralSettings({ settings, onUpdate }: GeneralSettingsProps) {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-sm font-medium mb-4">General Settings</h3>
				<div className="space-y-4">
					<Checkbox
						label="Show welcome screen on startup"
						description="Display the welcome screen with recent files when starting the app"
						checked={settings.showWelcome}
						onChange={(e) => onUpdate({ showWelcome: e.target.checked })}
					/>
					<Checkbox
						label="Confirm before deleting mappings"
						description="Show a confirmation dialog when deleting multiple mappings"
						checked={settings.confirmDelete}
						onChange={(e) => onUpdate({ confirmDelete: e.target.checked })}
					/>
				</div>
			</div>

			<div>
				<h3 className="text-sm font-medium mb-4">Auto-save</h3>
				<div className="flex items-center gap-4">
					<label
						htmlFor="autosave-interval"
						className="text-sm text-muted-foreground"
					>
						Auto-save interval (minutes):
					</label>
					<select
						id="autosave-interval"
						value={settings.autoSaveInterval}
						onChange={(e) =>
							onUpdate({ autoSaveInterval: Number(e.target.value) })
						}
						className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
					>
						<option value={0}>Disabled</option>
						<option value={1}>1 minute</option>
						<option value={5}>5 minutes</option>
						<option value={10}>10 minutes</option>
						<option value={15}>15 minutes</option>
						<option value={30}>30 minutes</option>
					</select>
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
				<h3 className="text-sm font-medium mb-4">Mapping List Columns</h3>
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
				</div>
			</div>

			<div>
				<h3 className="text-sm font-medium mb-4">Default View</h3>
				<div className="flex items-center gap-4">
					<label
						htmlFor="view-mode"
						className="text-sm text-muted-foreground"
					>
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
						onChange={(e) =>
							onUpdate({ learnTimeout: Number(e.target.value) })
						}
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
						<input
							id="default-input-device"
							type="text"
							value={settings.defaultInputDevice}
							onChange={(e) => onUpdate({ defaultInputDevice: e.target.value })}
							placeholder="(Auto-detect)"
							className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm"
						/>
					</div>
					<div>
						<label
							htmlFor="default-output-device"
							className="text-sm text-muted-foreground block mb-1"
						>
							Default Output Device:
						</label>
						<input
							id="default-output-device"
							type="text"
							value={settings.defaultOutputDevice}
							onChange={(e) =>
								onUpdate({ defaultOutputDevice: e.target.value })
							}
							placeholder="(Auto-detect)"
							className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

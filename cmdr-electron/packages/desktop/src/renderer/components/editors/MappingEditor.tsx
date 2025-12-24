/**
 * MappingEditor Component
 *
 * AIDEV-NOTE: Properties panel for editing selected mapping(s).
 * Shows read-only summary when multiple mappings are selected.
 * Shows editable fields when a single mapping is selected.
 *
 * Sections:
 * - Command (name, category, assignment)
 * - Control (type, interaction mode, flags)
 * - MIDI Binding (note/CC, channel, MIDI Learn)
 * - Conditions (condition 1 & 2)
 * - Comment
 */

import type { Mapping, MidiBinding } from "@cmdr/core";
import {
	MappingControlType,
	MappingInteractionMode,
	MappingTargetDeck,
} from "@cmdr/core";
import { Info, Music2, Settings2, StickyNote, Zap } from "lucide-react";
import { useCallback } from "react";

import { cn } from "../../lib/utils";
import { type MappingUpdate, useTsiStore } from "../../store/tsiStore";
import { Checkbox, Select, type SelectOption, Textarea } from "../ui";
import {
	CommandSelector,
	ConditionSelector,
	MidiBindingEditor,
} from "./fields";

// ============================================================================
// Types
// ============================================================================

export interface MappingEditorProps {
	/** Selected mappings */
	mappings: Mapping[];
	/** Active file ID for store updates */
	fileId: string | null;
	/** Callback to start MIDI learn */
	onMidiLearn?: (mappingId: number) => void;
}

// ============================================================================
// Constants
// ============================================================================

const TARGET_OPTIONS: SelectOption[] = [
	{ value: MappingTargetDeck.DeviceTarget, label: "Device Target" },
	{ value: MappingTargetDeck.DeckA, label: "Deck A" },
	{ value: MappingTargetDeck.DeckB, label: "Deck B" },
	{ value: MappingTargetDeck.DeckC, label: "Deck C" },
	{ value: MappingTargetDeck.DeckD, label: "Deck D" },
	{ value: MappingTargetDeck.DeckFocusedSlotLeft, label: "Focused Slot Left" },
	{
		value: MappingTargetDeck.DeckFocusedSlotRight,
		label: "Focused Slot Right",
	},
];

const CONTROL_TYPE_OPTIONS: SelectOption[] = [
	{ value: MappingControlType.Button, label: "Button" },
	{ value: MappingControlType.FaderOrKnob, label: "Fader/Knob" },
	{ value: MappingControlType.Encoder, label: "Encoder" },
];

const INTERACTION_MODE_OPTIONS: SelectOption[] = [
	{ value: MappingInteractionMode.Trigger, label: "Trigger" },
	{ value: MappingInteractionMode.Toggle, label: "Toggle" },
	{ value: MappingInteractionMode.Hold, label: "Hold" },
	{ value: MappingInteractionMode.Direct, label: "Direct" },
	{ value: MappingInteractionMode.Relative, label: "Relative" },
	{ value: MappingInteractionMode.Increment, label: "Increment" },
	{ value: MappingInteractionMode.Decrement, label: "Decrement" },
	{ value: MappingInteractionMode.Reset, label: "Reset" },
];

// ============================================================================
// Section Components
// ============================================================================

interface SectionProps {
	title: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}

function Section({ title, icon, children, className }: SectionProps) {
	return (
		<div className={cn("space-y-3", className)}>
			<div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
				{icon}
				{title}
			</div>
			<div className="space-y-3">{children}</div>
		</div>
	);
}

interface FieldRowProps {
	label: string;
	children: React.ReactNode;
}

function FieldRow({ label, children }: FieldRowProps) {
	return (
		<div className="space-y-1">
			<span className="text-xs text-muted-foreground">{label}</span>
			{children}
		</div>
	);
}

// ============================================================================
// MappingEditor Component
// ============================================================================

export function MappingEditor({
	mappings,
	fileId,
	onMidiLearn,
}: MappingEditorProps) {
	const updateMapping = useTsiStore((state) => state.updateMapping);

	// Handler to update a single property
	const handleUpdate = useCallback(
		(updates: MappingUpdate) => {
			if (!fileId || mappings.length !== 1) return;
			const mapping = mappings[0];
			if (!mapping) return;
			updateMapping(fileId, mapping.id, updates);
		},
		[fileId, mappings, updateMapping],
	);

	// No selection
	if (mappings.length === 0) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
				<Info className="h-8 w-8 text-muted-foreground" />
				<p className="text-sm text-muted-foreground">
					Select a mapping to view properties
				</p>
			</div>
		);
	}

	// Multiple selection - show summary
	if (mappings.length > 1) {
		return (
			<div className="space-y-4 p-4">
				<div className="rounded-md bg-muted/50 p-3 text-center">
					<p className="text-sm font-medium">
						{mappings.length} mappings selected
					</p>
					<p className="mt-1 text-xs text-muted-foreground">
						Select a single mapping to edit its properties
					</p>
				</div>

				{/* Summary of selected mappings */}
				<Section title="Summary" icon={<Info className="h-3 w-3" />}>
					<div className="space-y-1 text-xs">
						{mappings.slice(0, 5).map((m) => (
							<div
								key={m.id}
								className="flex items-center justify-between rounded bg-muted/30 px-2 py-1"
							>
								<span className="truncate">{m.commandName}</span>
								<span className="font-mono text-muted-foreground">
									{m.midiBinding?.note ?? "—"}
								</span>
							</div>
						))}
						{mappings.length > 5 && (
							<p className="text-center text-muted-foreground">
								and {mappings.length - 5} more...
							</p>
						)}
					</div>
				</Section>
			</div>
		);
	}

	// Single selection - show full editor
	const mapping = mappings[0];
	if (!mapping) return null;

	return (
		<div className="space-y-6 overflow-y-auto p-4">
			{/* Command Section */}
			<Section title="Command" icon={<Zap className="h-3 w-3" />}>
				<FieldRow label="Command">
					<CommandSelector
						value={mapping.commandId}
						onChange={(commandId) => handleUpdate({ commandId })}
					/>
				</FieldRow>

				<FieldRow label="Target">
					<Select
						options={TARGET_OPTIONS}
						value={mapping.target}
						onChange={(e) =>
							handleUpdate({
								target: Number(e.target.value) as MappingTargetDeck,
							})
						}
					/>
				</FieldRow>

				<div className="rounded bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
					Type: {mapping.isInput ? "Input" : "Output"}
				</div>
			</Section>

			{/* Control Section */}
			<Section title="Control" icon={<Settings2 className="h-3 w-3" />}>
				<FieldRow label="Control Type">
					<Select
						options={CONTROL_TYPE_OPTIONS}
						value={mapping.controlType}
						onChange={(e) =>
							handleUpdate({
								controlType: Number(e.target.value) as MappingControlType,
							})
						}
					/>
				</FieldRow>

				<FieldRow label="Interaction Mode">
					<Select
						options={INTERACTION_MODE_OPTIONS}
						value={mapping.interactionMode}
						onChange={(e) =>
							handleUpdate({
								interactionMode: Number(
									e.target.value,
								) as MappingInteractionMode,
							})
						}
					/>
				</FieldRow>

				<div className="space-y-2 pt-1">
					<Checkbox
						label="Auto Repeat"
						checked={mapping.autoRepeat}
						onChange={(e) => handleUpdate({ autoRepeat: e.target.checked })}
					/>
					<Checkbox
						label="Invert"
						checked={mapping.invert}
						onChange={(e) => handleUpdate({ invert: e.target.checked })}
					/>
					<Checkbox
						label="Soft Takeover"
						checked={mapping.softTakeover}
						onChange={(e) => handleUpdate({ softTakeover: e.target.checked })}
					/>
				</div>
			</Section>

			{/* MIDI Binding Section */}
			<Section title="MIDI Binding" icon={<Music2 className="h-3 w-3" />}>
				<MidiBindingEditor
					binding={mapping.midiBinding}
					onChange={(binding: MidiBinding) => {
						// AIDEV-TODO: Implement MIDI binding update via Device
						console.log("MIDI binding change:", binding);
					}}
					onMidiLearn={() => onMidiLearn?.(mapping.id)}
				/>
			</Section>

			{/* Conditions Section */}
			<Section title="Conditions" icon={<Info className="h-3 w-3" />}>
				<ConditionSelector
					label="Condition 1"
					value={mapping.condition1?.id ?? 0}
					target={mapping.condition1?.target ?? MappingTargetDeck.DeviceTarget}
					onChange={(id, target) =>
						handleUpdate({ condition1: { id, target } })
					}
					onClear={() => handleUpdate({ condition1: null })}
				/>

				<ConditionSelector
					label="Condition 2"
					value={mapping.condition2?.id ?? 0}
					target={mapping.condition2?.target ?? MappingTargetDeck.DeviceTarget}
					onChange={(id, target) =>
						handleUpdate({ condition2: { id, target } })
					}
					onClear={() => handleUpdate({ condition2: null })}
				/>
			</Section>

			{/* Comment Section */}
			<Section title="Comment" icon={<StickyNote className="h-3 w-3" />}>
				<Textarea
					value={mapping.comment}
					onChange={(e) => handleUpdate({ comment: e.target.value })}
					placeholder="Add a comment..."
					className="min-h-[60px]"
				/>
			</Section>
		</div>
	);
}

export default MappingEditor;

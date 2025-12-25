/**
 * MidiBindingEditor Component
 *
 * AIDEV-NOTE: Editor for MIDI binding settings (channel, note/CC number, type).
 * Includes a MIDI Learn button that triggers the learn flow.
 */

import type { MidiBinding } from "@cmdr/core";
import { Music2 } from "lucide-react";

import { cn } from "../../../lib/utils";
import { Input, Select, type SelectOption } from "../../ui";

// ============================================================================
// Types
// ============================================================================

export interface MidiBindingEditorProps {
	/** Current MIDI binding (null if unbound) */
	binding: MidiBinding | null;
	/** Callback when binding changes */
	onChange: (binding: MidiBinding) => void;
	/** Callback to start MIDI learn */
	onMidiLearn: () => void;
	/** Whether the editor is disabled */
	disabled?: boolean;
	/** Additional class names */
	className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const CHANNEL_OPTIONS: SelectOption[] = Array.from({ length: 16 }, (_, i) => ({
	value: i,
	label: `Ch ${i + 1}`,
}));

const TYPE_OPTIONS: SelectOption[] = [
	{ value: "note", label: "Note" },
	{ value: "cc", label: "Control Change (CC)" },
];

// ============================================================================
// Component
// ============================================================================

export function MidiBindingEditor({
	binding,
	onChange,
	onMidiLearn,
	disabled = false,
	className,
}: MidiBindingEditorProps) {
	const handleChannelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		if (!binding) return;
		const channel = Number(e.target.value);
		onChange({
			...binding,
			channel,
			note: formatMidiNote(binding.isCC, channel, binding.noteNumber),
		});
	};

	const handleNoteNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!binding) return;
		const noteNumber = Math.min(127, Math.max(0, Number(e.target.value) || 0));
		onChange({
			...binding,
			noteNumber,
			note: formatMidiNote(binding.isCC, binding.channel, noteNumber),
		});
	};

	const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		if (!binding) return;
		const isCC = e.target.value === "cc";
		onChange({
			...binding,
			isCC,
			note: formatMidiNote(isCC, binding.channel, binding.noteNumber),
		});
	};

	return (
		<div className={cn("space-y-3", className)}>
			{binding ? (
				<>
					{/* Note/CC display */}
					<div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
						<Music2 className="h-4 w-4 text-muted-foreground" />
						<span className="font-mono text-sm font-medium">
							{binding.note}
						</span>
					</div>

					{/* Type selector */}
					<div className="space-y-1">
						<span className="text-xs text-muted-foreground">Type</span>
						<Select
							options={TYPE_OPTIONS}
							value={binding.isCC ? "cc" : "note"}
							onChange={handleTypeChange}
							disabled={disabled}
						/>
					</div>

					{/* Channel selector */}
					<div className="space-y-1">
						<span className="text-xs text-muted-foreground">Channel</span>
						<Select
							options={CHANNEL_OPTIONS}
							value={binding.channel}
							onChange={handleChannelChange}
							disabled={disabled}
						/>
					</div>

					{/* Note/CC number */}
					<div className="space-y-1">
						<span className="text-xs text-muted-foreground">
							{binding.isCC ? "CC Number" : "Note Number"}
						</span>
						<Input
							type="number"
							min={0}
							max={127}
							value={binding.noteNumber}
							onChange={handleNoteNumberChange}
							disabled={disabled}
						/>
					</div>
				</>
			) : (
				<div className="rounded-md bg-muted/30 p-3 text-center text-sm text-muted-foreground">
					No MIDI binding
				</div>
			)}

			{/* MIDI Learn button */}
			<button
				type="button"
				onClick={onMidiLearn}
				disabled={disabled}
				className={cn(
					"w-full rounded-md border border-primary bg-primary/10 px-3 py-2 text-sm font-medium text-primary",
					"hover:bg-primary/20",
					"disabled:cursor-not-allowed disabled:opacity-50",
				)}
			>
				MIDI Learn
			</button>
		</div>
	);
}

/**
 * Format MIDI note string from components
 */
function formatMidiNote(
	isCC: boolean,
	channel: number,
	noteNumber: number,
): string {
	const type = isCC ? "CC" : "Note";
	const channelStr = channel.toString().padStart(2, "0");
	const noteStr = noteNumber.toString().padStart(3, "0");
	return `${type}.${channelStr}.${noteStr}`;
}

export default MidiBindingEditor;

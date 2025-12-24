/**
 * DeviceEditor Component
 *
 * AIDEV-NOTE: Editor panel for device properties.
 * Allows editing device name (comment), MIDI ports, and viewing device type.
 * Device type is read-only as changing it would require migrating mappings.
 */

import type { Device } from "@cmdr/core";
import { getDeviceTypeName, isGenericMidiDevice } from "@cmdr/core";
import { Keyboard, Music, Settings } from "lucide-react";

import { cn } from "../../lib/utils";
import { Input, Label, Select, type SelectOption } from "../ui";

// ============================================================================
// Types
// ============================================================================

export interface DeviceEditorProps {
	/** Device to edit */
	device: Device;
	/** Callback when device properties change */
	onChange: (updates: DeviceUpdate) => void;
	/** Whether the editor is disabled */
	disabled?: boolean;
	/** Additional class names */
	className?: string;
}

export interface DeviceUpdate {
	comment?: string;
	inPort?: string;
	outPort?: string;
}

// ============================================================================
// Constants
// ============================================================================

// AIDEV-NOTE: MIDI port options - in a real implementation, these would come
// from the actual available MIDI ports on the system via MidiManager.
// For now, we use placeholder values plus the ability to type custom names.
const DEFAULT_PORT_OPTIONS: SelectOption[] = [
	{ value: "", label: "None" },
	{ value: "All Ports", label: "All Ports" },
];

// ============================================================================
// Component
// ============================================================================

export function DeviceEditor({
	device,
	onChange,
	disabled = false,
	className,
}: DeviceEditorProps) {
	const isKeyboard = device.isKeyboard;
	const isGenericMidi = isGenericMidiDevice(device.deviceType);
	const deviceTypeName = getDeviceTypeName(device.deviceType);

	const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange({ comment: e.target.value });
	};

	const handleInPortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		onChange({ inPort: e.target.value });
	};

	const handleOutPortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		onChange({ outPort: e.target.value });
	};

	return (
		<div className={cn("space-y-6 p-4", className)}>
			{/* Header with device type icon */}
			<div className="flex items-center gap-3">
				<div
					className={cn(
						"flex h-10 w-10 items-center justify-center rounded-lg",
						isKeyboard
							? "bg-purple-500/10 text-purple-500"
							: "bg-blue-500/10 text-blue-500",
					)}
				>
					{isKeyboard ? (
						<Keyboard className="h-5 w-5" />
					) : (
						<Music className="h-5 w-5" />
					)}
				</div>
				<div>
					<h3 className="font-medium">{device.comment || "Unnamed Device"}</h3>
					<p className="text-xs text-muted-foreground">{deviceTypeName}</p>
				</div>
			</div>

			{/* Device Name */}
			<div className="space-y-2">
				<Label htmlFor="device-name">Device Name</Label>
				<Input
					id="device-name"
					value={device.comment}
					onChange={handleCommentChange}
					placeholder="Enter device name..."
					disabled={disabled}
				/>
				<p className="text-xs text-muted-foreground">
					A descriptive name for this device configuration
				</p>
			</div>

			{/* Device Type (read-only) */}
			<div className="space-y-2">
				<Label>Device Type</Label>
				<div className="flex h-9 items-center rounded-md border border-input bg-muted/50 px-3 text-sm">
					{deviceTypeName}
					{isGenericMidi && (
						<span className="ml-2 text-xs text-muted-foreground">
							(Generic MIDI)
						</span>
					)}
				</div>
				<p className="text-xs text-muted-foreground">
					Device type cannot be changed after creation
				</p>
			</div>

			{/* MIDI Ports - only shown for MIDI devices */}
			{!isKeyboard && (
				<div className="border-t border-border pt-4">
					<div className="mb-3 flex items-center gap-2">
						<Settings className="h-4 w-4 text-muted-foreground" />
						<span className="text-sm font-medium">MIDI Ports</span>
					</div>

					{/* Input Port */}
					<div className="space-y-2">
						<Label htmlFor="in-port">Input Port</Label>
						<Select
							id="in-port"
							value={device.inPort}
							onChange={handleInPortChange}
							disabled={disabled}
							options={[
								...DEFAULT_PORT_OPTIONS,
								// Add current value if not in defaults
								...(device.inPort &&
								!DEFAULT_PORT_OPTIONS.some((o) => o.value === device.inPort)
									? [{ value: device.inPort, label: device.inPort }]
									: []),
							]}
						/>
						<p className="text-xs text-muted-foreground">
							MIDI input port for receiving messages
						</p>
					</div>

					{/* Output Port */}
					<div className="mt-4 space-y-2">
						<Label htmlFor="out-port">Output Port</Label>
						<Select
							id="out-port"
							value={device.outPort}
							onChange={handleOutPortChange}
							disabled={disabled}
							options={[
								...DEFAULT_PORT_OPTIONS,
								// Add current value if not in defaults
								...(device.outPort &&
								!DEFAULT_PORT_OPTIONS.some((o) => o.value === device.outPort)
									? [{ value: device.outPort, label: device.outPort }]
									: []),
							]}
						/>
						<p className="text-xs text-muted-foreground">
							MIDI output port for sending messages (LEDs, motorized faders)
						</p>
					</div>
				</div>
			)}

			{/* Device Info */}
			<div className="border-t border-border pt-4">
				<div className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Mappings</span>
						<span className="font-medium">{device.mappingCount}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Revision</span>
						<span className="font-mono">{device.revision}</span>
					</div>
					{device.traktorVersion && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Traktor Version</span>
							<span className="font-mono">{device.traktorVersion}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default DeviceEditor;

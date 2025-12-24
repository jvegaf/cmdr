# CMDR Electron

Cross-platform TSI file editor for NI Traktor Pro, built with Electron and React.

> **Status:** Phase 19 - Packaging and Distribution

## Project Structure

```
cmdr-electron/
├── packages/
│   ├── core/           # @cmdr/core - TSI file parser (TypeScript, no Electron deps)
│   ├── midi/           # @cmdr/midi - MIDI integration with WebMIDI API
│   └── desktop/        # @cmdr/desktop - Electron + React application
├── pnpm-workspace.yaml
└── package.json
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build all packages
pnpm build

# Run desktop app in development mode
pnpm --filter @cmdr/desktop dev
```

## Building Distributable Packages

```bash
# Build the app (required before packaging)
pnpm --filter @cmdr/desktop build

# Package for current platform
pnpm --filter @cmdr/desktop dist

# Package for specific platforms
pnpm --filter @cmdr/desktop dist:linux    # AppImage, .deb
pnpm --filter @cmdr/desktop dist:win      # .exe (NSIS), portable
pnpm --filter @cmdr/desktop dist:mac      # .dmg (requires macOS)

# Create unpacked build (for testing)
pnpm --filter @cmdr/desktop pack
```

### Build Outputs

Distributable packages are created in `packages/desktop/release/{version}/`:

| Platform | Format | File |
|----------|--------|------|
| Linux | AppImage | `CMDR TSI Editor-{version}-linux-x86_64.AppImage` |
| Linux | Debian | `cmdr-tsi-editor_{version}_amd64.deb` |
| Windows | Installer | `CMDR TSI Editor-{version}-win-x64.exe` |
| Windows | Portable | `CMDR TSI Editor-{version}-win-x64-portable.exe` |
| macOS | DMG | `CMDR TSI Editor-{version}-mac-{arch}.dmg` |

## Package Status

### @cmdr/core ✅

The core TSI parsing library. **419 tests passing.**

**Completed:**
- Binary I/O (Big Endian) - BinaryReader/BinaryWriter with full read/write support
- Frame system for TSI binary format (parse and serialize)
- All frame parsers AND serializers:
  - `DIOM` - DeviceMappingsContainer (root)
  - `DEVI` - Device
  - `DDAT` - DeviceData
  - `DDCB` - MappingsContainer
  - `CMAS` - Mappings list
  - `CMAI` - Mapping
  - `CMAD` - MappingSettings
  - `DCBM` - MidiNoteBinding
- XML parser with `parseTsiXml()` and `buildTsiXml()`
- High-level `TsiFile` model with `fromXml()` and `toXml()`
- Full round-trip support (parse → modify → serialize)
- **Commands System** with:
  - `KnownCommands` enum (~300 command IDs)
  - `COMMAND_METADATA` lookup table (~500 commands)
  - `Categories` enum (~40 hierarchical categories)
  - `TargetType`, `CommandInType`, `CommandOutType`, `FloatRangeType` enums
  - Helper functions: `getCommandDescription()`, `getCommandsByCategory()`, etc.
- **Conditions System** with:
  - `KnownConditions` enum (85 conditions: 21 core + 64 slot cell states)
  - `CONDITION_METADATA` lookup table
  - `ConditionCategory` enum (Modifier, Deck, FX, Remix, Slot)
  - 14 value types (OnOff, ModifierValue, SlotState, etc.)
  - Helper functions: `getConditionDescription()`, `getConditionsByCategory()`, etc.
- **FX Settings System** with:
  - `Effect` enum (~40 Traktor effects)
  - `FxSnapshot` interfaces (buttons + knobs)
  - `loadFxSettings()` / `saveFxSettings()` for XML
  - Helper functions for effect management
- **Controls System** with:
  - Control types: Button, Fader, Encoder, LED
  - Interaction modes per control type
  - Encoder modes (3Fh/41h, 7Fh/01h, etc.)
  - `CONTROL_REGISTRY` for allowed modes
- **High-Level Models** with:
  - `Device` class wrapping DeviceData
  - `Mapping` class with command/condition resolution
  - MIDI binding parsing and creation
  - Factory methods and deep copy support

### @cmdr/midi ✅

MIDI integration package. **80 tests passing.**

**Completed:**
- `MidiManager` - WebMIDI API wrapper with device enumeration
- `MidiMessage` - MIDI message parsing (Note, CC, Pitch Bend, etc.)
- `binding-utils` - Convert MIDI messages to Traktor binding format
- MIDI Learn support
- Full test coverage with WebMIDI mocking

### @cmdr/desktop ✅

Electron + React application. **Builds and packages successfully.**

**Completed:**
- electron-vite configuration
- React 18 with TypeScript
- Tailwind CSS with dark mode support
- **Theme System:**
  - `ThemeProvider` with React Context
  - localStorage persistence
  - System preference detection
  - `ThemeToggle` component
- **Zustand Stores:**
  - `useTsiStore` - TSI file state with multi-select support
  - `useMidiStore` - MIDI device state and MIDI Learn
  - `useHistoryStore` - Undo/Redo history management
  - `useAppStore` - App settings and recent files
- **IPC Client:**
  - Type-safe Electron IPC wrapper
  - Base64 encoding for binary file transfer
- **UI Components:**
  - `Button` with CVA variants
  - 3-panel layout (devices, mappings, properties)
  - Toolbar and status bar
- **Data Components:**
  - `DeviceList` - Collapsible list with context menu
  - `DeviceEditor` - Device property editing
  - `MappingList` - Virtualized table with sorting
  - `MappingEditor` - Properties panel for selected mappings
- **Property Editing:**
  - `CommandSelector` - Hierarchical command picker
  - `ConditionSelector` - Condition picker with value editors
  - `MidiBindingEditor` - MIDI Learn integration
- **File Operations:**
  - `FileTabs` - Multiple file tabs with dirty indicators
  - New/Open/Save/Save As file operations
  - Recent files list
  - Unsaved changes confirmation dialog
  - App close confirmation with dirty files
- **Advanced Editing:**
  - Copy/Cut/Paste/Duplicate/Delete mappings
  - Internal clipboard
  - Move mappings between devices
  - Edit toolbar with icons
- **Undo/Redo System:**
  - Per-file history stacks (max 50 actions)
  - Undoable operations: edit, delete, paste, duplicate, cut
  - Ctrl+Z / Ctrl+Y keyboard shortcuts
  - Undo/Redo toolbar buttons with action descriptions
- **Keyboard Shortcuts:**
  - Ctrl+N/O/S: File operations
  - Ctrl+C/X/V/D: Clipboard operations
  - Ctrl+Z/Y: Undo/Redo
  - Ctrl+F: Focus search
  - Ctrl+A: Select all
  - Delete/Backspace: Delete selected
  - Escape: Clear selection
- **Search and Filters:**
  - `SearchInput` - Debounced search with Ctrl+F shortcut
  - `FilterPanel` - Control type, conditions, MIDI filters
  - Filter mappings by command name, comment, MIDI binding, conditions
  - Combined AND logic for filters
- **Reports and Export:**
  - `ExportDialog` - CSV export with configurable columns
  - `CommandsReport` - Commands overview with grouping and counts
  - `ConditionsSummary` - Unique condition combinations summary
  - Export to CSV from reports
  - Sortable tables with search filters
- **Dialogs and Settings:**
  - `AboutDialog` - Version, credits, links
  - `SettingsDialog` - General, Editor, MIDI settings
  - `KeyboardShortcutsDialog` - Shortcuts reference
  - Settings persistence in localStorage
- **Application Menu:**
  - Native Electron menu (File, Edit, View, Help)
  - macOS-specific app menu
  - Theme submenu
  - Menu action IPC integration
- **Packaging:**
  - electron-builder configuration
  - Linux: AppImage, .deb
  - Windows: NSIS installer, portable
  - macOS: DMG (untested)
  - Application icons

## Development

### Running Tests

```bash
# All packages
pnpm test

# Specific package
pnpm --filter @cmdr/core test:run
pnpm --filter @cmdr/midi test:run

# Watch mode
pnpm --filter @cmdr/core test
```

### Type Checking

```bash
# All packages
pnpm typecheck

# Desktop package (separate configs for main/preload/renderer)
pnpm --filter @cmdr/desktop typecheck:web
pnpm --filter @cmdr/desktop typecheck:node
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @cmdr/core build
pnpm --filter @cmdr/desktop build
```

### Test Fixtures

The `packages/core/__tests__/fixtures/` directory contains 23 real TSI files for testing:

| Category | Files | Description |
|----------|-------|-------------|
| Unit Tests | 10 | Encoder modes, FX lists, semitones, timecode modes |
| Traktor Ready | 12 | S2/S4/S8 MK1-3, CDJ-2000NX2, XDJ-1000, DDJ-T1, Numark 4Trak |
| Keyboard | 1 | Keyboard timecode mode mappings |

See `packages/core/__tests__/fixtures/README.md` for detailed documentation.

## Architecture

### TSI File Format

TSI files are XML documents containing Base64-encoded binary data:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<NIXML>
  <TraktorSettings>
    <Entry Name="DeviceIO.Config.Controller" Type="Text" Value="[BASE64]"/>
    <Entry Name="DeviceIO.Config.Keyboard" Type="Text" Value="[BASE64]"/>
  </TraktorSettings>
</NIXML>
```

### Binary Frame Structure

The binary data uses a frame-based format with FourCC identifiers:

```
DIOM (Root Container)
├── DIOI (Info)
└── DDVS (Devices List)
    └── DEVI (Device)
        ├── DDAT (Device Data)
        │   ├── DVHS (Device Settings)
        │   ├── DVST (Device State XML)
        │   └── DCMI/DCMO (MIDI Definitions)
        └── DDCB (Mappings Container)
            ├── CMAS (Mappings List)
            │   └── CMAI (Mapping)
            │       └── CMAD (Mapping Settings)
            └── DCBM (MIDI Note Bindings)
```

### High-Level Models

```typescript
import { TsiFile, Device, Mapping } from '@cmdr/core';

// Load TSI file
const tsi = TsiFile.fromXml(xmlContent);

// Work with high-level models
for (const deviceData of tsi.devices) {
  const device = Device.fromRawData(deviceData);
  
  console.log(`Device: ${device.typeStr}`);
  console.log(`Mappings: ${device.mappingCount}`);
  
  for (const mapping of device.mappings) {
    console.log(`  ${mapping.commandName}: ${mapping.midiBinding?.note ?? 'No binding'}`);
  }
}

// Serialize back to XML
const newXml = tsi.toXml();
```

### Commands System

```typescript
import {
  KnownCommands,
  getCommandDescription,
  getCommandsByCategory,
  Categories,
} from '@cmdr/core';

// Get a specific command's metadata
const loopIn = getCommandDescription(KnownCommands.DeckCommon_Loop_LoopInSetCue);
// Returns: { id: 2392, name: "Loop In/Set Cue", category: Categories.DeckCommon_Loop, ... }

// Get all commands in a category
const mixerCommands = getCommandsByCategory(Categories.Mixer);
```

### MIDI Integration

```typescript
import { MidiManager, MidiMessage, midiMessageToBinding } from '@cmdr/midi';

const manager = MidiManager.getInstance();

// Enable MIDI
await manager.enable();

// List devices
const inputs = manager.getInputs();
const outputs = manager.getOutputs();

// MIDI Learn
const message = await manager.startMidiLearn({ timeout: 5000 });
const binding = midiMessageToBinding(message);
// Returns: { note: "CC.01.64", channel: 1, noteNumber: 64, isCC: true }
```

## Migration Progress

This is a migration from the original .NET/WPF CMDR editor to Electron/React.

See [MIGRATION_TASKS.md](../docs/development/MIGRATION_TASKS.md) for detailed progress.

| Phase | Status | Description |
|-------|--------|-------------|
| 1. Infrastructure | ✅ Complete | Monorepo setup, all packages scaffolded |
| 2. TSI Binary Parser | ✅ Complete | All frame parsers + serializers |
| 3. XML Layer | ✅ Complete | Full parse/build with round-trip support |
| 4. Commands | ✅ Complete | Command metadata system (~500 commands) |
| 5. Conditions | ✅ Complete | Condition metadata system (85 conditions) |
| 6. FX Settings | ✅ Complete | Effect management (~40 effects) |
| 7. Controls | ✅ Complete | Control types, interaction modes, encoder modes |
| 8. High-Level Models | ✅ Complete | Device, Mapping classes with full API |
| 9. MIDI Integration | ✅ Complete | MidiManager, MidiMessage, binding utilities |
| 10. UI Infrastructure | ✅ Complete | Theme, stores, IPC client, layout |
| 11. Data Components | ✅ Complete | DeviceList, MappingList, MappingEditor |
| 12. Property Editors | ✅ Complete | CommandSelector, ConditionSelector, MidiBindingEditor |
| 13. File Operations | ✅ Complete | Tabs, New/Save/Close, Recent Files |
| 14. Advanced Editing | ✅ Complete | Copy/Paste/Duplicate/Delete, Keyboard Shortcuts |
| 14.5 Undo/Redo | ✅ Complete | Per-file history, undoable operations |
| 15. Search & Filters | ✅ Complete | Search input, filter panel, combined logic |
| 16. Reports & Export | ✅ Complete | CSV export, commands report, conditions summary |
| 17. Dialogs & Settings | ✅ Complete | About, Settings, Keyboard Shortcuts dialogs |
| 18. Application Menu | ✅ Complete | Native Electron menu with IPC integration |
| 19. Packaging | ✅ Complete | electron-builder config, Linux/Windows/macOS |
| 20. Testing & QA | ⏳ Pending | Coverage, manual testing, performance |
| 21. Documentation | ⏳ Pending | User guide, API docs, changelog |

### Test Summary

```
@cmdr/core:   339 tests passing
@cmdr/midi:    80 tests passing
───────────────────────────────
Total:        419 tests passing
```

## License

See [LICENSE](../LICENSE) in the root directory.

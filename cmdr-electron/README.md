# CMDR Electron

Cross-platform TSI file editor for NI Traktor Pro, built with Electron and React.

> **Status:** Phase 6 Complete - FX Settings system with full effect management

## Project Structure

```
cmdr-electron/
├── packages/
│   ├── core/           # @cmdr/core - TSI file parser (TypeScript, no Electron deps)
│   ├── midi/           # @cmdr/midi - MIDI integration with WebMidi.js
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

# Run core package tests only
pnpm --filter @cmdr/core test:run
```

## Package Status

### @cmdr/core ✅

The core TSI parsing library. **209 tests passing.**

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
- 209 total tests (40 binary, 45 commands, 38 conditions, 31 FX, 55 integration/roundtrip)

**Pending:**
- Controls system (Phase 7)
- High-level models (Phase 8)
- MIDI integration (Phase 9+)

### @cmdr/midi 🚧

MIDI integration package. Scaffolded with WebMidi.js.

### @cmdr/desktop 🚧

Electron + React application. Scaffolded with:
- electron-vite
- React 18
- Tailwind CSS
- Zustand for state management

## Development

### Running Tests

```bash
# All packages
pnpm test

# Core package only
pnpm --filter @cmdr/core test:run

# Watch mode
pnpm --filter @cmdr/core test
```

### Test Fixtures

The `packages/core/__tests__/fixtures/` directory contains real TSI files for testing:

| Fixture | Description |
|---------|-------------|
| `encoder mode demo.tsi` | Encoder mode examples |
| `fx_list_from_TK.tsi` | FX list configuration |
| `kontrol s4 mk2*.tsi` | Kontrol S4 MK2 mappings |
| `s4mk3 override*.tsi` | S4 MK3 factory overrides |
| `semitone *.tsi` | Semitone value tests |
| ... | And more |

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

### Commands System

The command metadata system provides lookup for all Traktor commands:

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

// Check if a command ID is known
if (isKnownCommand(commandId)) {
  const desc = getCommandDescription(commandId);
}
```

### Round-Trip Support

The parser supports full round-trip operations:

```typescript
import { TsiFile } from '@cmdr/core';

// Load TSI file
const tsi = TsiFile.fromXml(xmlContent);

// Access and modify data
console.log(`Devices: ${tsi.devices.length}`);
console.log(`Mappings: ${tsi.mappingCount}`);

// Serialize back to XML
const newXml = tsi.toXml();
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
| 7-21. Controls, UI & More | ⏳ Pending | Controls, React UI, MIDI, packaging |

## License

See [LICENSE](../LICENSE) in the root directory.

# CMDR Electron

Cross-platform TSI file editor for NI Traktor Pro, built with Electron and React.

> **Status:** Phase 2 Complete - TSI Binary Parser fully implemented

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

The core TSI parsing library. **71 tests passing.**

**Completed:**
- Binary I/O (Big Endian) - BinaryReader/BinaryWriter
- Frame system for TSI binary format
- All frame parsers: DIOM, DEVI, DDAT, DDCB, CMAS, CMAI, CMAD, DCBM
- XML parser for TSI envelope
- High-level TsiFile model
- Integration tests with 10 real TSI fixtures

**Pending:**
- Serialization (write methods) for round-trip support
- Full command/condition system
- MidiDefinition parsing

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

## Migration Progress

This is a migration from the original .NET/WPF CMDR editor to Electron/React.

See [MIGRATION_TASKS.md](../docs/development/MIGRATION_TASKS.md) for detailed progress.

| Phase | Status | Description |
|-------|--------|-------------|
| 1. Infrastructure | ✅ Complete | Monorepo setup, all packages scaffolded |
| 2. TSI Binary Parser | ✅ Complete | All frame parsers implemented, 71 tests |
| 3. XML Layer | 🚧 Partial | Basic parsing done, needs full model |
| 4. Commands | ⏳ Pending | Command system |
| 5. Conditions | ⏳ Pending | Condition system |
| 6-21. UI & More | ⏳ Pending | React UI, MIDI, packaging |

## License

See [LICENSE](../LICENSE) in the root directory.

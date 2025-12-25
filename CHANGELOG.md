# Changelog

All notable changes to CMDR TSI Editor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-12-24

### Added

**Complete rewrite from .NET/WPF to Electron/React**

This is the first release of the cross-platform CMDR TSI Editor, rebuilt from scratch using modern web technologies.

#### Core Features

- **Full TSI file support**: Parse and serialize TSI files with byte-perfect round-trip fidelity
- **23 fixture files tested**: All NI controller mappings (S2/S4/S8 MK1-3, Kontrol D2, S3), Pioneer (DDJ-T1, XDJ-1000, CDJ-2000NX2), and more
- **~500 command definitions**: Complete command metadata with categories, target types, and value ranges
- **85 condition definitions**: Core conditions plus 64 Remix Deck slot cell states
- **~40 Traktor effects**: Full FX settings management

#### Editor Features

- **Multi-file editing**: Open multiple TSI files in tabs
- **Device management**: View and edit controller devices and keyboard mappings
- **Mapping editor**: Edit commands, conditions, MIDI bindings, and comments
- **Command picker**: Hierarchical command selector with search
- **Condition editor**: Full condition editing with value type support
- **MIDI Learn**: Learn MIDI bindings from connected controllers

#### Advanced Features

- **Undo/Redo**: Per-file history with up to 50 actions
- **Copy/Cut/Paste**: Clipboard operations for mappings
- **Duplicate**: Quick duplicate of selected mappings
- **Multi-select**: Select multiple mappings with Ctrl+click and Shift+click
- **Search & Filter**: Find mappings by command, comment, MIDI, or conditions
- **Reports**: Commands overview and conditions summary with CSV export

#### UI/UX

- **Dark mode**: System-aware theme with manual toggle
- **Keyboard shortcuts**: Full keyboard navigation (Ctrl+N/O/S, Ctrl+C/X/V/D, Ctrl+Z/Y)
- **Native menus**: Platform-appropriate application menus
- **Settings**: Configurable options with persistence

#### Technical

- **421 tests**: Comprehensive test coverage (95.68% core, 92.12% MIDI)
- **Performance**: Parses 792KB TSI files in ~52ms
- **Cross-platform**: Linux (AppImage, .deb), Windows (NSIS, portable), macOS (DMG)

### Changed

- Architecture: Migrated from .NET/WPF to TypeScript/React/Electron
- Build system: Now uses pnpm workspaces with Vite
- Binary format: TypeScript implementation with Big Endian I/O

### Fixed

- DVST parsing: Corrected boolean field reading (Int32 instead of single byte)
- Pitch bend: Fixed MIDI pitch bend calculation (operator precedence)
- All 23 TSI fixtures now parse and round-trip correctly

### Notes

This release is functionally equivalent to the original CMDR WPF application, with improvements in cross-platform support, performance, and maintainability.

**Deferred features** (planned for future releases):

- Drag & drop reordering of mappings
- Auto-updater
- MIDI port definitions editing (DCMI/DCMO frames)
- Tab drag reordering

---

## Comparison with Original CMDR (WPF)

| Feature       | WPF Version  | Electron Version           |
| ------------- | ------------ | -------------------------- |
| Platform      | Windows only | Windows, Linux, macOS      |
| TSI Parsing   | C#           | TypeScript                 |
| Test Coverage | Unknown      | 95.68% (core)              |
| Commands      | ~300         | ~500                       |
| Conditions    | ~21          | 85 (21 core + 64 slots)    |
| FX Effects    | ~40          | ~40                        |
| Undo/Redo     | Yes          | Yes (per-file, 50 actions) |
| MIDI Learn    | Yes          | Yes (WebMIDI)              |
| Multi-file    | Yes          | Yes (tabbed)               |
| Dark Mode     | No           | Yes                        |
| Search/Filter | Basic        | Advanced (multi-field)     |
| Reports       | No           | Yes (Commands, Conditions) |
| CSV Export    | No           | Yes                        |

[0.1.0]: https://github.com/user/cmdr-electron/releases/tag/v0.1.0

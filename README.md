# CMDR - TSI Editor for NI Traktor Pro

**CMDR** is a powerful TSI mappings editor for Native Instruments Traktor Pro, available in two versions:

1. **🎯 CMDR Classic** - Production-ready Windows application (.NET/WPF)
2. **🚀 CMDR Electron** - Cross-platform version (Windows, Linux, macOS) - **Ready for Release!**

## 🆕 CMDR Electron (Cross-Platform)

> **Status:** Phase 20 Complete - Ready for Release (421 tests passing, >90% coverage)

The new **Electron + React** version brings CMDR to all platforms with native support:

- ✅ **Windows** 
- ✅ **Linux** (AppImage, .deb, AUR)
- ✅ **macOS** (native, no Wine/Parallels needed)

### Quick Start (Electron Version)

```bash
# Install dependencies
pnpm install

# Run desktop app in development
pnpm --filter @cmdr/desktop dev

# Build distributable packages
pnpm --filter @cmdr/desktop build
pnpm --filter @cmdr/desktop dist
```

Or use the Makefile:
```bash
make install      # Install dependencies
make dev          # Start development server
make test         # Run all tests (421 tests)
make build        # Build all packages
make dist-linux   # Build Linux AppImage
make dist-win     # Build Windows installer
```

### Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Desktop:** Electron with electron-vite
- **State:** Zustand
- **MIDI:** WebMIDI API
- **Testing:** Vitest (421 tests passing, 95.68% coverage on core)

### Migration Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1-8 | Core Infrastructure & TSI Parser | ✅ Complete |
| 9 | MIDI Integration | ✅ Complete |
| 10-13 | UI Components & File Operations | ✅ Complete |
| 14-14.5 | Advanced Editing & Undo/Redo | ✅ Complete |
| 15-18 | Search, Reports, Dialogs, Menus | ✅ Complete |
| 19-20 | Packaging & QA | ✅ Complete |
| 21 | Documentation | ⏳ Pending |

**Details:** [Migration Plan](docs/development/MIGRATION_PLAN.md) | [Task List](docs/development/MIGRATION_TASKS.md) | [Electron README](cmdr-electron/README.md)

## 📥 CMDR Classic (Windows)

The original Windows application is production-ready and actively maintained.

**Latest download:** [cmdr_tsi_editor_latest.zip](https://github.com/cmdr-editor/cmdr/releases/latest/download/cmdr_tsi_editor_latest.zip)

[<img src="docs/pics/icon/download.png?raw=true" width="400">](https://github.com/cmdr-editor/cmdr/releases/latest/download/cmdr_tsi_editor_latest.zip)

### Description

CMDR is a TSI mappings editor for NI Traktor Pro that provides essential features missing in Traktor's Controller Manager:
* Copy-Paste
* Mass-Edit
* Mass-Automation
* Reports & CSV Export
* MIDI Learn
* Keyboard Shortcuts
* plus much more ([Full Changelog](docs/development/Change_Log.md))

Supports Traktor Pro 3.3+ and specific controllers like S4MK3.

### Installation (Classic Version)

There is no installer yet. After download just unzip the file and start cmdr.exe.\
If the EXE file is missing, please see [FAQ #1](docs/faq.md)

**Requirements:**
* Microsoft Windows
* [.NET Framework V4.5](https://www.microsoft.com/en-US/download/details.aspx?id=30653)
* Also runs in macOS with [these methods](docs/running_on_macos.md)

### Building Distributable Packages (Electron)

```bash
# Build the app (required before packaging)
pnpm --filter @cmdr/desktop build

# Package for specific platforms
pnpm --filter @cmdr/desktop dist:linux    # AppImage, .deb
pnpm --filter @cmdr/desktop dist:win      # .exe (NSIS), portable
pnpm --filter @cmdr/desktop dist:mac      # .dmg (requires macOS)
```

**Build Outputs** (in `packages/desktop/release/{version}/`):

| Platform | Format     | File                                                 |
| -------- | ---------- | ---------------------------------------------------- |
| Linux    | AppImage   | `CMDR TSI Editor-{version}-linux-x86_64.AppImage`    |
| Linux    | Debian     | `cmdr-tsi-editor_{version}_amd64.deb`                |
| Linux    | Arch (AUR) | `cmdr-tsi-editor-bin-{version}-1-x86_64.pkg.tar.zst` |
| Windows  | Installer  | `CMDR TSI Editor-{version}-win-x64.exe`              |
| Windows  | Portable   | `CMDR TSI Editor-{version}-win-x64-portable.exe`     |
| macOS    | DMG        | `CMDR TSI Editor-{version}-mac-{arch}.dmg`           |

**Arch Linux (AUR):**
```bash
make aur          # Build the AUR package
make aur-install  # Build and install
```

## 📚 Documentation & Usage

### User Guides
* [User Guide](docs/user_guide.md)
* [Midi Mapping](docs/midi_mapping.md) 
* [Using Effects](docs/Effects.md)
* [FAQ](docs/faq.md)
* [macOS usage](docs/running_on_macos.md)

### Development
* [Full Change Log](docs/development/Change_Log.md)
* [Development Info](docs/development/Development_Info.md)
* [Migration Plan](docs/development/MIGRATION_PLAN.md)
* [Migration Tasks](docs/development/MIGRATION_TASKS.md)

### Community
* [NI forum thread](https://www.native-instruments.com/forum/threads/release-cmdr-controller-manager-done-right-new-2020-link.409243)
* [Issues list](https://github.com/cmdr-editor/cmdr/issues)

## 🏗️ Project Structure (Electron Version)

```
cmdr-electron/
├── packages/
│   ├── core/           # @cmdr/core - TSI parser (341 tests, 95.68% coverage)
│   ├── midi/           # @cmdr/midi - MIDI integration (80 tests, 92.12% coverage)
│   └── desktop/        # @cmdr/desktop - Electron + React app
├── pnpm-workspace.yaml
└── package.json
```

### Features Implemented (Electron)

**Core (`@cmdr/core`):**
- ✅ Binary TSI parser/serializer (all frame types)
- ✅ XML parser with full round-trip support
- ✅ Commands System (~500 commands, 40 categories)
- ✅ Conditions System (85 conditions)
- ✅ FX Settings System (~40 effects)
- ✅ Controls System (Button, Fader, Encoder, LED)
- ✅ High-Level Models (Device, Mapping classes)

**MIDI (`@cmdr/midi`):**
- ✅ MidiManager (WebMIDI API wrapper)
- ✅ MIDI message parsing (Note, CC, Pitch Bend)
- ✅ MIDI Learn support
- ✅ Binding utilities

**Desktop (`@cmdr/desktop`):**
- ✅ Theme system (dark/light mode)
- ✅ 3-panel layout (devices, mappings, properties)
- ✅ File operations (New/Open/Save/Close)
- ✅ Multi-tab support with dirty indicators
- ✅ Copy/Cut/Paste/Duplicate/Delete
- ✅ Undo/Redo system (per-file history)
- ✅ Keyboard shortcuts (Ctrl+Z/Y/C/X/V/D/F/A/N/O/S)
- ✅ Search & Filters (command, MIDI, conditions)
- ✅ Reports & CSV Export
- ✅ Settings & Dialogs
- ✅ Native application menu
- ✅ Packaging (Linux/Windows/macOS)

## 📸 Screenshots

### CMDR Classic
![cmdr_summary](docs/pics/cmdr_summary.png?raw=true)

### 2020 Improvements
![cmdr_improvements1](docs/pics/cmdr_improvements1.png?raw=true "")
![cmdr_improvements2](docs/pics/cmdr_improvements2.png?raw=true "")
![cmdr_reports](docs/pics/cmdr_reports.png?raw=true "")
![cmdr_csv_export](docs/pics/cmdr_csv_export.png?raw=true "")
![cmdr_keyboard_shortcuts](docs/pics/cmdr_keyboard_shortcuts.png?raw=true "")
![cmdr_settings](docs/pics/cmdr_settings.png?raw=true "")

## ⚠️ Disclaimer

This software is under active development, comes with ABSOLUTELY NO WARRANTY and may contain bugs. 
If you find a bug please [create an issue](https://github.com/cmdr-editor/cmdr/issues).

CMDR is NOT RELATED TO Native Instruments, but an unofficial software.
Until the software has reached a stable state, it is recommended to work on copies of your TSI files.

## 📄 Licence

* CMDR was developed and released in 2018 by Michael Rahier under the GPL v3 licence.
* As of Jan 2020 this is being maintained and improved by Pedro Estrela, same license.
* Electron version (2024-2025) developed under the same GPL v3 license.
* Used libraries:
  * [Xceed AvalonDock](http://avalondock.codeplex.com), Copyright (c) 2007-2013, Xceed Software Inc. 
  * [Pure Midi](https://puremidi.codeplex.com), Copyright (c) 2004 Slawomir Cichon
  * [Newtonsoft Json](http://www.newtonsoft.com/json), Copyright (c) 2007 James Newton-King
  * React, Electron, Tailwind CSS, and other open-source libraries (see package.json files)

## 🙏 Credits

* Michael Rahier for creating this Program
* Pedro Estrela for maintaining it since 2020
* Ivan Zlatev, for [reverse engineering large parts of the TSI structure](https://github.com/ivanz/Traktor.Mapping)
* [Native Instruments](http://www.native-instruments.com/) for providing the powerful DJ software Traktor Pro
* [Acid Buddha](http://www.acidbuddha.com/) for testing and support

## 💰 Donation

If you like this piece of software, please make a donation to the original author: 
[![Donate button](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=9BNNTDQF4X782 "Donate")

---

## 📖 Additional Documentation (Electron Version)

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

### High-Level API Example

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

### MIDI Integration Example

```typescript
import { MidiManager, midiMessageToBinding } from '@cmdr/midi';

const manager = MidiManager.getInstance();
await manager.enable();

// List devices
const inputs = manager.getInputs();
const outputs = manager.getOutputs();

// MIDI Learn
const message = await manager.startMidiLearn({ timeout: 5000 });
const binding = midiMessageToBinding(message);
// Returns: { note: "CC.01.64", channel: 1, noteNumber: 64, isCC: true }
```

### Test Summary

```
@cmdr/core:   341 tests passing (95.68% coverage)
@cmdr/midi:    80 tests passing (92.12% coverage)
───────────────────────────────────────────────────
Total:        421 tests passing
```

For complete details on the Electron version, see [cmdr-electron/README.md](cmdr-electron/README.md).

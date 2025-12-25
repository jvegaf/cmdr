# Test Fixtures

This directory contains TSI (Traktor Settings Import) files used for testing the CMDR parser and serializer.

## Fixture Categories

### Unit Tests (from `tests/unit_tests/`)

These are small, focused TSI files created to test specific features:

| File | Description |
|------|-------------|
| `add_remove_prep_list.tsi` | Tests Add/Remove from Preparation List commands |
| `encoder mode demo.tsi` | Demonstrates different encoder modes (Inc, Dec, Relative) |
| `favorites_enum__1st_none___2nd_1____3rd_12.tsi` | Tests Favorites Browser selector with different enum values |
| `fx_list_from_TK.tsi` | FX selection list exported from Traktor |
| `load loop and play.tsi` | Tests Load, Loop, and Play deck commands |
| `semitone next.tsi` | Tests Semitone Next pitch command |
| `semitone none.tsi` | Tests Semitone with no value set |
| `semitone previous.tsi` | Tests Semitone Previous pitch command |
| `timecode_mode__1st_abs__2nd_rel___3rd___4th_hap.tsi` | Tests Timecode Mode condition with Absolute, Relative, and Haptic modes |
| `TP3.0 new commands.tsi` | Tests new commands introduced in Traktor Pro 3.0 |

### Keyboard Mappings (from `tests/keyboard/`)

TSI files with keyboard-specific mappings:

| File | Description |
|------|-------------|
| `keyboard__timecode_mode__1st_abs__2nd_rel___3rd___4th_hap.tsi` | Keyboard mappings with timecode mode conditions |

### Traktor-Ready Mappings (from `tests/traktor-ready/`)

Real-world TSI files exported from Traktor for various controllers:

| File | Controller | Notes |
|------|------------|-------|
| `cdj2000nx2.tsi` | Pioneer CDJ-2000NX2 | Professional DJ player |
| `kontrol d2.tsi` | Native Instruments Kontrol D2 | Deck controller with screens |
| `kontrol s2 mk1.tsi` | Native Instruments Kontrol S2 MK1 | 2-deck controller |
| `kontrol s3.tsi` | Native Instruments Kontrol S3 | 4-channel mixer + 2 decks |
| `numark 4trak main.tsi` | Numark 4TRAK | 4-deck DJ controller |
| `PIONEER_DDJ-T1_V103.tsi` | Pioneer DDJ-T1 | 4-deck DJ controller |
| `s2mk3 override factory map - always default.tsi` | NI Kontrol S2 MK3 | Override factory mapping |
| `s4mk2 override factory map - default.tsi` | NI Kontrol S4 MK2 | Override factory mapping (default) |
| `s4mk2 override factory map - user.tsi` | NI Kontrol S4 MK2 | Override factory mapping (user) |
| `s4mk3 override factory map - always default.tsi` | NI Kontrol S4 MK3 | Override factory mapping |
| `s8 override factory map - always default.tsi` | NI Kontrol S8 | Override factory mapping |
| `xdj1000.tsi` | Pioneer XDJ-1000 | Professional media player |

## Usage in Tests

### Loading a Fixture

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';
import { TsiFile } from '@cmdr/core';

const fixturePath = join(__dirname, 'fixtures', 'encoder mode demo.tsi');
const xml = readFileSync(fixturePath, 'utf-8');
const tsiFile = TsiFile.fromXml(xml);
```

### Round-Trip Testing

All fixtures should pass round-trip testing:

```typescript
const original = TsiFile.fromXml(xml);
const serialized = original.toXml();
const reloaded = TsiFile.fromXml(serialized);

// Compare device and mapping counts
expect(reloaded.devices.length).toBe(original.devices.length);
```

## Adding New Fixtures

1. Export the TSI file from Traktor Pro
2. Copy to this directory
3. Add an entry to this README
4. Create corresponding test cases if needed

## Notes

- All fixtures are real TSI files that should parse without errors
- Some fixtures may be from different Traktor versions
- Override factory maps use Generic MIDI device type
- Keyboard fixtures use the Keyboard device type

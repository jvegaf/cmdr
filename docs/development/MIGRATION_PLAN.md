# Plan de Migración: CMDR WPF → Electron/React

## Resumen Ejecutivo

Migración completa del editor de archivos TSI para Traktor Pro desde .NET/WPF a una solución cross-platform basada en Electron/React. El objetivo es mantener 100% de las funcionalidades existentes mientras se moderniza la UI y se habilita soporte para Windows y Linux.

---

## Stack Tecnológico

| Categoría | Tecnología | Versión | Justificación |
|-----------|------------|---------|---------------|
| **Runtime** | Electron | Latest | Framework cross-platform para desktop |
| **Build Tool** | electron-vite | Latest | Integración nativa Vite + Electron, HMR |
| **Framework UI** | React | 18.x | Componentes declarativos, ecosistema maduro |
| **Lenguaje** | TypeScript | 5.x | Type safety, mejor DX |
| **Componentes** | shadcn/ui | Latest | Moderno, accesible, themeable (Dark/Light) |
| **Estilos** | Tailwind CSS | 3.x | Utility-first, integración con shadcn |
| **Estado** | Zustand | 4.x | Ligero, TypeScript-first, sin boilerplate |
| **Testing** | Vitest | Latest | Compatible con Vite, rápido, ESM nativo |
| **Testing UI** | @testing-library/react | Latest | Testing centrado en usuario |
| **MIDI** | WebMidi.js | 3.x | Soporte Electron documentado |
| **Monorepo** | pnpm workspaces | 8.x | Rápido, eficiente en disco |
| **Packaging** | electron-builder | Latest | Build para Windows/Linux |

---

## Arquitectura del Proyecto

### Estructura de Paquetes

```
cmdr-electron/
├── packages/
│   ├── core/         # @cmdr/core - Parser TSI (TypeScript puro, sin deps de Electron)
│   ├── midi/         # @cmdr/midi - Integración MIDI con WebMidi.js
│   └── desktop/      # @cmdr/desktop - App Electron + React
├── tests/            # Archivos TSI de prueba (heredados del proyecto original)
├── package.json      # Monorepo root
└── pnpm-workspace.yaml
```

### @cmdr/core - Estructura Detallada

```
packages/core/
├── src/
│   ├── binary/                # Lectura/escritura binaria Big Endian
│   │   ├── reader.ts          # Equivalente a StreamExtensions.cs
│   │   ├── writer.ts          # Equivalente a Writer.cs
│   │   └── frame.ts           # Clase base Frame
│   │
│   ├── format/                # Estructuras del formato TSI binario
│   │   ├── device-mappings-container.ts
│   │   ├── devices-list.ts
│   │   ├── device-data.ts
│   │   ├── device.ts
│   │   ├── mapping.ts
│   │   ├── mapping-settings.ts
│   │   ├── mappings-list.ts
│   │   ├── midi-definition.ts
│   │   ├── midi-definitions.ts
│   │   ├── midi-note-binding.ts
│   │   └── index.ts
│   │
│   ├── xml/                   # Parser XML (capa externa TSI)
│   │   ├── tsi-xml-document.ts
│   │   └── entries/
│   │       ├── base.ts
│   │       ├── device-io-config.ts
│   │       ├── fx-entries.ts
│   │       └── index.ts
│   │
│   ├── commands/              # Sistema de comandos Traktor
│   │   ├── base/
│   │   │   ├── command.ts
│   │   │   └── command-types.ts
│   │   ├── known-commands.ts
│   │   ├── command-factory.ts
│   │   ├── implementations/   # Comandos específicos
│   │   └── index.ts
│   │
│   ├── conditions/            # Sistema de condiciones
│   │   ├── base/
│   │   │   └── condition.ts
│   │   ├── known-conditions.ts
│   │   ├── condition-factory.ts
│   │   └── index.ts
│   │
│   ├── controls/              # Tipos de control (Button, Fader, etc.)
│   │   ├── base/
│   │   │   └── control.ts
│   │   ├── button.ts
│   │   ├── fader.ts
│   │   ├── encoder.ts
│   │   └── index.ts
│   │
│   ├── enums/                 # Todos los enums (60+)
│   │   └── [*.ts]
│   │
│   ├── models/                # Modelos de dominio de alto nivel
│   │   ├── tsi-file.ts
│   │   ├── device.ts
│   │   ├── mapping.ts
│   │   ├── fx-settings.ts
│   │   └── traktor-settings.ts
│   │
│   └── index.ts               # Exports públicos
│
├── __tests__/
│   ├── binary/
│   ├── format/
│   ├── commands/
│   ├── conditions/
│   ├── integration/
│   └── fixtures/              # Copias de tests/*.tsi
│
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### @cmdr/midi - Estructura

```
packages/midi/
├── src/
│   ├── manager.ts             # MidiManager singleton
│   ├── learner.ts             # MidiLearner para capturar MIDI
│   ├── devices.ts             # Tipos de dispositivos
│   ├── messages.ts            # Tipos de mensajes MIDI
│   └── index.ts
├── __tests__/
├── package.json
└── vitest.config.ts
```

### @cmdr/desktop - Estructura

```
packages/desktop/
├── src/
│   ├── main/                  # Proceso principal Electron
│   │   ├── index.ts
│   │   ├── menu.ts
│   │   └── ipc/
│   │       ├── file-handlers.ts
│   │       ├── midi-handlers.ts
│   │       └── index.ts
│   │
│   ├── preload/
│   │   └── index.ts
│   │
│   └── renderer/              # React App
│       ├── components/
│       │   ├── ui/            # shadcn/ui
│       │   ├── layout/
│       │   ├── devices/
│       │   ├── mappings/
│       │   ├── editors/
│       │   └── common/
│       ├── hooks/
│       ├── stores/
│       ├── lib/
│       ├── styles/
│       ├── App.tsx
│       └── main.tsx
│
├── resources/
├── electron.vite.config.ts
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## Mapeo de Componentes: WPF → React

### Capa de Datos

| C# (cmdr.TsiLib) | TypeScript (@cmdr/core) |
|------------------|-------------------------|
| `TsiFile` | `TsiFile` (class) |
| `Device` | `Device` (class) |
| `Mapping` (modelo) | `Mapping` (class) |
| `Format/Frame` | `binary/frame.ts` |
| `Format/Mapping` | `format/mapping.ts` |
| `Format/MappingSettings` | `format/mapping-settings.ts` |
| `StreamExtensions` | `binary/reader.ts` |
| `Writer` | `binary/writer.ts` |
| `TsiXmlDocument` | `xml/tsi-xml-document.ts` |
| `Commands/*` | `commands/*` |
| `Conditions/*` | `conditions/*` |
| `Enums/*` | `enums/*` |

### Capa de UI

| WPF (cmdr.Editor) | React (@cmdr/desktop) |
|-------------------|----------------------|
| `MainWindow.xaml` | `App.tsx` + `AppLayout` |
| `DeviceListView` | `DeviceList` |
| `MappingListView` | `MappingList` (DataTable) |
| `MappingEditor` | `MappingEditor` |
| `CommandEditor` | `CommandEditor` |
| `ConditionsEditor` | `ConditionsEditor` |
| `MidiEditor` | `MidiBindingEditor` |
| `TsiFileView` | `TsiFileTab` |
| `AboutWindow` | `AboutDialog` |
| `AppSettingsWindow` | `SettingsDialog` |
| AvalonDock tabs | Custom tabs component |

### Capa de Estado

| WPF ViewModels | Zustand Stores |
|----------------|----------------|
| `ViewModel` (root) | `useAppStore` |
| `TsiFileViewModel` | `useTsiStore` |
| `MappingViewModel` | Parte de `useTsiStore` |
| `DeviceViewModel` | Parte de `useTsiStore` |
| `MidiBindingEditorViewModel` | `useMidiStore` |

---

## Formato TSI - Análisis Técnico

### Estructura del Archivo

Un archivo TSI es un documento XML con datos binarios codificados en Base64:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<NIXML>
  <TraktorSettings>
    <Entry Name="DeviceIO.Config.Controller" Type="Text" Value="[BASE64_DATA]"/>
    <Entry Name="DeviceIO.Config.Keyboard" Type="Text" Value="[BASE64_DATA]"/>
    <!-- FX Settings, etc. -->
  </TraktorSettings>
</NIXML>
```

### Formato Binario (Big Endian)

El binario usa un sistema de "Frames" con identificadores FourCC:

```
DIOM (DeviceMappingsContainer)
├── DIOI (Info)
└── DDVS (DevicesList)
    └── [n] DDVC (Device)
        ├── DDVD (DeviceData)
        │   ├── Device name (wide string)
        │   ├── Device type string
        │   └── Ports info
        ├── DCMI (MidiInDefinitions)
        │   └── [n] DCMD (MidiDefinition)
        ├── DCMO (MidiOutDefinitions)
        │   └── [n] DCMD (MidiDefinition)
        └── CMAS (MappingsList)
            └── [n] CMAI (Mapping)
                ├── MidiNoteBindingId (int32)
                ├── Type (int32)
                ├── TraktorControlId (int32)
                └── CMST (MappingSettings)
```

### Tipos de Datos

- **int32**: 4 bytes Big Endian
- **float**: 4 bytes Big Endian
- **bool**: int32 (0 o 1)
- **ASCII string**: longitud fija, leída directamente
- **Wide string**: int32 length + UTF-16 BE bytes

---

## Estrategia de Testing

### Principios

1. **TDD Estricto**: Escribir tests antes de implementar
2. **Round-trip Fidelity**: Cargar → Guardar debe producir bytes idénticos
3. **Fixtures Reales**: Usar archivos TSI de producción como casos de prueba

### Niveles de Test

| Nivel | Herramienta | Objetivo | Cobertura |
|-------|-------------|----------|-----------|
| Unit | Vitest | Funciones individuales | >90% |
| Integration | Vitest | Flujos completos de parseo | Todos los fixtures |
| Component | @testing-library/react | Componentes React | Interacciones críticas |
| E2E | Playwright (opcional) | Flujos de usuario | Happy paths |

### Fixtures de Test

Archivos TSI existentes en `tests/`:

**unit_tests/** - Casos específicos:
- `encoder mode demo.tsi` - Modos de encoder
- `favorites_enum__1st_none___2nd_1____3rd_12.tsi` - Enums favoritos
- `fx_list_from_TK.tsi` - Lista de efectos
- `timecode_mode__*.tsi` - Modos de timecode
- `semitone *.tsi` - Valores de semitono

**traktor-ready/** - Dispositivos de producción:
- Kontrol S2/S3/S4/S8
- Pioneer DDJ-T1
- CDJ-2000NX2
- XDJ-1000
- Numark 4Trak

**keyboard/** - Mapeos de teclado

---

## Riesgos y Mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|--------|-------|---------|------------|
| Formato binario mal interpretado | Media | Alto | TDD, round-trip tests exhaustivos |
| Enums incompletos/incorrectos | Media | Medio | Verificar contra archivos reales |
| WebMidi incompatibilidad | Baja | Medio | Probar Windows/Linux temprano |
| Rendimiento con TSI grandes | Baja | Medio | Virtualización de listas, lazy loading |
| Pérdida de funcionalidad | Media | Alto | Checklist de funcionalidades, QA manual |

---

## Timeline Estimado

| Fase | Duración | Acumulado |
|------|----------|-----------|
| 1. Infraestructura | 1-2 sem | 2 sem |
| 2. Parser Binario | 3-4 sem | 6 sem |
| 3. Parser XML | 1-2 sem | 8 sem |
| 4. Commands | 2-3 sem | 11 sem |
| 5. Conditions | 1-2 sem | 13 sem |
| 6. FX Settings | 1 sem | 14 sem |
| 7. MIDI | 2 sem | 16 sem |
| 8. UI Core | 3-4 sem | 20 sem |
| 9. UI Avanzada | 2-3 sem | 23 sem |
| 10. Reportes | 1 sem | 24 sem |
| 11. Polish | 1-2 sem | 26 sem |

**Total estimado: 6-7 meses**

---

## Referencias

- Proyecto original: `cmdr/` en este repositorio
- Documentación Traktor: `docs/`
- Archivos de test: `tests/`
- electron-vite: https://electron-vite.org
- shadcn/ui: https://ui.shadcn.com
- WebMidi.js: https://webmidijs.org

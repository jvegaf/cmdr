# CMDR Migration Tasks

Lista detallada de tareas para la migración de WPF a Electron/React.

**Leyenda:**
- [ ] Pendiente
- [x] Completado
- [~] En progreso
- [!] Bloqueado

---

## Fase 1: Infraestructura Base ✅

### 1.1 Setup del Monorepo ✅

- [x] Crear directorio `cmdr-electron/` en la raíz del proyecto
- [x] Inicializar `package.json` raíz con `"private": true`
- [x] Crear `pnpm-workspace.yaml` con packages/*
- [x] Crear `tsconfig.base.json` con configuración compartida
- [x] Crear `vitest.workspace.ts` para tests del monorepo
- [x] Configurar ESLint con reglas TypeScript
- [x] Configurar Prettier
- [x] Crear `.gitignore` para node_modules, dist, etc.
- [x] Crear script `pnpm install` y verificar que funciona

### 1.2 Package @cmdr/core - Scaffold ✅

- [x] Crear `packages/core/package.json`
- [x] Crear `packages/core/tsconfig.json` (extends base)
- [x] Crear `packages/core/vitest.config.ts`
- [x] Crear estructura de directorios:
  - [x] `src/binary/`
  - [x] `src/format/`
  - [x] `src/xml/`
  - [ ] `src/commands/`
  - [ ] `src/conditions/`
  - [ ] `src/controls/`
  - [x] `src/enums/`
  - [x] `src/models/`
  - [x] `__tests__/`
- [x] Crear `src/index.ts` con exports
- [x] Verificar que `pnpm build` funciona
- [x] Verificar que `pnpm test` funciona (71 tests passing)

### 1.3 Package @cmdr/midi - Scaffold ✅

- [x] Crear `packages/midi/package.json`
- [x] Crear `packages/midi/tsconfig.json`
- [x] Crear `packages/midi/vitest.config.ts`
- [x] Crear estructura de directorios
- [x] Agregar dependencia `webmidi`
- [x] Crear `src/index.ts` con exports
- [x] Implementar `MidiManager` (WebMIDI wrapper)
- [x] Implementar `MidiMessage` (message parsing)

### 1.4 Package @cmdr/desktop - Scaffold ✅

- [x] Crear estructura con electron-vite manualmente
- [x] Configurar React + TypeScript
- [x] Ajustar `package.json` para monorepo
- [x] Instalar y configurar Tailwind CSS
- [x] Configurar CSS variables para theming (shadcn/ui pattern)
- [x] Configurar alias de paths (`@/`)
- [x] Crear main process con IPC handlers
- [x] Crear preload script con contextBridge
- [x] Crear React App shell con layout básico
- [x] Crear Zustand store para estado global
- [ ] Verificar que `pnpm dev` inicia la app (pendiente approve-builds)
- [ ] Verificar que `pnpm build` compila

### 1.5 Copiar Fixtures de Test ✅

- [x] Crear `packages/core/__tests__/fixtures/`
- [x] Copiar `tests/unit_tests/*.tsi` a fixtures (10 archivos)
- [ ] Copiar `tests/traktor-ready/*.tsi` a fixtures
- [ ] Copiar `tests/keyboard/*.tsi` a fixtures
- [ ] Crear archivo `fixtures/README.md` documentando cada fixture

---

## Fase 2: Parser TSI - Formato Binario ✅

### 2.1 Binary Reader ✅

- [x] Crear `src/binary/BinaryReader.ts`
- [x] Implementar clase `BinaryReader` con buffer interno
- [x] Implementar `readUInt32(): number` (Big Endian)
- [x] Implementar `readInt32(): number` (Big Endian)
- [x] Implementar `readFloat(): number` (Big Endian)
- [x] Implementar `readDouble(): number` (Big Endian)
- [x] Implementar `readBoolean(): boolean`
- [x] Implementar `readFourCC(): string`
- [x] Implementar `readWideString(): string` (UTF-16 BE)
- [x] Implementar `readBytes(length): Uint8Array`
- [x] Implementar `peekBytes(length): Uint8Array`
- [x] Implementar `peekFourCC(): string`
- [x] Implementar `skip(length): void`
- [x] Implementar `seek(position): void`
- [x] Implementar `offset` getter
- [x] Implementar `remaining` getter
- [x] Implementar `isEof` getter
- [x] Implementar `slice(length): BinaryReader`
- [x] Factory: `fromUint8Array(bytes)`
- [x] Factory: `fromBase64(string)`
- [x] Implementar `readAsciiString(length)` para DVST frame
- [x] **Tests:** 20 tests passing ✅

### 2.2 Binary Writer ✅

- [x] Crear `src/binary/BinaryWriter.ts`
- [x] Implementar clase `BinaryWriter` con buffer dinámico
- [x] Implementar `writeUInt32(value): void` (Big Endian)
- [x] Implementar `writeInt32(value): void` (Big Endian)
- [x] Implementar `writeFloat(value): void` (Big Endian)
- [x] Implementar `writeDouble(value): void` (Big Endian)
- [x] Implementar `writeBoolean(value): void`
- [x] Implementar `writeFourCC(fourCC): void`
- [x] Implementar `writeWideString(value): void` (UTF-16 BE)
- [x] Implementar `writeBytes(bytes): void`
- [x] Implementar `toArrayBuffer(): ArrayBuffer`
- [x] Implementar `toUint8Array(): Uint8Array`
- [x] Implementar `toBase64(): string`
- [x] Implementar `writeAsciiString(value)` para DVST frame
- [x] **Tests:** 12 tests passing ✅
- [x] **Round-trip tests:** 9 tests passing ✅

### 2.3 Sistema de Frames ✅

- [x] Crear `src/format/Frame.ts`
- [x] Definir interfaz `FrameHeader`
- [x] Implementar `Frame.readHeader(reader): FrameHeader`
- [x] Implementar `Frame.peekHeader(reader): FrameHeader`
- [x] Implementar `Frame.read(reader): Frame`
- [x] Implementar `Frame.readExpected(reader, fourCC): Frame`
- [x] Implementar `Frame.skip(reader): FrameHeader`
- [x] Implementar `Frame.readChildren(reader): Frame[]`
- [x] Implementar `Frame.write(writer, fourCC, data): void`
- [x] Implementar `Frame.create(fourCC, callback): Frame`
- [x] Implementar `Frame.createContainer(fourCC, children): Frame`
- [ ] **Tests:** Pendiente tests específicos de Frame

### 2.4 Format: MidiDefinition

- [ ] Crear `src/format/midi-definition.ts`
- [ ] Crear interfaz `MidiDefinitionData`
- [ ] Implementar `parseMidiDefinition(reader): MidiDefinitionData`
- [ ] Implementar `writeMidiDefinition(writer, data): void`
- [ ] Crear `src/format/midi-definitions.ts`
- [ ] Implementar `parseMidiInDefinitions(reader): MidiDefinitionData[]`
- [ ] Implementar `parseMidiOutDefinitions(reader): MidiDefinitionData[]`
- [ ] **Tests:**
  - [ ] Test parseo MidiDefinition individual
  - [ ] Test parseo lista de MidiDefinitions
  - [ ] Test round-trip MidiDefinition

### 2.5 Format: MappingSettings ✅

- [x] Crear `src/format/MappingSettings.ts`
- [x] Analizar `Format/MappingSettings.cs` para todos los campos
- [x] Crear interfaz `MappingSettingsData` con todos los campos:
  - [x] ControlType
  - [x] InteractionMode
  - [x] Target
  - [x] EncoderMode
  - [x] ConditionOneId, ConditionOneTarget, ConditionOneValue
  - [x] ConditionTwoId, ConditionTwoTarget, ConditionTwoValue
  - [x] ... (resto de campos)
- [x] Implementar `parseMappingSettings(reader): MappingSettingsData`
- [x] Implementar `writeMappingSettings(writer, data): void`
- [x] **Tests:**
  - [x] Test parseo MappingSettings completo
  - [x] Test round-trip MappingSettings

### 2.6 Format: Mapping ✅

- [x] Crear `src/format/Mapping.ts`
- [x] Crear interfaz `MappingData`
- [x] Implementar `parseMapping(reader): MappingData`
- [x] Implementar `writeMapping(writer, data): void`
- [x] Crear `src/format/MappingsContainer.ts`
- [x] Implementar `parseMappingsList(reader): MappingData[]`
- [x] **Tests:**
  - [x] Test parseo Mapping individual
  - [x] Test parseo lista de Mappings
  - [x] Test round-trip Mapping

### 2.7 Format: MidiNoteBinding ✅

- [x] Crear `src/format/MidiNoteBinding.ts`
- [x] Crear interfaz `MidiNoteBindingData`
- [x] Implementar `parseMidiNoteBinding(reader): MidiNoteBindingData`
- [x] Implementar `writeMidiNoteBinding(writer, data): void`
- [x] **Tests:**
  - [x] Test parseo MidiNoteBinding
  - [x] Test round-trip MidiNoteBinding

### 2.8 Format: DeviceData ✅

- [x] Crear `src/format/DeviceData.ts`
- [x] Crear interfaz `DeviceDataData`
- [x] Implementar `parseDeviceData(reader): DeviceDataData`
- [x] Implementar `writeDeviceData(writer, data): void`
- [x] **Tests:**
  - [x] Test parseo DeviceData
  - [x] Test round-trip DeviceData

### 2.9 Format: Device ✅

- [x] Crear `src/format/Device.ts`
- [x] Crear interfaz `DeviceFrameData`
- [x] Implementar `parseDevice(reader): DeviceFrameData`
- [x] Implementar `writeDevice(writer, data): void`
- [x] **Tests:**
  - [x] Test parseo Device completo
  - [x] Test round-trip Device

### 2.10 Format: DevicesList ✅

- [x] Integrado en `DeviceMappingsContainer.ts`
- [x] Implementar `parseDevicesList(reader): DeviceFrameData[]`
- [x] Implementar `writeDevicesList(writer, devices): void`
- [x] **Tests:**
  - [x] Test parseo lista de devices
  - [x] Test round-trip DevicesList

### 2.11 Format: DeviceMappingsContainer ✅

- [x] Crear `src/format/DeviceMappingsContainer.ts`
- [x] Crear interfaz `DeviceMappingsContainerData`
- [x] Implementar `parseDeviceMappingsContainer(reader): DeviceMappingsContainerData`
- [x] Implementar `writeDeviceMappingsContainer(writer, data): void`
- [x] **Tests:**
  - [x] Test parseo container completo
  - [x] Test round-trip container

### 2.12 Tests de Integración - Formato Binario ✅

- [x] Test: Cargar binario de `encoder mode demo.tsi`
- [x] Test: Round-trip binario `encoder mode demo.tsi`
- [x] Test: Cargar binario de `fx_list_from_TK.tsi`
- [x] Test: Round-trip binario `fx_list_from_TK.tsi`
- [x] Test: Cargar binario de `kontrol s4 mk2`
- [x] Test: Round-trip binario `kontrol s4 mk2`
- [x] Test: Cargar todos los fixtures sin errores (21 integration tests)
- [x] Test: Round-trip todos los fixtures producen datos equivalentes

### 2.13 High-Level TsiFile Model ✅

- [x] Crear `src/models/TsiFile.ts`
- [x] Crear clase `TsiFile` combinando XML + binary parsing
- [x] Implementar `parseTsiFile(xmlContent): TsiFile`
- [x] Implementar `getAllDevices(): DeviceFrameData[]`
- [x] Implementar `getTotalMappingCount(): number`
- [x] **Tests:** 10 deep-parsing tests passing ✅

### 2.14 XML Parser ✅

- [x] Crear `src/xml/TsiXmlParser.ts`
- [x] Implementar `parseTsiXml(xmlContent): TsiXmlDocument`
- [x] Implementar `getEntry(name): XmlEntry | null`
- [x] Implementar `getDeviceIoConfigController(): string | null`
- [x] Implementar `getDeviceIoConfigKeyboard(): string | null`
- [x] **Tests:** Integrated into integration tests

---

## Fase 3: Parser TSI - Capa XML ✅

### 3.1 TsiXmlDocument ✅

- [x] Crear `src/xml/TsiXmlParser.ts` (combinado en un archivo)
- [x] Implementar `parseTsiXml(xmlContent): TsiXmlData`
- [x] Implementar `buildTsiXml(data): string`
- [x] Implementar `getEntry(name: string): XmlEntry | null`
- [x] Implementar `setEntry(name: string, entry: XmlEntry): void` (via buildTsiXml)
- [x] Implementar `readTsiFile(path): TsiXmlData` (Node.js file reading)
- [x] **Tests:**
  - [x] Test parseo XML básico
  - [x] Test getEntry existente
  - [x] Test round-trip XML produce datos equivalentes

### 3.2 XML Entries ✅

- [x] Definir interfaz `TsiXmlEntry` en TsiXmlParser.ts
- [x] Implementar `DeviceIoConfigController` extraction
- [x] Implementar `DeviceIoConfigKeyboard` extraction
- [x] Base64 decode/encode de DeviceIoConfig
- [x] **Tests:**
  - [x] Test parseo entry de texto
  - [x] Test parseo DeviceIoConfig
  - [x] Test decode Base64 de DeviceIoConfig

### 3.3 Modelo TsiFile - Load ✅

- [x] Crear `src/models/TsiFile.ts`
- [x] Crear clase `TsiFile`
- [x] Implementar `static fromXml(xml: string): TsiFile`
- [x] Implementar parseo de:
  - [x] DeviceIoConfigController → devices de controladores
  - [x] DeviceIoConfigKeyboard → devices de teclado
- [x] **Tests:**
  - [x] Test load archivo simple
  - [x] Test load archivo con múltiples devices
  - [x] Test load archivo con keyboard mappings

### 3.4 Modelo TsiFile - Save ✅

- [x] Implementar `toXml(): string`
- [x] Implementar encode datos binarios a Base64
- [x] Implementar preservar entries no modificados del XML original
- [x] **Tests:**
  - [x] Test round-trip: load → save → load produce mismos datos
  - [x] Test save preserva estructura XML

### 3.5 Tests de Integración - TsiFile ✅

- [x] Test: Load + save cada fixture de unit_tests/
- [x] Test: Verificar que mappings se cargan correctamente
- [x] Test: Verificar que devices se cargan correctamente
- [ ] Test: Load + save cada fixture de traktor-ready/ (pendiente copiar fixtures)
- [ ] Test: Comparar bytes del archivo original vs guardado (byte-perfect round-trip)

---

## Fase 4: Sistema de Commands

### 4.1 Enums Base

- [ ] Crear `src/enums/mapping-type.ts` (In/Out)
- [ ] Crear `src/enums/mapping-control-type.ts` (Button/Fader/Encoder/LED)
- [ ] Crear `src/enums/mapping-interaction-mode.ts` (Direct/Hold/Toggle/...)
- [ ] Crear `src/enums/mapping-target-deck.ts` (DeviceTarget/DeckA/DeckB/...)
- [ ] Crear `src/enums/target-type.ts` (Global/Track/Remix/FX/Slot)
- [ ] Crear utility `enumDescription(value): string`
- [ ] **Tests:**
  - [ ] Test cada enum tiene valores correctos
  - [ ] Test enumDescription retorna string legible

### 4.2 Resto de Enums (60+)

- [ ] `effect.ts` - Todos los efectos de Traktor
- [ ] `deck.ts`
- [ ] `hotcue.ts`
- [ ] `loop-size.ts`
- [ ] `quantize-size.ts`
- [ ] `modifier-value.ts`
- [ ] `midi-encoder-mode.ts`
- [ ] `fx-unit-mode.ts`
- [ ] `playback-mode.ts`
- [ ] `slot-state.ts`
- [ ] `capture-source.ts`
- [ ] ... (resto de enums de cmdr.TsiLib/Enums/)
- [ ] Crear `src/enums/index.ts` exportando todos
- [ ] **Tests:**
  - [ ] Test valores coinciden con C# original

### 4.3 KnownCommands

- [ ] Crear `src/commands/known-commands.ts`
- [ ] Definir enum `KnownCommands` con todos los IDs de comandos
- [ ] Crear mapa `commandMetadata: Map<KnownCommands, CommandMetadata>`
- [ ] Incluir para cada comando:
  - [ ] ID numérico
  - [ ] Nombre
  - [ ] Categoría
  - [ ] TargetType
  - [ ] MappingType (In/Out)
- [ ] **Tests:**
  - [ ] Test cada comando tiene metadata completa
  - [ ] Test IDs coinciden con C# original

### 4.4 Command Base

- [ ] Crear `src/commands/base/command.ts`
- [ ] Crear clase abstracta `Command`
- [ ] Implementar propiedades:
  - [ ] `id: number`
  - [ ] `name: string`
  - [ ] `target: TargetType`
  - [ ] `mappingType: MappingType`
  - [ ] `assignment: MappingTargetDeck`
  - [ ] `controlType: MappingControlType`
  - [ ] `interactionMode: MappingInteractionMode`
- [ ] Implementar `getAssignmentOptions(): Map<MappingTargetDeck, string>`
- [ ] Implementar `getControlTypeOptions(): Map<MappingControlType, string>`
- [ ] Implementar `getInteractionModeOptions(): Map<MappingInteractionMode, string>`

### 4.5 Command Types

- [ ] Crear `src/commands/base/command-types.ts`
- [ ] Implementar `TriggerCommand` (sin valor)
- [ ] Implementar `EnumInCommand<T>` (valor enum)
- [ ] Implementar `IntInCommand` (valor int con rango)
- [ ] Implementar `FloatInCommand` (valor float con rango)
- [ ] Implementar `EnumOutCommand<T>` (output con rango de enum)
- [ ] Implementar `IntOutCommand` (output con rango int)
- [ ] Implementar `FloatOutCommand` (output con rango float)
- [ ] **Tests:**
  - [ ] Test cada tipo de comando
  - [ ] Test rangos de valores

### 4.6 CommandFactory

- [ ] Crear `src/commands/command-factory.ts`
- [ ] Implementar `createCommand(id: number, settings: MappingSettingsData): Command`
- [ ] Implementar mapeo de ID → clase de comando específica
- [ ] Manejar comandos desconocidos (fallback a comando genérico)
- [ ] **Tests:**
  - [ ] Test crear comando conocido
  - [ ] Test crear comando desconocido
  - [ ] Test settings se aplican correctamente

### 4.7 Implementaciones de Comandos

- [ ] Implementar comandos de Deck (Play, Cue, Sync, etc.)
- [ ] Implementar comandos de FX (Effect Selector, Dry/Wet, etc.)
- [ ] Implementar comandos de Mixer (Fader, EQ, etc.)
- [ ] Implementar comandos de Browser (Navigate, Load, etc.)
- [ ] Implementar comandos de Loop (Set, Move, Size, etc.)
- [ ] Implementar comandos de Modifier
- [ ] Implementar comandos de Global
- [ ] **Tests:**
  - [ ] Test cada categoría de comandos
  - [ ] Test comandos con valores enum
  - [ ] Test comandos con valores numéricos

---

## Fase 5: Sistema de Conditions

### 5.1 KnownConditions

- [ ] Crear `src/conditions/known-conditions.ts`
- [ ] Definir enum `KnownConditions` con todos los IDs
- [ ] Crear mapa `conditionMetadata`
- [ ] **Tests:**
  - [ ] Test IDs coinciden con C# original

### 5.2 Condition Base

- [ ] Crear `src/conditions/base/condition.ts`
- [ ] Crear clase abstracta `Condition`
- [ ] Implementar propiedades:
  - [ ] `id: number`
  - [ ] `name: string`
  - [ ] `target: TargetType`
  - [ ] `assignment: MappingTargetDeck`
  - [ ] `value: T` (genérico)
- [ ] Implementar `getAssignmentOptions()`
- [ ] Implementar `getValueOptions()`
- [ ] **Tests:**
  - [ ] Test condition base

### 5.3 ConditionFactory

- [ ] Crear `src/conditions/condition-factory.ts`
- [ ] Implementar `createCondition(id, settings, number): Condition`
- [ ] Manejar ConditionNumber (One/Two)
- [ ] **Tests:**
  - [ ] Test crear condition 1
  - [ ] Test crear condition 2

### 5.4 Implementaciones de Conditions

- [ ] Implementar `ModifierCondition`
- [ ] Implementar `DeckCondition`
- [ ] Implementar `FxCondition`
- [ ] Implementar `RemixCondition`
- [ ] Implementar resto de conditions
- [ ] **Tests:**
  - [ ] Test cada tipo de condition

---

## Fase 6: Sistema de Controls

### 6.1 Control Base

- [ ] Crear `src/controls/base/control.ts`
- [ ] Crear interfaz `Control`
- [ ] Definir propiedades:
  - [ ] `type: MappingControlType`
  - [ ] `allowedInteractionModes: MappingInteractionMode[]`

### 6.2 Implementaciones

- [ ] Implementar `ButtonControl`
- [ ] Implementar `FaderControl`
- [ ] Implementar `EncoderControl`
- [ ] Implementar `LEDControl`
- [ ] Crear registry de controls
- [ ] Implementar `getControl(command, interactionMode): Control`
- [ ] **Tests:**
  - [ ] Test cada control
  - [ ] Test obtener control para comando

---

## Fase 7: FX Settings

### 7.1 FxSnapshot

- [ ] Crear `src/models/fx-snapshot.ts`
- [ ] Implementar clase `FxSnapshot`
- [ ] Parseo desde XML
- [ ] Serialización a XML
- [ ] **Tests:**
  - [ ] Test parseo FxSnapshot

### 7.2 FxSettings

- [ ] Crear `src/models/fx-settings.ts`
- [ ] Implementar clase `FxSettings`
- [ ] Lista de efectos
- [ ] Mapa de snapshots
- [ ] Integración con TsiFile
- [ ] **Tests:**
  - [ ] Test load FxSettings desde TSI con FX
  - [ ] Test save FxSettings

### 7.3 Effect Selector Commands

- [ ] Implementar lógica de `prepareFxForSave`
- [ ] Implementar lógica de `restoreEffectSelectorCommands`
- [ ] Manejar optimización de FX list
- [ ] **Tests:**
  - [ ] Test usando `fx_list_from_TK.tsi`
  - [ ] Test optimizeFXList = true
  - [ ] Test optimizeFXList = false

---

## Fase 8: Modelos de Alto Nivel

### 8.1 Modelo Device

- [ ] Crear `src/models/device.ts`
- [ ] Crear clase `Device` (wrapper sobre DeviceFrameData)
- [ ] Propiedades:
  - [ ] `id: number`
  - [ ] `name: string`
  - [ ] `deviceType: string`
  - [ ] `isKeyboard: boolean`
  - [ ] `mappings: Mapping[]`
  - [ ] `inPorts`, `outPorts`
- [ ] Métodos:
  - [ ] `addMapping(mapping)`
  - [ ] `removeMapping(id)`
  - [ ] `moveMapping(fromIndex, toIndex)`
- [ ] **Tests:**
  - [ ] Test crear device
  - [ ] Test manipular mappings

### 8.2 Modelo Mapping

- [ ] Crear `src/models/mapping.ts`
- [ ] Crear clase `Mapping` (wrapper de alto nivel)
- [ ] Propiedades:
  - [ ] `id: number`
  - [ ] `command: Command`
  - [ ] `condition1: Condition | null`
  - [ ] `condition2: Condition | null`
  - [ ] `midiBinding: MidiBinding | null`
  - [ ] `comment: string`
- [ ] **Tests:**
  - [ ] Test crear mapping
  - [ ] Test modificar command
  - [ ] Test modificar conditions

### 8.3 Integración Completa

- [ ] Actualizar `TsiFile` para usar modelos de alto nivel
- [ ] Implementar conversión rawData ↔ modelos
- [ ] **Tests:**
  - [ ] Test integración completa con todos los fixtures

---

## Fase 9: Integración MIDI (@cmdr/midi)

### 9.1 MidiManager

- [ ] Crear `src/manager.ts`
- [ ] Implementar singleton `MidiManager`
- [ ] Implementar `getInputDevices(): MidiDevice[]`
- [ ] Implementar `getOutputDevices(): MidiDevice[]`
- [ ] Implementar `refreshDevices(): void`
- [ ] **Tests:**
  - [ ] Test mock de WebMidi

### 9.2 MidiLearner

- [ ] Crear `src/learner.ts`
- [ ] Implementar clase `MidiLearner`
- [ ] Implementar `startLearning(inputDevice): void`
- [ ] Implementar `stopLearning(): void`
- [ ] Implementar eventos para mensajes capturados
- [ ] **Tests:**
  - [ ] Test start/stop learning
  - [ ] Test captura de mensaje

### 9.3 Integración Electron

- [ ] Configurar permisos MIDI en main process
- [ ] Crear IPC handlers para MIDI
- [ ] Exponer API en preload
- [ ] **Tests:**
  - [ ] Test IPC handlers

---

## Fase 10: UI - Infraestructura (@cmdr/desktop)

### 10.1 Theme System

- [ ] Crear `ThemeProvider` component
- [ ] Implementar hook `useTheme`
- [ ] Configurar Tailwind para dark mode
- [ ] Crear `ThemeToggle` component
- [ ] Persistir preferencia en localStorage
- [ ] **Tests:**
  - [ ] Test toggle theme
  - [ ] Test persistencia

### 10.2 Layout Principal

- [ ] Crear `AppLayout` component
- [ ] Implementar sidebar colapsable
- [ ] Implementar área principal con tabs
- [ ] Implementar titlebar personalizado (si aplica)
- [ ] **Tests:**
  - [ ] Test render layout

### 10.3 Stores (Zustand)

- [ ] Crear `useAppStore` - estado global de la app
  - [ ] recentFiles
  - [ ] settings
- [ ] Crear `useTsiStore` - archivos TSI abiertos
  - [ ] openFiles
  - [ ] activeFileId
  - [ ] selectedDeviceId
  - [ ] selectedMappingIds
- [ ] Crear `useMidiStore` - estado MIDI
  - [ ] devices
  - [ ] isLearning
  - [ ] lastMessage
- [ ] **Tests:**
  - [ ] Test cada store

### 10.4 IPC Client

- [ ] Crear `src/renderer/lib/ipc-client.ts`
- [ ] Implementar wrapper type-safe sobre IPC
- [ ] Métodos:
  - [ ] `openFile(path): Promise<TsiFile>`
  - [ ] `saveFile(path, data): Promise<void>`
  - [ ] `showOpenDialog(): Promise<string | null>`
  - [ ] `showSaveDialog(): Promise<string | null>`

---

## Fase 11: UI - Componentes de Datos

### 11.1 DeviceList

- [ ] Crear `components/devices/device-list.tsx`
- [ ] Implementar lista de devices
- [ ] Selección de device
- [ ] Indicador de device activo
- [ ] Menú contextual (rename, delete, duplicate)
- [ ] **Tests:**
  - [ ] Test render lista
  - [ ] Test selección

### 11.2 DeviceEditor

- [ ] Crear `components/devices/device-editor.tsx`
- [ ] Edición de nombre
- [ ] Configuración de puertos MIDI
- [ ] Selector de tipo de device
- [ ] **Tests:**
  - [ ] Test edición

### 11.3 MappingList

- [ ] Crear `components/mappings/mapping-list.tsx`
- [ ] Implementar con shadcn DataTable
- [ ] Columnas:
  - [ ] # (índice)
  - [ ] Command
  - [ ] MIDI Binding
  - [ ] Conditions
  - [ ] Comment
- [ ] Selección múltiple
- [ ] Ordenamiento por columna
- [ ] Filtrado
- [ ] **Tests:**
  - [ ] Test render lista
  - [ ] Test selección múltiple
  - [ ] Test ordenamiento

### 11.4 MappingRow

- [ ] Crear `components/mappings/mapping-row.tsx`
- [ ] Render optimizado para virtualización
- [ ] Estados: normal, selected, hover
- [ ] **Tests:**
  - [ ] Test render row

### 11.5 Drag & Drop para MappingList

- [ ] Implementar drag & drop para reordenar
- [ ] Visual feedback durante drag
- [ ] Soporte para mover múltiples mappings
- [ ] **Tests:**
  - [ ] Test reordenar single
  - [ ] Test reordenar múltiple

---

## Fase 12: UI - Editores

### 12.1 MappingEditor

- [ ] Crear `components/editors/mapping-editor.tsx`
- [ ] Panel lateral con detalles del mapping seleccionado
- [ ] Secciones:
  - [ ] Command
  - [ ] Conditions
  - [ ] MIDI Binding
  - [ ] Comment
- [ ] Soporte para edición múltiple
- [ ] **Tests:**
  - [ ] Test render editor
  - [ ] Test edición

### 12.2 CommandEditor

- [ ] Crear `components/editors/command-editor.tsx`
- [ ] Selector de comando (dropdown con búsqueda)
- [ ] Propiedades del comando:
  - [ ] Assignment
  - [ ] Control Type
  - [ ] Interaction Mode
  - [ ] Valores específicos del comando
- [ ] **Tests:**
  - [ ] Test cambio de comando
  - [ ] Test edición de propiedades

### 12.3 ConditionsEditor

- [ ] Crear `components/editors/conditions-editor.tsx`
- [ ] Editor para Condition 1
- [ ] Editor para Condition 2
- [ ] Selector de condición (dropdown)
- [ ] Propiedades de la condición
- [ ] Botón para limpiar condición
- [ ] **Tests:**
  - [ ] Test agregar condición
  - [ ] Test modificar condición
  - [ ] Test limpiar condición

### 12.4 MidiBindingEditor

- [ ] Crear `components/editors/midi-binding-editor.tsx`
- [ ] Mostrar binding actual
- [ ] Campos editables:
  - [ ] Channel
  - [ ] Note/CC number
  - [ ] Type (Note/CC)
- [ ] Botón "Learn"
- [ ] Modal de MIDI Learn
- [ ] **Tests:**
  - [ ] Test edición manual
  - [ ] Test MIDI learn flow

### 12.5 CommentEditor

- [ ] Crear `components/editors/comment-editor.tsx`
- [ ] Textarea para comentario
- [ ] Auto-save on blur
- [ ] **Tests:**
  - [ ] Test edición de comentario

---

## Fase 13: UI - Funcionalidades de Archivo

### 13.1 File Operations

- [ ] Implementar "New File"
- [ ] Implementar "Open File"
- [ ] Implementar "Save"
- [ ] Implementar "Save As"
- [ ] Implementar "Close"
- [ ] **Tests:**
  - [ ] Test cada operación

### 13.2 Recent Files

- [ ] Implementar lista de archivos recientes
- [ ] Persistir en electron-store
- [ ] Mostrar en menú File
- [ ] Mostrar en pantalla de bienvenida
- [ ] **Tests:**
  - [ ] Test agregar a recientes
  - [ ] Test abrir desde recientes

### 13.3 Dirty State

- [ ] Detectar cambios no guardados
- [ ] Indicador visual (*) en tab
- [ ] Confirmación al cerrar archivo modificado
- [ ] Confirmación al cerrar app con cambios
- [ ] **Tests:**
  - [ ] Test detección de cambios
  - [ ] Test confirmación

### 13.4 File Tabs

- [ ] Implementar tabs para múltiples archivos
- [ ] Tab activo destacado
- [ ] Botón cerrar en cada tab
- [ ] Reordenar tabs con drag
- [ ] **Tests:**
  - [ ] Test múltiples archivos
  - [ ] Test cambiar tab activo

---

## Fase 14: UI - Edición Avanzada

### 14.1 Copy/Paste

- [ ] Implementar copy mappings
- [ ] Implementar paste mappings
- [ ] Soporte para múltiples mappings
- [ ] Usar clipboard del sistema
- [ ] **Tests:**
  - [ ] Test copy/paste single
  - [ ] Test copy/paste múltiple

### 14.2 Duplicate

- [ ] Implementar duplicar mapping(s)
- [ ] Insertar después de selección
- [ ] Generar nuevos IDs
- [ ] **Tests:**
  - [ ] Test duplicar

### 14.3 Delete

- [ ] Implementar eliminar mapping(s)
- [ ] Confirmación para múltiples
- [ ] **Tests:**
  - [ ] Test eliminar

### 14.4 Move Between Devices

- [ ] Implementar mover mappings entre devices
- [ ] Drag & drop entre listas
- [ ] O menú "Move to..."
- [ ] **Tests:**
  - [ ] Test mover mappings

### 14.5 Undo/Redo

- [ ] Implementar sistema de undo/redo
- [ ] Usar zustand middleware o custom
- [ ] Acciones undoable:
  - [ ] Crear/eliminar mapping
  - [ ] Modificar mapping
  - [ ] Reordenar
  - [ ] Crear/eliminar device
- [ ] **Tests:**
  - [ ] Test undo
  - [ ] Test redo
  - [ ] Test límite de history

---

## Fase 15: UI - Búsqueda y Filtros

### 15.1 Search

- [ ] Crear `components/common/search-input.tsx`
- [ ] Implementar búsqueda global
- [ ] Buscar en:
  - [ ] Command name
  - [ ] Comment
  - [ ] MIDI binding
- [ ] Highlight resultados
- [ ] **Tests:**
  - [ ] Test búsqueda

### 15.2 Filters

- [ ] Implementar filtros para MappingList
- [ ] Filtrar por:
  - [ ] Tipo de comando (categoría)
  - [ ] Control type
  - [ ] Con/sin conditions
  - [ ] Con/sin MIDI binding
- [ ] Combinar filtros
- [ ] **Tests:**
  - [ ] Test cada filtro

---

## Fase 16: UI - Reportes y Exportación

### 16.1 Export CSV

- [ ] Implementar exportar mappings a CSV
- [ ] Columnas configurables
- [ ] Exportar selección o todos
- [ ] **Tests:**
  - [ ] Test exportar CSV

### 16.2 Commands Report

- [ ] Crear vista de reporte de comandos
- [ ] Agrupar por categoría
- [ ] Mostrar uso por device
- [ ] **Tests:**
  - [ ] Test render reporte

### 16.3 Conditions Summary

- [ ] Crear vista de resumen de condiciones
- [ ] Listar todas las combinaciones usadas
- [ ] **Tests:**
  - [ ] Test render summary

---

## Fase 17: UI - Diálogos y Settings

### 17.1 About Dialog

- [ ] Crear `AboutDialog` component
- [ ] Mostrar:
  - [ ] Versión
  - [ ] Licencia
  - [ ] Créditos
  - [ ] Links
- [ ] **Tests:**
  - [ ] Test render

### 17.2 Settings Dialog

- [ ] Crear `SettingsDialog` component
- [ ] Secciones:
  - [ ] General (idioma, tema)
  - [ ] Traktor (versión, paths)
  - [ ] MIDI (device por defecto)
- [ ] Persistir settings
- [ ] **Tests:**
  - [ ] Test guardar settings

### 17.3 Keyboard Shortcuts

- [ ] Definir lista de shortcuts
- [ ] Implementar hook `useKeyboardShortcuts`
- [ ] Shortcuts principales:
  - [ ] Ctrl+O: Open
  - [ ] Ctrl+S: Save
  - [ ] Ctrl+Shift+S: Save As
  - [ ] Ctrl+W: Close tab
  - [ ] Ctrl+C/V/X: Copy/Paste/Cut
  - [ ] Ctrl+D: Duplicate
  - [ ] Delete: Delete
  - [ ] Ctrl+Z/Y: Undo/Redo
  - [ ] Ctrl+F: Search
- [ ] Mostrar en menú
- [ ] **Tests:**
  - [ ] Test cada shortcut

---

## Fase 18: Application Menu

### 18.1 Menu Structure

- [ ] Crear `src/main/menu.ts`
- [ ] Implementar menú:
  - [ ] File (New, Open, Recent, Save, Save As, Close, Exit)
  - [ ] Edit (Undo, Redo, Cut, Copy, Paste, Delete, Duplicate, Select All)
  - [ ] View (Theme, Zoom)
  - [ ] Help (Documentation, About)
- [ ] **Tests:**
  - [ ] Test acciones de menú

---

## Fase 19: Packaging y Distribución

### 19.1 Electron Builder Config

- [ ] Configurar `electron-builder.yml`
- [ ] Configurar para Windows (.exe, .msi)
- [ ] Configurar para Linux (.AppImage, .deb)
- [ ] Configurar iconos
- [ ] Configurar metadata (nombre, versión, autor)

### 19.2 Build Scripts

- [ ] Script para build Windows
- [ ] Script para build Linux
- [ ] Script para build ambos
- [ ] Verificar builds en cada plataforma

### 19.3 Auto-updater (Opcional)

- [ ] Configurar electron-updater
- [ ] Configurar servidor de actualizaciones
- [ ] Implementar check for updates
- [ ] Implementar download and install

---

## Fase 20: Testing Final y QA

### 20.1 Test Coverage

- [ ] Verificar cobertura >90% en @cmdr/core
- [ ] Verificar cobertura >80% en @cmdr/desktop
- [ ] Agregar tests faltantes

### 20.2 Manual Testing

- [ ] Probar cada fixture de unit_tests/
- [ ] Probar cada fixture de traktor-ready/
- [ ] Verificar round-trip fidelity
- [ ] Probar en Windows
- [ ] Probar en Linux
- [ ] Documentar bugs encontrados

### 20.3 Performance Testing

- [ ] Probar con archivos TSI grandes
- [ ] Verificar tiempo de carga
- [ ] Verificar uso de memoria
- [ ] Optimizar si es necesario

### 20.4 Bug Fixes

- [ ] Resolver bugs encontrados en QA
- [ ] Agregar tests de regresión

---

## Fase 21: Documentación

### 21.1 README

- [ ] Actualizar README principal
- [ ] Instrucciones de instalación
- [ ] Instrucciones de desarrollo
- [ ] Screenshots

### 21.2 Documentación Técnica

- [ ] Documentar arquitectura
- [ ] Documentar formato TSI
- [ ] Documentar API de @cmdr/core

### 21.3 Release Notes

- [ ] Crear CHANGELOG.md
- [ ] Documentar cambios vs versión WPF

---

## Notas de Progreso

### Sesión 1 - 2024-12-24
- Tareas completadas:
  - ✅ Fase 2 (TSI Binary Parser) - Lectura completa implementada
  - ✅ Creados todos los parsers de frames: DIOM, DEVI, DDAT, DDCB, CMAS, CMAI, CMAD, DCBM
  - ✅ Implementado TsiXmlParser para extraer datos Base64 del XML
  - ✅ Implementado modelo TsiFile de alto nivel
  - ✅ Añadidos métodos readAsciiString/writeAsciiString a BinaryReader/Writer
  - ✅ 71 tests pasando (40 binary, 21 integration, 10 deep-parsing)
- Notas:
  - Los 10 fixtures TSI cargan correctamente
  - Falta implementar serialización (write) para round-trip completo
  - Enums básicos añadidos (MappingType, DeviceTarget)
- Bloqueadores: Ninguno

### Sesión 2 - 2024-12-24
- Tareas completadas:
  - ✅ Implementado BinaryWriter con serialización Big Endian completa
  - ✅ Implementados métodos de escritura para todos los frames:
    - `createMappingSettingsFrame()` - CMAD frame
    - `createMappingFrame()` - CMAI frame
    - `createMidiNoteBindingFrame()` - DCBM frame
    - `createMappingsContainerFrame()` - DDCB frame
    - `createDeviceDataFrame()` - DDAT frame
    - `createDeviceFrame()` - DEVI frame
    - `createDeviceMappingsContainerFrame()` - DIOM root frame
  - ✅ Implementado `buildTsiXml()` en TsiXmlParser para generar XML
  - ✅ Implementado `TsiFile.toXml()` para serialización completa
  - ✅ Creados tests de round-trip exhaustivos (24 tests):
    - Binary round-trip para cada tipo de frame
    - TsiFile round-trip para todos los fixtures
    - Comparación de bytes binarios después de round-trip
  - ✅ 95 tests pasando (40 binary, 21 integration, 10 deep-parsing, 24 round-trip)
- Notas:
  - Round-trip funciona para todos los fixtures
  - El parser y serializador son byte-compatible
  - La Fase 2 está completamente terminada
- Bloqueadores: Ninguno

<!-- Agregar más sesiones según avance el proyecto -->

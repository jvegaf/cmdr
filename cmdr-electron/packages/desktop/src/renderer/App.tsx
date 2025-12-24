/**
 * Main Application Component
 *
 * AIDEV-NOTE: Root component for the CMDR application.
 * Manages the overall layout with toolbar, device tree, and mapping editor.
 * Wraps everything in ThemeProvider for consistent theming.
 */

import type { Device, Mapping } from '@cmdr/core';
import { FolderOpen, Save } from 'lucide-react';
import { useCallback, useEffect } from 'react';

import { ThemeProvider, ThemeToggle } from './components/theme';
import { Button } from './components/ui';
import { ipcClient } from './lib/ipc-client';
import { useMidiStore } from './store/midiStore';
import { useActiveFile, useTsiStore } from './store/tsiStore';

/**
 * Main application layout
 */
function AppLayout() {
  const activeFile = useActiveFile();
  const openFile = useTsiStore((s) => s.openFile);
  const { initialize: initMidi, isEnabled: midiEnabled } = useMidiStore();

  // Initialize MIDI on mount
  useEffect(() => {
    initMidi();
  }, [initMidi]);

  // Handle open file
  const handleOpenFile = useCallback(async () => {
    try {
      const result = await ipcClient.openTsiFile();
      if (result) {
        openFile(result.filePath, result.tsiFile);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  }, [openFile]);

  // Handle save file
  const handleSaveFile = useCallback(async () => {
    if (!activeFile) return;

    try {
      if (activeFile.filePath) {
        await ipcClient.writeTsiFile(activeFile.tsiFile, activeFile.filePath);
      } else {
        await ipcClient.saveTsiFile(activeFile.tsiFile);
      }
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  }, [activeFile]);

  // Get device and mapping counts
  const deviceCount = activeFile?.devices.length ?? 0;
  const mappingCount = activeFile
    ? activeFile.devices.reduce((sum: number, d: Device) => sum + d.mappingCount, 0)
    : 0;

  return (
    <div className="flex h-screen flex-col">
      {/* Toolbar */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">CMDR</h1>
          <span className="text-sm text-muted-foreground">TSI Editor</span>

          {/* File actions */}
          <div className="ml-4 flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleOpenFile}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Open
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveFile}
              disabled={!activeFile}
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* MIDI status indicator */}
          <span
            className={`mr-2 flex items-center gap-1.5 text-xs ${
              midiEnabled ? 'text-green-500' : 'text-muted-foreground'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                midiEnabled ? 'bg-green-500' : 'bg-muted-foreground'
              }`}
            />
            MIDI {midiEnabled ? 'Ready' : 'Off'}
          </span>

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Panel - Device Tree */}
        <aside className="w-64 border-r border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-medium">Devices</h2>
          {activeFile ? (
            <div className="space-y-2">
              {activeFile.devices.map((device: Device, index: number) => (
                <button
                  type="button"
                  key={device.id}
                  className={`w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                    activeFile.selectedDeviceIndex === index
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }`}
                  onClick={() =>
                    useTsiStore.getState().selectDevice(activeFile.id, index)
                  }
                >
                  <div className="font-medium">{device.typeStr || 'Generic MIDI'}</div>
                  <div className="text-xs text-muted-foreground">
                    {device.mappingCount} mappings
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No file loaded</p>
          )}
        </aside>

        {/* Center - Mapping List */}
        <section className="flex-1 overflow-auto p-4">
          {activeFile && activeFile.selectedDeviceIndex !== null ? (
            <div>
              <h2 className="mb-4 text-sm font-medium">
                Mappings (
                {activeFile.devices[activeFile.selectedDeviceIndex]?.mappingCount ?? 0})
              </h2>
              <div className="space-y-1">
                {activeFile.devices[
                  activeFile.selectedDeviceIndex
                ]?.mappings.map((mapping: Mapping) => (
                  <button
                    type="button"
                    key={mapping.id}
                    className={`w-full cursor-pointer rounded-md border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                      activeFile.selectedMappingIds.has(mapping.id)
                        ? 'bg-accent text-accent-foreground'
                        : ''
                    }`}
                    onClick={(e) => {
                      if (e.shiftKey) {
                        // Range selection - would need last selected ID
                        useTsiStore.getState().selectMapping(activeFile.id, mapping.id, false);
                      } else if (e.ctrlKey || e.metaKey) {
                        useTsiStore.getState().toggleMappingSelection(activeFile.id, mapping.id);
                      } else {
                        useTsiStore.getState().selectMapping(activeFile.id, mapping.id, true);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{mapping.commandName}</span>
                      <span className="text-xs text-muted-foreground">
                        {mapping.midiBinding?.note ?? 'No binding'}
                      </span>
                    </div>
                    {mapping.comment && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {mapping.comment}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">
                  {activeFile
                    ? 'Select a device to view mappings'
                    : 'Open a TSI file to start editing'}
                </p>
                {!activeFile && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    File → Open or Ctrl+O
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Right Panel - Properties */}
        <aside className="w-72 border-l border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-medium">Properties</h2>
          {activeFile && activeFile.selectedMappingIds.size > 0 ? (
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground">Selected: </span>
                <span>{activeFile.selectedMappingIds.size} mapping(s)</span>
              </div>
              {/* TODO: Add full property editor */}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a mapping to view properties
            </p>
          )}
        </aside>
      </main>

      {/* Status Bar */}
      <footer className="flex items-center justify-between border-t border-border bg-card px-4 py-1">
        <p className="text-xs text-muted-foreground">
          {activeFile
            ? `${activeFile.displayName}${activeFile.isDirty ? ' •' : ''}`
            : 'Ready'}
        </p>
        <p className="text-xs text-muted-foreground">
          {activeFile && `${deviceCount} devices, ${mappingCount} mappings`}
        </p>
      </footer>
    </div>
  );
}

/**
 * Root App component with providers
 */
export function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <AppLayout />
    </ThemeProvider>
  );
}

/**
 * Main Application Component
 *
 * AIDEV-NOTE: Root component for the CMDR application.
 * Manages the overall layout with toolbar, device tree, and mapping editor.
 */

import { useEffect } from 'react';
import { useAppStore } from './store/appStore';

export function App() {
  const { theme } = useAppStore();

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  return (
    <div className="flex h-screen flex-col">
      {/* Toolbar */}
      <header className="border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">CMDR</h1>
          <span className="text-sm text-muted-foreground">TSI Editor</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Panel - Device Tree */}
        <aside className="w-64 border-r border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-medium">Devices</h2>
          <p className="text-sm text-muted-foreground">No file loaded</p>
        </aside>

        {/* Center - Mapping Editor */}
        <section className="flex-1 overflow-auto p-4">
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">
                Open a TSI file to start editing
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                File → Open or Ctrl+O
              </p>
            </div>
          </div>
        </section>

        {/* Right Panel - Properties */}
        <aside className="w-72 border-l border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-medium">Properties</h2>
          <p className="text-sm text-muted-foreground">
            Select a mapping to view properties
          </p>
        </aside>
      </main>

      {/* Status Bar */}
      <footer className="border-t border-border bg-card px-4 py-1">
        <p className="text-xs text-muted-foreground">Ready</p>
      </footer>
    </div>
  );
}

/**
 * Application State Store (Zustand)
 *
 * AIDEV-NOTE: Global application state using Zustand.
 * Manages UI state, loaded TSI files, and editor state.
 */

import { create } from 'zustand';

export type Theme = 'light' | 'dark';

interface AppState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // File state
  currentFilePath: string | null;
  isModified: boolean;
  setCurrentFile: (path: string | null) => void;
  setModified: (modified: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Theme - default to dark
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  // File state
  currentFilePath: null,
  isModified: false,
  setCurrentFile: (path) => set({ currentFilePath: path, isModified: false }),
  setModified: (modified) => set({ isModified: modified }),
}));

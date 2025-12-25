/**
 * Theme Toggle Button
 *
 * AIDEV-NOTE: A button that toggles between light and dark themes.
 * Shows sun icon for light mode, moon icon for dark mode.
 */

import { Moon, Sun } from 'lucide-react';

import { cn } from '../../lib/utils';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
}

/**
 * Theme toggle button component
 *
 * @example
 * ```tsx
 * <ThemeToggle className="ml-auto" />
 * ```
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md',
        'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}

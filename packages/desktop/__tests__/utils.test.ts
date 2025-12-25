/**
 * Tests for utils.ts - Utility Functions
 *
 * AIDEV-NOTE: Tests the cn() utility function for Tailwind class merging.
 */

import { describe, expect, it } from 'vitest';
import { cn } from '../src/renderer/lib/utils';

describe('utils', () => {
  describe('cn (classNames merge)', () => {
    it('should merge simple class strings', () => {
      const result = cn('foo', 'bar');
      expect(result).toBe('foo bar');
    });

    it('should handle single class', () => {
      const result = cn('foo');
      expect(result).toBe('foo');
    });

    it('should handle empty inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle undefined and null values', () => {
      const result = cn('foo', undefined, null, 'bar');
      expect(result).toBe('foo bar');
    });

    it('should handle conditional classes with boolean', () => {
      const isActive = true;
      const isDisabled = false;

      const result = cn('base', isActive && 'active', isDisabled && 'disabled');
      expect(result).toBe('base active');
    });

    it('should handle conditional classes with ternary', () => {
      const isActive = true;
      const result = cn('base', isActive ? 'active' : 'inactive');
      expect(result).toBe('base active');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['foo', 'bar'], 'baz');
      expect(result).toBe('foo bar baz');
    });

    it('should handle object syntax', () => {
      const result = cn({
        foo: true,
        bar: false,
        baz: true,
      });
      expect(result).toBe('foo baz');
    });

    // Tailwind-specific merging tests
    describe('Tailwind class conflict resolution', () => {
      it('should resolve padding conflicts (last wins)', () => {
        const result = cn('px-2', 'px-4');
        expect(result).toBe('px-4');
      });

      it('should resolve margin conflicts', () => {
        const result = cn('mt-2', 'mt-4');
        expect(result).toBe('mt-4');
      });

      it('should keep non-conflicting utility classes', () => {
        const result = cn('px-2 py-1', 'px-4');
        expect(result).toBe('py-1 px-4');
      });

      it('should resolve background color conflicts', () => {
        const result = cn('bg-red-500', 'bg-blue-500');
        expect(result).toBe('bg-blue-500');
      });

      it('should resolve text color conflicts', () => {
        const result = cn('text-red-500', 'text-blue-500');
        expect(result).toBe('text-blue-500');
      });

      it('should resolve width conflicts', () => {
        const result = cn('w-full', 'w-1/2');
        expect(result).toBe('w-1/2');
      });

      it('should resolve height conflicts', () => {
        const result = cn('h-10', 'h-20');
        expect(result).toBe('h-20');
      });

      it('should resolve display conflicts', () => {
        const result = cn('hidden', 'flex');
        expect(result).toBe('flex');
      });

      it('should handle complex mixed merges', () => {
        const result = cn(
          'px-2 py-1 bg-red-500 text-white',
          'px-4', // Override padding-x
          'bg-blue-500' // Override background
        );
        expect(result).toBe('py-1 text-white px-4 bg-blue-500');
      });

      it('should preserve responsive prefixes correctly', () => {
        const result = cn('md:px-2', 'md:px-4');
        expect(result).toBe('md:px-4');
      });

      it('should not conflict different responsive prefixes', () => {
        const result = cn('px-2', 'md:px-4');
        expect(result).toBe('px-2 md:px-4');
      });

      it('should handle hover state prefixes', () => {
        const result = cn('hover:bg-red-500', 'hover:bg-blue-500');
        expect(result).toBe('hover:bg-blue-500');
      });

      it('should not conflict base with hover state', () => {
        const result = cn('bg-red-500', 'hover:bg-blue-500');
        expect(result).toBe('bg-red-500 hover:bg-blue-500');
      });

      it('should handle dark mode prefix', () => {
        const result = cn('dark:bg-gray-900', 'dark:bg-gray-800');
        expect(result).toBe('dark:bg-gray-800');
      });
    });

    // Real-world component usage patterns
    describe('Real-world usage patterns', () => {
      it('should handle button variant merging', () => {
        const baseClasses = 'px-4 py-2 rounded font-medium';
        const variantClasses = 'bg-blue-500 text-white';
        const overrideClasses = 'px-6'; // Larger padding for size variant

        const result = cn(baseClasses, variantClasses, overrideClasses);
        expect(result).toBe('py-2 rounded font-medium bg-blue-500 text-white px-6');
      });

      it('should handle disabled state override', () => {
        const baseClasses = 'bg-blue-500 cursor-pointer';
        const disabledClasses = 'bg-gray-300 cursor-not-allowed';

        const result = cn(baseClasses, disabledClasses);
        expect(result).toBe('bg-gray-300 cursor-not-allowed');
      });

      it('should handle className prop spreading', () => {
        const componentClasses = 'flex items-center gap-2';
        const userClassName = 'mt-4 gap-4'; // User wants different gap and margin

        const result = cn(componentClasses, userClassName);
        expect(result).toBe('flex items-center mt-4 gap-4');
      });
    });
  });
});

/**
 * Toast Store Tests
 *
 * AIDEV-NOTE: Tests for the toast notification store.
 * Covers adding, removing, clearing toasts, and integration
 * with verboseExceptions setting for error details.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useToastStore,
  showToast,
  showErrorToast,
  showSuccessToast,
  showWarningToast,
  showInfoToast,
} from '../src/renderer/store/toastStore';

// Mock the appStore's getAdvancedSettings
vi.mock('../src/renderer/store/appStore', () => ({
  getAdvancedSettings: vi.fn(() => ({
    loadLastFileAtStartup: true,
    verboseExceptions: false,
  })),
}));

// Import after mocking so we can control it
import { getAdvancedSettings } from '../src/renderer/store/appStore';
const mockGetAdvancedSettings = vi.mocked(getAdvancedSettings);

describe('toastStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useToastStore.setState({ toasts: [] });
    vi.clearAllMocks();
    mockGetAdvancedSettings.mockReturnValue({
      loadLastFileAtStartup: true,
      verboseExceptions: false,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // ============================================================================
  // Basic Toast Operations
  // ============================================================================

  describe('addToast', () => {
    it('should add a toast with default values', () => {
      const { addToast } = useToastStore.getState();

      const id = addToast({ message: 'Test message' });

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0]).toMatchObject({
        id,
        message: 'Test message',
        variant: 'info',
        duration: 5000,
      });
      expect(toasts[0].createdAt).toBeGreaterThan(0);
    });

    it('should add a toast with custom variant', () => {
      const { addToast } = useToastStore.getState();

      addToast({ message: 'Success!', variant: 'success' });

      const { toasts } = useToastStore.getState();
      expect(toasts[0].variant).toBe('success');
    });

    it('should add a toast with custom duration', () => {
      const { addToast } = useToastStore.getState();

      addToast({ message: 'Long toast', duration: 10000 });

      const { toasts } = useToastStore.getState();
      expect(toasts[0].duration).toBe(10000);
    });

    it('should add a toast with details', () => {
      const { addToast } = useToastStore.getState();

      addToast({ message: 'Error', details: 'Stack trace here' });

      const { toasts } = useToastStore.getState();
      expect(toasts[0].details).toBe('Stack trace here');
    });

    it('should use longer duration for error toasts by default', () => {
      const { addToast } = useToastStore.getState();

      addToast({ message: 'Error!', variant: 'error' });

      const { toasts } = useToastStore.getState();
      expect(toasts[0].duration).toBe(8000); // ERROR_DURATION
    });

    it('should generate unique IDs for each toast', () => {
      const { addToast } = useToastStore.getState();

      const id1 = addToast({ message: 'Toast 1' });
      const id2 = addToast({ message: 'Toast 2' });

      expect(id1).not.toBe(id2);
    });

    it('should keep newest toasts first', () => {
      const { addToast } = useToastStore.getState();

      addToast({ message: 'First' });
      addToast({ message: 'Second' });
      addToast({ message: 'Third' });

      const { toasts } = useToastStore.getState();
      expect(toasts[0].message).toBe('Third');
      expect(toasts[1].message).toBe('Second');
      expect(toasts[2].message).toBe('First');
    });

    it('should limit toasts to MAX_TOASTS (5)', () => {
      const { addToast } = useToastStore.getState();

      for (let i = 0; i < 7; i++) {
        addToast({ message: `Toast ${i}` });
      }

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(5);
      // Most recent should be first
      expect(toasts[0].message).toBe('Toast 6');
    });
  });

  describe('removeToast', () => {
    it('should remove a toast by ID', () => {
      const { addToast, removeToast } = useToastStore.getState();

      const id = addToast({ message: 'Test' });
      expect(useToastStore.getState().toasts).toHaveLength(1);

      removeToast(id);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should only remove the specified toast', () => {
      const { addToast, removeToast } = useToastStore.getState();

      const id1 = addToast({ message: 'Toast 1' });
      addToast({ message: 'Toast 2' });

      removeToast(id1);

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Toast 2');
    });

    it('should handle removing non-existent toast ID gracefully', () => {
      const { addToast, removeToast } = useToastStore.getState();

      addToast({ message: 'Test' });

      // Should not throw
      removeToast('non-existent-id');

      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  describe('clearToasts', () => {
    it('should remove all toasts', () => {
      const { addToast, clearToasts } = useToastStore.getState();

      addToast({ message: 'Toast 1' });
      addToast({ message: 'Toast 2' });
      addToast({ message: 'Toast 3' });

      expect(useToastStore.getState().toasts).toHaveLength(3);

      clearToasts();

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should handle clearing empty toast list', () => {
      const { clearToasts } = useToastStore.getState();

      // Should not throw
      clearToasts();

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  // ============================================================================
  // Convenience Methods
  // ============================================================================

  describe('convenience methods', () => {
    it('success() should create a success toast', () => {
      const { success } = useToastStore.getState();

      success('Operation completed');

      const { toasts } = useToastStore.getState();
      expect(toasts[0]).toMatchObject({
        message: 'Operation completed',
        variant: 'success',
      });
    });

    it('success() should accept details', () => {
      const { success } = useToastStore.getState();

      success('Done', 'Additional info');

      const { toasts } = useToastStore.getState();
      expect(toasts[0].details).toBe('Additional info');
    });

    it('error() should create an error toast', () => {
      const { error } = useToastStore.getState();

      error('Something went wrong');

      const { toasts } = useToastStore.getState();
      expect(toasts[0]).toMatchObject({
        message: 'Something went wrong',
        variant: 'error',
        duration: 8000,
      });
    });

    it('warning() should create a warning toast', () => {
      const { warning } = useToastStore.getState();

      warning('Careful!');

      const { toasts } = useToastStore.getState();
      expect(toasts[0]).toMatchObject({
        message: 'Careful!',
        variant: 'warning',
      });
    });

    it('info() should create an info toast', () => {
      const { info } = useToastStore.getState();

      info('FYI');

      const { toasts } = useToastStore.getState();
      expect(toasts[0]).toMatchObject({
        message: 'FYI',
        variant: 'info',
      });
    });
  });

  // ============================================================================
  // Auto-dismiss
  // ============================================================================

  describe('auto-dismiss', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-dismiss toast after duration', () => {
      const { addToast } = useToastStore.getState();

      addToast({ message: 'Temporary', duration: 1000 });
      expect(useToastStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(1000);

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should not auto-dismiss when duration is 0', () => {
      const { addToast } = useToastStore.getState();

      addToast({ message: 'Permanent', duration: 0 });
      expect(useToastStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(60000); // Advance 1 minute

      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  // ============================================================================
  // Non-hook Accessors
  // ============================================================================

  describe('showToast', () => {
    it('should add a toast and return ID', () => {
      const id = showToast({ message: 'Test' });

      expect(id).toMatch(/^toast-/);
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  describe('showErrorToast', () => {
    it('should create error toast with message only when verboseExceptions is false', () => {
      mockGetAdvancedSettings.mockReturnValue({
        loadLastFileAtStartup: true,
        verboseExceptions: false,
      });

      showErrorToast('Error occurred', new Error('Detailed error'));

      const { toasts } = useToastStore.getState();
      expect(toasts[0].message).toBe('Error occurred');
      expect(toasts[0].details).toBeUndefined();
      expect(toasts[0].variant).toBe('error');
    });

    it('should include stack trace when verboseExceptions is true', () => {
      mockGetAdvancedSettings.mockReturnValue({
        loadLastFileAtStartup: true,
        verboseExceptions: true,
      });

      const error = new Error('Detailed error');
      showErrorToast('Error occurred', error);

      const { toasts } = useToastStore.getState();
      expect(toasts[0].message).toBe('Error occurred');
      expect(toasts[0].details).toContain('Error: Detailed error');
    });

    it('should accept string as error details', () => {
      mockGetAdvancedSettings.mockReturnValue({
        loadLastFileAtStartup: true,
        verboseExceptions: true,
      });

      showErrorToast('Error occurred', 'Custom details string');

      const { toasts } = useToastStore.getState();
      expect(toasts[0].details).toBe('Custom details string');
    });

    it('should work without error details', () => {
      showErrorToast('Simple error');

      const { toasts } = useToastStore.getState();
      expect(toasts[0].message).toBe('Simple error');
      expect(toasts[0].details).toBeUndefined();
    });
  });

  describe('showSuccessToast', () => {
    it('should create a success toast', () => {
      showSuccessToast('Task completed');

      const { toasts } = useToastStore.getState();
      expect(toasts[0]).toMatchObject({
        message: 'Task completed',
        variant: 'success',
      });
    });
  });

  describe('showWarningToast', () => {
    it('should create a warning toast', () => {
      showWarningToast('Be careful');

      const { toasts } = useToastStore.getState();
      expect(toasts[0]).toMatchObject({
        message: 'Be careful',
        variant: 'warning',
      });
    });

    it('should accept optional details', () => {
      showWarningToast('Warning', 'More details');

      const { toasts } = useToastStore.getState();
      expect(toasts[0].details).toBe('More details');
    });
  });

  describe('showInfoToast', () => {
    it('should create an info toast', () => {
      showInfoToast('Just so you know');

      const { toasts } = useToastStore.getState();
      expect(toasts[0]).toMatchObject({
        message: 'Just so you know',
        variant: 'info',
      });
    });
  });
});

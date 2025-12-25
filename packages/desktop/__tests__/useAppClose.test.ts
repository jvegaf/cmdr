/**
 * Tests for useAppClose hook
 *
 * AIDEV-NOTE: Tests the app close hook by mocking ipc-client functions.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// Track callbacks for testing
let capturedCallback: (() => void) | null = null;
const mockUnsubscribe = vi.fn();

vi.mock('../src/renderer/lib/ipc-client', () => ({
  subscribeToCheckDirtyFiles: vi.fn((callback: () => void) => {
    capturedCallback = callback;
    return mockUnsubscribe;
  }),
  respondDirtyFiles: vi.fn(),
}));

// Import after mock
import { useAppClose } from '../src/renderer/hooks/useAppClose';
import { subscribeToCheckDirtyFiles, respondDirtyFiles } from '../src/renderer/lib/ipc-client';

describe('useAppClose', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedCallback = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should subscribe to dirty files check on mount', () => {
    renderHook(() => useAppClose(false));

    expect(subscribeToCheckDirtyFiles).toHaveBeenCalledOnce();
    expect(subscribeToCheckDirtyFiles).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useAppClose(false));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });

  it('should respond with false when no dirty files', () => {
    renderHook(() => useAppClose(false));

    expect(capturedCallback).not.toBeNull();
    capturedCallback?.();

    expect(respondDirtyFiles).toHaveBeenCalledWith(false);
  });

  it('should respond with true when there are dirty files', () => {
    renderHook(() => useAppClose(true));

    capturedCallback?.();

    expect(respondDirtyFiles).toHaveBeenCalledWith(true);
  });

  it('should update response when hasDirtyFiles changes', () => {
    const { rerender } = renderHook(({ hasDirty }) => useAppClose(hasDirty), {
      initialProps: { hasDirty: false },
    });

    // First callback should respond false
    capturedCallback?.();
    expect(respondDirtyFiles).toHaveBeenLastCalledWith(false);

    // Change to dirty
    rerender({ hasDirty: true });

    // Should have re-subscribed
    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(subscribeToCheckDirtyFiles).toHaveBeenCalledTimes(2);

    // New callback should respond true
    capturedCallback?.();
    expect(respondDirtyFiles).toHaveBeenLastCalledWith(true);
  });
});

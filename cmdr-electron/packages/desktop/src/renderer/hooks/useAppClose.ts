/**
 * useAppClose Hook
 *
 * AIDEV-NOTE: Handles app close confirmation when there are dirty files.
 * Listens for the main process's request to check for unsaved changes
 * and responds accordingly.
 */

import { useEffect } from 'react';
import {
  respondDirtyFiles,
  subscribeToCheckDirtyFiles,
} from '../lib/ipc-client';

/**
 * Hook to handle app close confirmation with dirty files
 * @param hasDirtyFiles Whether there are unsaved changes
 */
export function useAppClose(hasDirtyFiles: boolean): void {
  useEffect(() => {
    // Subscribe to dirty files check requests from main process
    const unsubscribe = subscribeToCheckDirtyFiles(() => {
      // Respond with current dirty status
      respondDirtyFiles(hasDirtyFiles);
    });

    return unsubscribe;
  }, [hasDirtyFiles]);
}

export default useAppClose;

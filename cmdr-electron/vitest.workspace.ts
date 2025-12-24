import { defineWorkspace } from 'vitest/config';

// AIDEV-NOTE: Vitest workspace configuration for the CMDR monorepo
// Each package has its own test configuration but shares this workspace setup
export default defineWorkspace([
  {
    extends: './packages/core/vitest.config.ts',
    test: {
      name: 'core',
      root: './packages/core',
    },
  },
  {
    extends: './packages/midi/vitest.config.ts',
    test: {
      name: 'midi',
      root: './packages/midi',
    },
  },
  {
    extends: './packages/desktop/vitest.config.ts',
    test: {
      name: 'desktop',
      root: './packages/desktop',
    },
  },
]);

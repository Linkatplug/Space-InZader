import { defineConfig } from 'vitest/config';

// Rapport d'équilibrage (bot) : npm run balance
export default defineConfig({
  test: {
    include: ['scripts/**/*.test.ts'],
    testTimeout: 600_000,
  },
});

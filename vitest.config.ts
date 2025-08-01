import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['(src|test)/**/*.?(i)(test|spec).(ts|js|tsx)'],
    coverage: {
      enabled: true,
      include: ['src/**/*.ts', 'test/**/*.ts'],
      reporter: ['json-summary', 'lcov'],
    },
    // Watch mode off by default
    watch: false,
  },
});

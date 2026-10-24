import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['src/**/*.test.ts'],
    coverage: { provider: 'v8', reporter: ['text-summary', 'json-summary'], include: ['src/lib/**'] },
  },
});

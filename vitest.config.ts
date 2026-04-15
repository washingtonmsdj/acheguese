import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => ({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Suite operacional compartilha fixtures remotas e não é segura em paralelo por arquivo.
    fileParallelism: false,
    testTimeout: 120000, // 2 minutos para testes operacionais (Gate 6/7 com auto-dispatch)
    hookTimeout: 30000,
    env: loadEnv(mode, process.cwd(), ''),
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
}));

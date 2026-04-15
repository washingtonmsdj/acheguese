import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: [
    'mapa.spec.ts',
    'mapa-geolocation.spec.ts',
    'mapa-dados-reais.spec.ts',
    'mapa-mobile.spec.ts',
    'mapa-network.spec.ts',
    'mapa-performance.spec.ts',
    'mapa-webgl.spec.ts',
    'mapa-geolocation-robustez.spec.ts',
    'mapa-clustering.spec.ts',
  ],
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:8082',
    trace: 'off',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },

  projects: [
    // Desktop padrão
    {
      name: 'chromium',
      testMatch: [
        'mapa.spec.ts',
        'mapa-geolocation.spec.ts',
        'mapa-dados-reais.spec.ts',
        'mapa-performance.spec.ts',
        'mapa-webgl.spec.ts',
        'mapa-geolocation-robustez.spec.ts',
        'mapa-clustering.spec.ts',
      ],
      use: { ...devices['Desktop Chrome'] },
    },

    // Testes de rede — Service Worker bloqueado
    {
      name: 'network-tests',
      testMatch: ['mapa-network.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        serviceWorkers: 'block',
      },
    },

    // Mobile Chrome (touch habilitado, viewport real)
    {
      name: 'mobile-chrome',
      testMatch: ['mapa-mobile.spec.ts'],
      use: { ...devices['Pixel 5'] },
    },

    // Mobile Safari
    {
      name: 'mobile-safari',
      testMatch: ['mapa-mobile.spec.ts'],
      use: { ...devices['iPhone 12'] },
    },
  ],
});

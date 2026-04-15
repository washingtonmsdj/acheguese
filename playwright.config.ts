import dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local', override: true });

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  webServer: {
    command: 'npm run dev -- --host localhost --port 8080',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

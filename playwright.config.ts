/**
 * 🎭 Playwright Configuration - AAA Testing Standards
 * 
 * Features:
 * - Parallel execution with isolation
 * - Screenshot/video on failure
 * - Trace collection for debugging
 * - Mobile and desktop viewports
 * - CI/CD optimized settings
 * 
 * @version 1.0.0
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // ═══════════════════════════════════════════════════════════════════════════════
  // DIRETÓRIOS E ESTRUTURA
  // ═══════════════════════════════════════════════════════════════════════════════
  testDir: './e2e',
  outputDir: './test-results',
  
  // Pattern de arquivos de teste
  testMatch: [
    '**/*.spec.ts',
    '**/*.test.ts'
  ],
  
  // Arquivos de setup/teardown global
  globalSetup: './e2e/setup/global-setup.ts',
  globalTeardown: './e2e/setup/global-teardown.ts',
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // EXECUÇÃO E PARALELISMO
  // ═══════════════════════════════════════════════════════════════════════════════
  // Workers paralelos (metade dos cores por padrão)
  workers: process.env.CI ? 4 : undefined,
  
  // Retry em CI
  retries: process.env.CI ? 2 : 1,
  
  // Timeout por teste
  timeout: 60000,
  
  // Expect timeout
  expect: {
    timeout: 10000
  },
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // REPORTERS
  // ═══════════════════════════════════════════════════════════════════════════════
  reporter: [
    ['list'],
    ['html', { 
      open: 'never',
      outputFolder: 'playwright-report' 
    }],
    ['junit', { 
      outputFile: 'test-results/junit.xml' 
    }],
    // Custom reporter para métricas AAA
    ['./e2e/setup/aaa-metrics-reporter.ts']
  ],
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // PROJETOS (BROWSERS/DEVICES)
  // ═══════════════════════════════════════════════════════════════════════════════
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      }
    },
    {
      name: 'chromium-mobile',
      use: { 
        ...devices['Pixel 5']
      }
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox']
      }
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari']
      }
    },
    // Modo visual regression (opcional)
    {
      name: 'chromium-visual',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
      grep: /@visual/
    }
  ],
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // USE (DEFAULTS)
  // ═══════════════════════════════════════════════════════════════════════════════
  use: {
    // Base URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Trace em falha (essencial para debug AAA)
    trace: 'on-first-retry',
    
    // Screenshot em falha
    screenshot: 'only-on-failure',
    
    // Video em falha
    video: 'on-first-retry',
    
    // Action timeout
    actionTimeout: 15000,
    
    // Navigation timeout
    navigationTimeout: 30000,
    
    // Locale e timezone
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    
    // Permissões
    permissions: ['clipboard-read', 'clipboard-write'],
    
    // Viewport padrão
    viewport: { width: 1280, height: 720 }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // WEB SERVER (PARA TESTES LOCAIS)
  // ═══════════════════════════════════════════════════════════════════════════════
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});

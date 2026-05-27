import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

test.describe('Debug Console Logs', () => {
  
  test('Capturar logs do console', async ({ page }) => {
    const consoleLogs: string[] = [];

    // Capturar todos os logs do console
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[DEBUG]')) {
        consoleLogs.push(text);
        console.log(text);
      }
    });

    // Navegar para listagem
    await page.goto(`${BASE_URL}/pontos-turisticos/ba/salvador`);
    await page.waitForLoadState('networkidle');

    // Aguardar um pouco para garantir que todos os logs foram capturados
    await page.waitForTimeout(3000);

    // Exibir logs capturados
    console.log('\n=== LOGS DO CONSOLE ===');
    console.log(`Total de logs: ${consoleLogs.length}`);
    consoleLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });
    console.log('=======================\n');
  });
});

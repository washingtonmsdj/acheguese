import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

test.describe('Debug API Error', () => {
  
  test('Capturar erro 400 da API', async ({ page }) => {
    const apiErrors: any[] = [];

    // Interceptar requisições da API
    page.on('response', async (response) => {
      const url = response.url();
      
      // Capturar apenas requisições do Supabase
      if (url.includes('supabase') && response.status() === 400) {
        try {
          const body = await response.json();
          apiErrors.push({
            url,
            status: response.status(),
            body
          });
        } catch (e) {
          apiErrors.push({
            url,
            status: response.status(),
            error: 'Could not parse response'
          });
        }
      }
    });

    // Navegar para listagem
    await page.goto(`${BASE_URL}/pontos-turisticos/ba/salvador`);
    await page.waitForLoadState('networkidle');

    // Aguardar um pouco para garantir que todas as requisições foram feitas
    await page.waitForTimeout(2000);

    // Exibir erros capturados
    console.log('\n=== ERROS DA API ===');
    console.log(JSON.stringify(apiErrors, null, 2));
    console.log('===================\n');

    // Verificar se há erros
    if (apiErrors.length > 0) {
      console.log(`\n❌ ${apiErrors.length} erro(s) 400 capturado(s)\n`);
      
      apiErrors.forEach((error, index) => {
        console.log(`\nErro ${index + 1}:`);
        console.log('URL:', error.url);
        console.log('Status:', error.status);
        console.log('Body:', JSON.stringify(error.body, null, 2));
      });
    }
  });
});

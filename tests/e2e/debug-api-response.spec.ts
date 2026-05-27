import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

test.describe('Debug API Response', () => {
  
  test('Verificar resposta da API de listagem', async ({ page }) => {
    const apiResponses: any[] = [];

    // Interceptar requisições da API
    page.on('response', async (response) => {
      const url = response.url();
      
      // Capturar apenas requisições do Supabase para tourist_points
      if (url.includes('tourist_points') && url.includes('supabase')) {
        try {
          const body = await response.json();
          apiResponses.push({
            url,
            status: response.status(),
            body
          });
        } catch (e) {
          apiResponses.push({
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

    // Exibir respostas capturadas
    console.log('\n=== RESPOSTAS DA API ===');
    
    apiResponses.forEach((response, index) => {
      console.log(`\nResposta ${index + 1}:`);
      console.log('URL:', response.url);
      console.log('Status:', response.status);
      
      if (response.body) {
        console.log('Total de registros:', Array.isArray(response.body) ? response.body.length : 'N/A');
        
        if (Array.isArray(response.body)) {
          console.log('\nPontos turísticos retornados:');
          response.body.forEach((point: any) => {
            console.log(`  - ${point.title} (${point.slug})`);
          });
        }
      }
    });
    
    console.log('\n========================\n');
  });
});

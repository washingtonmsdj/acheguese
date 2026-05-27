import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

test.describe('Debug - Query de Pontos Turísticos', () => {
  
  test('Verificar dados retornados pela API', async ({ page }) => {
    // Interceptar requisições para ver o que está sendo buscado
    const requests: any[] = [];
    
    page.on('request', request => {
      if (request.url().includes('tourist_points')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
      }
    });

    const responses: any[] = [];
    
    page.on('response', async response => {
      if (response.url().includes('tourist_points')) {
        try {
          const data = await response.json();
          responses.push({
            url: response.url(),
            status: response.status(),
            data: data
          });
        } catch (e) {
          // Ignorar erros de parsing
        }
      }
    });

    // Navegar para listagem
    await page.goto(`${BASE_URL}/pontos-turisticos/ba/salvador`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Aguardar queries

    console.log('\n=== REQUESTS ===');
    console.log(JSON.stringify(requests, null, 2));

    console.log('\n=== RESPONSES ===');
    console.log(JSON.stringify(responses, null, 2));

    // Verificar se há dados na página
    const pageContent = await page.content();
    const hasFarol = pageContent.includes('Farol da Barra');
    const hasPelourinho = pageContent.includes('Pelourinho');
    const hasShopping = pageContent.includes('Shopping da Bahia');

    console.log('\n=== CONTEÚDO DA PÁGINA ===');
    console.log('Farol da Barra:', hasFarol);
    console.log('Pelourinho:', hasPelourinho);
    console.log('Shopping da Bahia:', hasShopping);

    // Verificar se está usando mocks
    const usingMocks = pageContent.includes('Cristo Redentor') || pageContent.includes('Elevador Lacerda');
    console.log('Usando mocks:', usingMocks);
  });
});

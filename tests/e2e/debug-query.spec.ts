import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

type TouristPointRequestLog = {
  url: string;
  method: string;
  postData: string | null;
};

type TouristPointResponseLog = {
  url: string;
  status: number;
  data?: unknown;
  error?: string;
};

test.describe('Debug - Query de Pontos Turisticos', () => {
  test('verifica os dados retornados pela API', async ({ page }) => {
    const requests: TouristPointRequestLog[] = [];
    const responses: TouristPointResponseLog[] = [];

    page.on('request', (request) => {
      if (request.url().includes('tourist_points')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData(),
        });
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('tourist_points')) {
        try {
          const data = await response.json();
          responses.push({
            url: response.url(),
            status: response.status(),
            data,
          });
        } catch {
          responses.push({
            url: response.url(),
            status: response.status(),
            error: 'Nao foi possivel converter a resposta para JSON',
          });
        }
      }
    });

    await page.goto(`${BASE_URL}/pontos-turisticos/ba/salvador`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n=== REQUESTS ===');
    console.log(JSON.stringify(requests, null, 2));

    console.log('\n=== RESPONSES ===');
    console.log(JSON.stringify(responses, null, 2));

    const pageContent = await page.content();
    const hasFarol = pageContent.includes('Farol da Barra');
    const hasPelourinho = pageContent.includes('Pelourinho');
    const hasShopping = pageContent.includes('Shopping da Bahia');
    const usingMocks =
      pageContent.includes('Cristo Redentor') || pageContent.includes('Elevador Lacerda');

    console.log('\n=== CONTEUDO DA PAGINA ===');
    console.log('Farol da Barra:', hasFarol);
    console.log('Pelourinho:', hasPelourinho);
    console.log('Shopping da Bahia:', hasShopping);
    console.log('Usando mocks:', usingMocks);
  });
});

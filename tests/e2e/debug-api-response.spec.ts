import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

type ApiResponseLog = {
  url: string;
  status: number;
  body?: unknown;
  error?: string;
};

type TouristPointSummary = {
  title?: string;
  slug?: string;
};

function isTouristPointSummary(value: unknown): value is TouristPointSummary {
  return typeof value === 'object' && value !== null;
}

test.describe('Debug API Response', () => {
  test('verifica a resposta da API de listagem', async ({ page }) => {
    const apiResponses: ApiResponseLog[] = [];

    page.on('response', async (response) => {
      const url = response.url();

      if (url.includes('tourist_points') && url.includes('supabase')) {
        try {
          const body = await response.json();
          apiResponses.push({
            url,
            status: response.status(),
            body,
          });
        } catch {
          apiResponses.push({
            url,
            status: response.status(),
            error: 'Could not parse response',
          });
        }
      }
    });

    await page.goto(`${BASE_URL}/pontos-turisticos/ba/salvador`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n=== RESPOSTAS DA API ===');

    apiResponses.forEach((response, index) => {
      console.log(`\nResposta ${index + 1}:`);
      console.log('URL:', response.url);
      console.log('Status:', response.status);

      if (response.body) {
        console.log('Total de registros:', Array.isArray(response.body) ? response.body.length : 'N/A');

        if (Array.isArray(response.body)) {
          console.log('\nPontos turisticos retornados:');
          response.body.forEach((point) => {
            if (isTouristPointSummary(point)) {
              console.log(`  - ${point.title ?? 'sem titulo'} (${point.slug ?? 'sem slug'})`);
            }
          });
        }
      }
    });

    console.log('\n========================\n');
  });
});

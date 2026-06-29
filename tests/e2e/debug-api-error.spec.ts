import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

type ApiErrorLog = {
  url: string;
  status: number;
  body?: unknown;
  error?: string;
};

test.describe('Debug API Error', () => {
  test('captura erros 400 da API', async ({ page }) => {
    const apiErrors: ApiErrorLog[] = [];

    page.on('response', async (response) => {
      const url = response.url();

      if (url.includes('supabase') && response.status() === 400) {
        try {
          const body = await response.json();
          apiErrors.push({
            url,
            status: response.status(),
            body,
          });
        } catch {
          apiErrors.push({
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

    console.log('\n=== ERROS DA API ===');
    console.log(JSON.stringify(apiErrors, null, 2));
    console.log('===================\n');

    if (apiErrors.length > 0) {
      console.log(`\nForam capturados ${apiErrors.length} erro(s) 400\n`);

      apiErrors.forEach((error, index) => {
        console.log(`\nErro ${index + 1}:`);
        console.log('URL:', error.url);
        console.log('Status:', error.status);
        console.log('Body:', JSON.stringify(error.body, null, 2));
      });
    }
  });
});

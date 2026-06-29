import { test, expect } from '@playwright/test';

type SearchValidationRow = {
  query: string;
  intent: string;
  resultCount: number;
  titles: string[];
  urls: string[];
  openCheck: 'n/a' | 'ok' | 'failed';
};

test('buscar validation capture', async ({ page }) => {
  const queries = [
    'pizzaria barata com delivery',
    'restaurante aberto agora',
    'eletricista perto de mim',
    'encanador urgente',
    'empresa no meu bairro',
    'me conte uma piada',
  ];

  await page.goto('/buscar');

  const rows: SearchValidationRow[] = [];
  for (const query of queries) {
    await page.getByLabel('Busca inteligente').fill(query);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await page.waitForTimeout(1200);

    const intentLine = await page.locator('text=Intent:').first().textContent();
    const intentMatch = intentLine?.match(/Intent:\s*([a-z_]+)/i);
    const intent = (intentMatch?.[1] ?? 'unknown').toLowerCase();

    const titles = await page.locator('h2').allTextContents();
    const links = await page.locator('a[href]').all();
    const urls = [] as string[];
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href?.startsWith('/')) urls.push(href);
    }
    const dedupUrls = [...new Set(urls)];

    let openCheck = 'n/a';
    if (dedupUrls.length > 0) {
      await page.goto(dedupUrls[0]);
      const content = (await page.content()).toLowerCase();
      openCheck = content.includes('404') ? 'failed' : 'ok';
      await page.goto('/buscar');
    }

    rows.push({ query, intent, resultCount: titles.length, titles, urls: dedupUrls, openCheck });
  }

  console.log('BUSCAR_VALIDATION_RESULTS_START');
  console.log(JSON.stringify(rows, null, 2));
  console.log('BUSCAR_VALIDATION_RESULTS_END');

  expect(rows.length).toBe(6);
});

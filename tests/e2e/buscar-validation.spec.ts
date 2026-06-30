import { expect, test } from '@playwright/test';
import { expectRouteReady, openPublicRoute, readBodyText } from './support/publicRouteAssertions';

test.setTimeout(120_000);

const EXPECTED_GUIDANCE_PATTERNS = [
  /Não foi possível identificar seu bairro cadastrado/i,
  /não consegui encontrar/i,
  /tente buscar por/i,
] as const;

test.beforeAll(async ({ browser, baseURL }) => {
  const page = await browser.newPage();
  await page
    .goto(`${baseURL ?? ''}/buscar`, {
      timeout: 20_000,
      waitUntil: 'commit',
    })
    .catch(() => undefined);
  await page.waitForTimeout(1_000);
  await page.close();
});

test('buscar handles territorial guidance without hanging', async ({ page }) => {
  await openPublicRoute(page, '/buscar', { waitUntil: 'domcontentloaded', dismissConsent: true });
  await expectRouteReady(page, {
    expectedUrlPart: '/buscar',
    readyPattern: /Busca inteligente|Buscar|Achegue-se/i,
  });

  await page.getByLabel('Busca inteligente').fill('empresa no meu bairro');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect
    .poll(
      async () => {
        const body = await readBodyText(page);
        return EXPECTED_GUIDANCE_PATTERNS.some((pattern) => pattern.test(body));
      },
      { timeout: 20_000 },
    )
    .toBe(true);
});

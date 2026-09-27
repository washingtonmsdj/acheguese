import { expect, test } from '@playwright/test';
import {
  expectRouteReady,
  openPublicRoute,
  readBodyText,
  readCanonical,
  readRobots,
} from './support/publicRouteAssertions';

test.describe('territorial SEO policy', () => {
  test.setTimeout(180_000);

  test('public territorial pages render indexable content', async ({ page }) => {
    await openPublicRoute(page, '/ba/salvador/complexo-do-nordeste-de-amaralina', {
      waitUntil: 'domcontentloaded',
      dismissConsent: true,
    });

    await expectRouteReady(page, {
      expectedUrlPart: '/ba/salvador/complexo-do-nordeste-de-amaralina',
      readyPattern: /Complexo do Nordeste de Amaralina|Achegue-se|Empresas Locais/i,
    });

    await expect
      .poll(async () => (await readBodyText(page)).includes('Local não encontrado'), { timeout: 15_000 })
      .toBe(false);

    const robots = await readRobots(page);
    expect(robots ?? 'index, follow').not.toMatch(/noindex/i);
  });

  test('active Business module keeps the territory-first canonical URL', async ({ page }) => {
    await openPublicRoute(page, '/ba/salvador/empresas', {
      waitUntil: 'domcontentloaded',
      dismissConsent: true,
    });

    await expectRouteReady(page, {
      expectedUrlPart: '/ba/salvador/empresas',
      readyPattern: /Empresas|Salvador|Achegue-se/i,
    });

    const robots = await readRobots(page);
    expect(robots ?? 'index, follow').not.toMatch(/noindex/i);

    const canonical = await readCanonical(page);
    expect(canonical ?? '').toContain('/ba/salvador/empresas');
  });
});

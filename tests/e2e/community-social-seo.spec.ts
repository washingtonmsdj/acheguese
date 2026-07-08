import { expect, test } from '@playwright/test';
import { expectRouteReady, openPublicRoute, readCanonical, readRobots } from './support/publicRouteAssertions';

test.describe('community social SEO policy', () => {
  test.setTimeout(180_000);

  test('feed route resolves as noindex community portal surface', async ({ page }) => {
    await openPublicRoute(page, '/comunidade/ba/salvador/feed', {
      waitUntil: 'domcontentloaded',
      dismissConsent: true,
    });
    await expectRouteReady(page, {
      expectedUrlPart: '/comunidade/ba/salvador/feed',
      readyPattern: /Feed|Comunidade|Complexo do Nordeste|Salvador/i,
    });

    expect((await readRobots(page)) ?? '').toMatch(/noindex/i);
    expect((await readCanonical(page)) ?? '').toContain('/comunidade/ba/salvador/feed');
  });

  test('groups route resolves as noindex community portal surface', async ({ page }) => {
    await openPublicRoute(page, '/comunidade/ba/salvador/grupos', {
      waitUntil: 'domcontentloaded',
      dismissConsent: true,
    });
    await expectRouteReady(page, {
      expectedUrlPart: '/comunidade/ba/salvador/grupos',
      readyPattern: /Grupos|Comunidade|Complexo do Nordeste|Salvador/i,
    });

    expect((await readRobots(page)) ?? '').toMatch(/noindex/i);
    expect((await readCanonical(page)) ?? '').toContain('/comunidade/ba/salvador/grupos');
  });

  test('community-scoped business detail keeps public canonical and noindex', async ({ page }) => {
    await openPublicRoute(
      page,
      '/comunidade/complexo-do-nordeste-de-amaralina/empresas/tone-cos-loja',
      {
        waitUntil: 'domcontentloaded',
        dismissConsent: true,
      },
    );
    await expectRouteReady(page, {
      expectedUrlPart: '/comunidade/complexo-do-nordeste-de-amaralina/empresas/tone-cos-loja',
      readyPattern: /Tone|Empresa|Comercio|Comércio|Ver no site publico/i,
    });

    const publicEscapeHref = await page
      .getByRole('link', { name: 'Ver no site publico' })
      .first()
      .getAttribute('href');

    expect((await readRobots(page)) ?? '').toMatch(/noindex/i);
    expect(publicEscapeHref ?? '').toContain('/empresas/');
    expect(publicEscapeHref ?? '').not.toContain('/comunidade/');
    expect((await readCanonical(page)) ?? '').toContain(publicEscapeHref ?? '');
    await expect.poll(() => new URL(page.url()).pathname).toContain('/comunidade/');
  });
});

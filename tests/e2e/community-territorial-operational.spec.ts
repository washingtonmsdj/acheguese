import { expect, test } from '@playwright/test';
import { expectPausedLaunchSurface, expectRouteReady, openPublicRoute } from './support/publicRouteAssertions';
import { E2E_BUSINESS, installBusinessRouteFixtures } from './support/businessRouteFixtures';

test.describe('community territorial routes', () => {
  test.setTimeout(240_000);

  test('city-level community route resolves', async ({ page }) => {
    await openPublicRoute(page, '/comunidade/ba/salvador', { waitUntil: 'domcontentloaded', dismissConsent: true });
    await expectRouteReady(page, {
      expectedUrlPart: '/comunidade/',
      readyPattern: /Comunidade|Feed|Salvador/i,
    });
  });

  test('city feed and groups resolve', async ({ page }) => {
    await openPublicRoute(page, '/comunidade/ba/salvador/feed', {
      waitUntil: 'domcontentloaded',
      dismissConsent: true,
    });
    await expectRouteReady(page, {
      expectedUrlPart: '/comunidade/',
      readyPattern: /Feed|Comunidade|Salvador/i,
    });

    await openPublicRoute(page, '/comunidade/ba/salvador/grupos', {
      waitUntil: 'domcontentloaded',
      dismissConsent: true,
    });
    await expectRouteReady(page, {
      expectedUrlPart: '/comunidade/',
      readyPattern: /Grupos|Comunidade|Salvador/i,
    });
  });

  test('city social surfaces stay canonical', async ({ page }) => {
    await openPublicRoute(page, '/comunidade/ba/salvador/feed', {
      waitUntil: 'domcontentloaded',
      dismissConsent: true,
    });
    await expectRouteReady(page, {
      expectedUrlPart: '/comunidade/',
      readyPattern: /Feed|Comunidade|Salvador/i,
    });

    await openPublicRoute(page, '/comunidade/ba/salvador/grupos', {
      waitUntil: 'domcontentloaded',
      dismissConsent: true,
    });
    await expectRouteReady(page, {
      expectedUrlPart: '/comunidade/',
      readyPattern: /Grupos|Comunidade|Salvador/i,
    });
  });

  test('community sidebar hides paused education surface', async ({ page }) => {
    await openPublicRoute(page, '/comunidade/ba/salvador/feed', {
      waitUntil: 'domcontentloaded',
      dismissConsent: true,
    });
    await expectRouteReady(page, {
      expectedUrlPart: '/comunidade/',
      readyPattern: /Feed|Comunidade|Salvador/i,
    });

    const educationLink = page.locator('a[href="/educacao/ba/salvador"]').first();
    await expect(educationLink).toHaveCount(0);

    await expectPausedLaunchSurface(page, '/educacao/ba/salvador');
  });

  test('community-scoped business route keeps community context and public escape', async ({ page }) => {
    await installBusinessRouteFixtures(page);
    await openPublicRoute(page, E2E_BUSINESS.communityPath, {
      waitUntil: 'domcontentloaded',
      dismissConsent: true,
    });
    await expectRouteReady(page, {
      expectedUrlPart: E2E_BUSINESS.communityPath,
      readyPattern: /Tone|Empresa|Comercio|Comércio|Ver no site publico/i,
    });

    await expect(page.getByRole('link', { name: 'Ver no site publico' })).toBeVisible({
      timeout: 30_000,
    });
    await expect.poll(() => new URL(page.url()).pathname, { timeout: 15_000 }).toContain(
      '/comunidade/',
    );
  });
});

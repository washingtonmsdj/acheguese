import { expect, test } from '@playwright/test';
import { expectRouteReady, openPublicRoute, readBodyText } from './support/publicRouteAssertions';

test.describe('guide public smoke', () => {
  test.setTimeout(120_000);

  test('guide entry route does not render a blank shell', async ({ page }) => {
    await openPublicRoute(page, '/pontos-turisticos/ba/salvador', {
      waitUntil: 'domcontentloaded',
      timeoutMs: 90_000,
      dismissConsent: true,
    });

    await expectRouteReady(page, {
      expectedUrlPart: '/pontos-turisticos/ba/salvador',
      readyPattern: /Guia|Turismo|Achegue-se|Pontos/i,
      timeoutMs: 60_000,
    });
    await expect.poll(() => readBodyText(page), { timeout: 15_000 }).not.toMatch(/404|not found/i);
  });
});

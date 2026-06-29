import { expect, test, type Page } from '@playwright/test';
import { loginAsUser } from '../../../e2e/helpers/auth';
import { expectPausedLaunchSurface, openPublicRoute } from '../support/publicRouteAssertions';

async function expectOperationalRoute(page: Page, path: string, expected: RegExp) {
  await openPublicRoute(page, path, { waitUntil: 'domcontentloaded', dismissConsent: true });

  await expect
    .poll(
      () =>
        page.evaluate(() => ({
          hasMain: Boolean(document.querySelector('main')),
          textLength: document.body.innerText.trim().length,
        })),
      { timeout: 45_000 },
    )
    .toMatchObject({ hasMain: true });

  expect(new URL(page.url()).pathname).toMatch(expected);
}

test.describe('central canonical routes', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('central remains canonical and paused mobility routes stay isolated', async ({ page }) => {
    await expectOperationalRoute(page, '/central', /^\/central/);
    await expectPausedLaunchSurface(page, '/central/motorista/corridas');
    await expectPausedLaunchSurface(page, '/central/motoboy/entregas');
  });

  test('legacy create-driver route stays isolated while mobility is paused', async ({ page }) => {
    await expectPausedLaunchSurface(page, '/create-driver');
  });
});

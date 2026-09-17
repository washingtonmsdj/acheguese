import { expect, test } from '@playwright/test';
import { expectPausedLaunchSurface } from '../support/publicRouteAssertions';
import { expectPrivateRouteReady, loginAsUserWithRetry } from '../support/privateRouteAssertions';

test('Central pede login antes de mostrar o workspace', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/central', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.locator('main#main-content')).toBeVisible();
  const viewport = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth + 1);
});

test.describe('central canonical routes', () => {
  test.setTimeout(180_000);

  test.skip(
    !process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD,
    'Central autenticada exige E2E_USER_EMAIL/E2E_USER_PASSWORD; nenhum segredo padrão é inventado.',
  );

  test.beforeEach(async ({ page }) => {
    await loginAsUserWithRetry(page);
  });

  test('central remains canonical and paused mobility routes stay isolated', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expectPrivateRouteReady(page, {
      path: '/central',
      expectedUrlPattern: /^.*\/central(?:\?|$)/i,
    });
    await expect(page.locator('[data-layout-shell="workspace"]')).toBeVisible();
    await expect(page.locator('[data-bottom-nav-item="comunidade"]')).toBeVisible();
    await expect(page.locator('[data-responsive-page-frame="standard"]')).toBeVisible();
    const mobileWidth = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(mobileWidth.scrollWidth).toBeLessThanOrEqual(mobileWidth.clientWidth + 1);

    await page.setViewportSize({ width: 1440, height: 1000 });
    const desktopWidth = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(desktopWidth.scrollWidth).toBeLessThanOrEqual(desktopWidth.clientWidth + 1);
    await expectPausedLaunchSurface(page, '/central/motorista/corridas');
    await expectPausedLaunchSurface(page, '/central/motoboy/entregas');
  });
});

import { expect, test, type Page } from '@playwright/test';
import { loginAsUser } from '../../e2e/helpers/auth';

const MOBILE_VIEWPORT = { width: 360, height: 800 };
test.setTimeout(120_000);

async function loginWithRetry(page: Page) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await loginAsUser(page);
      return;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
      await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => undefined);
    }
  }
}

async function expectNoHorizontalOverflow(page: Page) {
  const viewport = page.viewportSize();
  const maxAllowed = (viewport?.width ?? MOBILE_VIEWPORT.width) + 2;

  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const html = document.documentElement;
          const body = document.body;
          return Math.max(html?.scrollWidth ?? 0, body?.scrollWidth ?? 0);
        }),
      { timeout: 20_000 },
    )
    .toBeLessThanOrEqual(maxAllowed);
}

async function expectMainContent(page: Page) {
  await expect
    .poll(
      async () => {
        const mainVisible = await page.locator('main').first().isVisible().catch(() => false);
        const hasText = await page
          .evaluate(() => (document.body?.innerText ?? '').trim().length > 80)
          .catch(() => false);
        return mainVisible || hasText;
      },
      { timeout: 30_000 },
    )
    .toBe(true);
}

async function openAndAssertMobileDashboard(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await expectMainContent(page);
  await expectNoHorizontalOverflow(page);
}

test.describe('Mobile authenticated dashboards', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await loginWithRetry(page);
  });

  test('central home em 360px', async ({ page }) => {
    await openAndAssertMobileDashboard(page, '/central');
    await expect(page).toHaveURL(/\/central(\?|$)/i);
  });

  test('central empresas em 360px', async ({ page }) => {
    await openAndAssertMobileDashboard(page, '/central/empresas');
    await expect(page).toHaveURL(/\/central\/empresas(\?|$)/i);
  });

  test('central motorista corridas em 360px', async ({ page }) => {
    await openAndAssertMobileDashboard(page, '/central/motorista/corridas');
    await expect(page).toHaveURL(/\/central\/motorista\/corridas(\?|$)/i);
  });

  test('central motoboy entregas em 360px', async ({ page }) => {
    await openAndAssertMobileDashboard(page, '/central/motoboy/entregas');
    await expect(page).toHaveURL(/\/central\/motoboy\/(entregas|cadastro)(\?|$)/i);
  });

  test('conta seguranca em 360px', async ({ page }) => {
    await openAndAssertMobileDashboard(page, '/conta/seguranca');
    await expect(page).toHaveURL(/\/conta\/seguranca(\?|$)/i);
  });

  test('conta enderecos em 360px', async ({ page }) => {
    await openAndAssertMobileDashboard(page, '/conta/enderecos');
    await expect(page).toHaveURL(/\/conta\/enderecos(\?|$)/i);
  });

  test('conta preferencias em 360px', async ({ page }) => {
    await openAndAssertMobileDashboard(page, '/conta/preferencias');
    await expect(page).toHaveURL(/\/conta\/preferencias(\?|$)/i);
  });

  test('conta notificacoes em 360px', async ({ page }) => {
    await openAndAssertMobileDashboard(page, '/conta/notificacoes');
    await expect(page).toHaveURL(/\/conta\/notificacoes(\?|$)/i);
  });

  test('conta privacidade em 360px', async ({ page }) => {
    await openAndAssertMobileDashboard(page, '/conta/privacidade');
    await expect(page).toHaveURL(/\/conta\/privacidade(\?|$)/i);
  });

  test('conta perfil configuracoes em 360px', async ({ page }) => {
    await openAndAssertMobileDashboard(page, '/conta/perfil/configuracoes?tab=links');
    await expect(page).toHaveURL(/\/conta\/perfil\/configuracoes\?tab=links$/i);
  });

  test('legacy conta preferencias tab redireciona em 360px', async ({ page }) => {
    await openAndAssertMobileDashboard(page, '/conta/preferencias?tab=privacy');
    await expect(page).toHaveURL(/\/conta\/perfil\/configuracoes(\?|$)/i);
  });
});

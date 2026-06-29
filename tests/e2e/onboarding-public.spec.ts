import { expect, test } from '@playwright/test';
import {
  expectRouteReady,
  hasMainLandmark,
  openPublicRoute,
  readTitle,
} from './support/publicRouteAssertions';

test.describe('public onboarding routes', () => {
  test.setTimeout(120_000);

  test.beforeAll(async ({ browser, baseURL }) => {
    const page = await browser.newPage();
    await page
      .goto(`${baseURL ?? ''}/cadastro/confirmacao`, {
        timeout: 15_000,
        waitUntil: 'commit',
      })
      .catch(() => undefined);
    await page.waitForTimeout(20_000);
    await page.close();
  });

  test('signup confirmation route keeps brand copy and accessible main content', async ({ page }) => {
    await openPublicRoute(page, '/cadastro/confirmacao', {
      timeoutMs: 15_000,
      waitUntil: 'domcontentloaded',
      dismissConsent: true,
    });
    await expectRouteReady(page, {
      expectedUrlPart: '/cadastro/confirmacao',
      readyPattern: /Confirme seu email|Procure o email do Achegue-se/i,
      mainSelector: 'main#main-content',
    });
    await expect.poll(() => hasMainLandmark(page, 'main#main-content'), { timeout: 30_000 }).toBe(true);
  });

  test('signup route uses the product brand and resolves beyond the global suspense loader', async ({ page }) => {
    await openPublicRoute(page, '/cadastro/confirmacao', {
      timeoutMs: 15_000,
      waitUntil: 'domcontentloaded',
      dismissConsent: true,
    });
    await expectRouteReady(page, {
      expectedUrlPart: '/cadastro/confirmacao',
      readyPattern: /Confirme seu email|Procure o email do Achegue-se/i,
      mainSelector: 'main#main-content',
    });

    await openPublicRoute(page, '/cadastro', {
      timeoutMs: 15_000,
      waitUntil: 'domcontentloaded',
      dismissConsent: true,
    });
    await expectRouteReady(page, {
      expectedUrlPart: '/cadastro',
      readyPattern: /Achegue-se|Crie sua conta/i,
      mainSelector: 'main#main-content',
    });
    await expect.poll(() => readTitle(page), { timeout: 30_000 }).toBe('Criar conta | Achegue-se');
  });

  test('login route exposes branded title and accessible main landmark', async ({ page }) => {
    await openPublicRoute(page, '/login', {
      timeoutMs: 15_000,
      waitUntil: 'domcontentloaded',
      dismissConsent: true,
    });
    await expectRouteReady(page, {
      expectedUrlPart: '/login',
      readyPattern: /Bem-vindo de volta|Entrar/i,
      mainSelector: 'main#main-content',
    });
    await expect.poll(() => hasMainLandmark(page, 'main#main-content'), { timeout: 30_000 }).toBe(true);
    await expect.poll(() => readTitle(page), { timeout: 30_000 }).toBe('Entrar | Achegue-se');
  });
});

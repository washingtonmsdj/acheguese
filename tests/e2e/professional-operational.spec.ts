import { expect, test } from '@playwright/test';
import { expectRouteReady, openPublicRoute, readTitle } from './support/publicRouteAssertions';

test.describe('professional operational routes', () => {
  test.setTimeout(150_000);

  test('tracking route does not stay stuck on the global suspense loader', async ({ page }) => {
    await openPublicRoute(page, '/servicos', {
      timeoutMs: 15_000,
      waitUntil: 'domcontentloaded',
      dismissConsent: true,
    });
    await expectRouteReady(page, {
      expectedUrlPart: '/servicos',
      readyPattern: /Serviços|Servicos|Profissional|Eletricista/i,
    });
    await expect.poll(() => readTitle(page), { timeout: 30_000 }).toBe('Serviços locais | Achegue-se');

    await openPublicRoute(page, '/servicos/orcamentos/fake-lead-id', {
      timeoutMs: 15_000,
      waitUntil: 'domcontentloaded',
      dismissConsent: true,
    });
    await expectRouteReady(page, {
      expectedUrlPart: '/servicos/orcamentos/fake-lead-id',
      readyPattern: /Acompanhar or[cç]amento|Or[cç]amento n[aã]o encontrado|Entre na sua conta/i,
    });
  });

  test('services landing route resolves beyond the global suspense loader', async ({ page }) => {
    await openPublicRoute(page, '/servicos', {
      timeoutMs: 15_000,
      waitUntil: 'domcontentloaded',
      dismissConsent: true,
    });
    await expectRouteReady(page, {
      expectedUrlPart: '/servicos',
      readyPattern: /Serviços|Servicos|Profissional|Eletricista/i,
    });
    await expect.poll(() => readTitle(page), { timeout: 30_000 }).toBe('Serviços locais | Achegue-se');
  });
});

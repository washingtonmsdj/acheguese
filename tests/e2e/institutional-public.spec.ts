import { expect, test } from '@playwright/test';
import { expectRouteReady, hasMainLandmark, openPublicRoute, readBodyText } from './support/publicRouteAssertions';

test.describe('institutional public routes', () => {
  test.setTimeout(120_000);

  for (const route of [
    { path: '/sobre', expected: /Sobre o Achegue-se/i },
    { path: '/contato', expected: /Entre em Contato|Achegue-se/i },
    { path: '/termos', expected: /Termos de uso|Regras contratuais para uso do Achegue-se/i },
    { path: '/regras', expected: /Regras da comunidade|Regras para manter a comunidade util e segura/i },
    { path: '/privacidade', expected: /Politica de privacidade|Como o Achegue-se trata dados pessoais/i },
    { path: '/dpo', expected: /Contato com o encarregado de dados|Solicite acesso, correcao, exclusao ou reporte uma violacao/i },
  ]) {
    test(`${route.path} exposes canonical brand and accessible main content`, async ({ page }) => {
      await openPublicRoute(page, route.path);

      await expectRouteReady(page, {
        expectedUrlPart: route.path,
        readyPattern: route.expected,
        mainSelector: 'main#main-content',
      });
      await expect.poll(() => hasMainLandmark(page, 'main#main-content'), { timeout: 30_000 }).toBe(true);
      await expect
        .poll(async () => (await readBodyText(page)).includes('Comunidade Conectada'), { timeout: 15_000 })
        .toBe(false);
    });
  }
});

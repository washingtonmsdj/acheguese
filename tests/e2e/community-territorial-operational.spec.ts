import { test } from '@playwright/test';
import { expectNotFoundPublicRoute } from './support/publicRouteAssertions';

test.describe('community territorial routes', () => {
  test.setTimeout(180_000);

  test('keeps the paused Community tree outside the active public router', async ({ page }) => {
    for (const path of [
      '/comunidade/ba/salvador',
      '/comunidade/ba/salvador/feed',
      '/comunidade/ba/salvador/grupos',
      '/comunidade/ba/salvador/problemas',
      '/comunidade/ba/salvador/comunicacao',
      '/comunidade/ba/salvador/empresas',
      '/educacao/ba/salvador',
    ]) {
      await expectNotFoundPublicRoute(page, path);
    }
  });
});

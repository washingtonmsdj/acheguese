import { expect, test } from '@playwright/test';
import { expectNotFoundPublicRoute } from './support/publicRouteAssertions';

test.describe('public launch scope', () => {
  test.setTimeout(180_000);

  test('global post-MVP routes fall through to the canonical 404', async ({ page }) => {
    for (const path of [
      '/gastronomia',
      '/servicos',
      '/classificados',
      '/recomendacoes',
      '/vagas',
      '/eventos',
      '/educacao',
      '/comunicacao',
      '/cupons',
      '/analytics',
      '/mobilidade',
      '/ranking',
      '/alertas',
      '/problemas',
      '/achados-perdidos',
    ]) {
      await expectNotFoundPublicRoute(page, path);
    }
  });

  test('Search remains active without reactivating paused domains', async ({ page }) => {
    await page.goto('/busca');
    await expect(page.getByRole('heading', { name: 'Busca', exact: true })).toBeVisible();
    await expect(page.getByText('Serviços', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Classificados', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Eventos', { exact: true })).toHaveCount(0);

    await page.goto('/buscar');
    await expect(page.getByRole('heading', { name: 'Procurar no bairro' })).toBeVisible();
  });

  test('territorial post-MVP routes fall through before loading domain data', async ({ page }) => {
    for (const path of [
      '/gastronomia/ba/salvador',
      '/servicos/ba/salvador',
      '/classificados/ba/salvador',
      '/vagas/ba/salvador',
      '/pontos-turisticos/ba/salvador',
      '/educacao/ba/salvador',
      '/comunicacao/ba/salvador',
      '/comunidade/ba/salvador',
      '/comunidade/ba/salvador/gastronomia',
      '/comunidade/ba/salvador/servicos',
      '/comunidade/ba/salvador/classificados',
      '/comunidade/ba/salvador/eventos',
      '/comunidade/ba/salvador/vagas',
      '/comunidade/ba/salvador/educacao',
      '/comunidade/ba/salvador/mobilidade',
    ]) {
      await expectNotFoundPublicRoute(page, path);
    }
  });
});

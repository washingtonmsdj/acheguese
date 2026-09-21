import { test } from '@playwright/test';
import { expectPausedLaunchSurface } from './support/publicRouteAssertions';

test.describe('public launch scope', () => {
  test.setTimeout(180_000);

  test('global post-MVP routes render the launch isolation page', async ({ page }) => {
    for (const path of [
      '/gastronomia',
      '/servicos',
      '/classificados',
      '/recomendacoes',
      '/vagas',
      '/eventos',
      '/mensagens',
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
      await expectPausedLaunchSurface(page, path);
    }
  });

  test('territorial post-MVP routes isolate before loading domain data', async ({ page }) => {
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
      await expectPausedLaunchSurface(page, path);
    }
  });
});

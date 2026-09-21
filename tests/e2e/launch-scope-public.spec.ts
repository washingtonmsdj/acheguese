import { test } from '@playwright/test';
import { expectPausedLaunchSurface } from './support/publicRouteAssertions';

test.describe('public launch scope', () => {
  test.setTimeout(180_000);

  test('global paused routes render the launch isolation page', async ({ page }) => {
    for (const path of [
      '/gastronomia',
      '/servicos',
      '/mapa',
      '/perto-de-mim',
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

  test('territorial paused routes render before resolving territory data', async ({ page }) => {
    for (const path of [
      '/gastronomia/ba/salvador',
      '/servicos/ba/salvador',
      '/mapa/ba/salvador',
      '/vagas/ba/salvador',
      '/pontos-turisticos/ba/salvador',
      '/educacao/ba/salvador',
      '/comunicacao/ba/salvador',
      '/comunidade/ba/salvador/gastronomia',
      '/comunidade/ba/salvador/servicos',
      '/comunidade/ba/salvador/mapa',
      '/comunidade/ba/salvador/eventos',
      '/comunidade/ba/salvador/vagas',
      '/comunidade/ba/salvador/educacao',
      '/comunidade/ba/salvador/mobilidade',
      '/comunidade/ba/salvador/problemas',
      '/comunidade/ba/salvador/achados-e-perdidos',
      '/comunidade/ba/salvador/comunicacao',
    ]) {
      await expectPausedLaunchSurface(page, path);
    }
  });
});

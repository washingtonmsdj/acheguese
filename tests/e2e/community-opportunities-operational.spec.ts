import { expect, test, type Page } from '@playwright/test';
import {
  expectPausedLaunchSurface,
  expectRouteReady,
  openPublicRoute,
  readBodyText,
  readRobots,
} from './support/publicRouteAssertions';

const JOBS_RUNTIME_COPY =
  /Oportunidades perto de voc|Circula(?:Ã§|ç)(?:Ã£|ã)o profissional local|Publicar vaga|Candidatar-se|Vagas em destaque|Vagas urgentes/i;

async function expectJobsLaunchPaused(page: Page, path: string) {
  await expectPausedLaunchSurface(page, path);

  await expect
    .poll(() => readBodyText(page), { timeout: 15_000 })
    .not.toMatch(JOBS_RUNTIME_COPY);
}

test.describe('community opportunities public surface', () => {
  test.setTimeout(180_000);

  test('global jobs and quick opportunities entrypoints stay launch-isolated', async ({ page }) => {
    for (const path of [
      '/vagas',
      '/vagas/publicar',
      '/oportunidades',
      '/oportunidades/oportunidade-demo',
    ]) {
      await expectJobsLaunchPaused(page, path);
    }
  });

  test('territorial jobs listing and detail routes stay launch-isolated', async ({ page }) => {
    for (const path of [
      '/vagas/ba/salvador',
      '/vagas/ba/salvador/nordeste-de-amaralina',
      '/vagas/ba/salvador/analista-de-suporte',
    ]) {
      await expectJobsLaunchPaused(page, path);
    }
  });

  test('community-scoped jobs routes stay launch-isolated', async ({ page }) => {
    for (const path of [
      '/comunidade/ba/salvador/vagas',
      '/comunidade/ba/salvador/vagas/publicar',
      '/comunidade/ba/salvador/nordeste-de-amaralina/vagas',
      '/comunidade/ba/salvador/nordeste-de-amaralina/vagas/publicar',
      '/comunidade/complexo-do-nordeste-de-amaralina/vagas',
      '/comunidade/complexo-do-nordeste-de-amaralina/vagas/publicar',
    ]) {
      await expectJobsLaunchPaused(page, path);
    }
  });

  test('paused opportunities tab falls back to the community surface', async ({ page }) => {
    await openPublicRoute(page, '/comunidade/ba/salvador/feed?tab=oportunidades', {
      waitUntil: 'domcontentloaded',
      dismissConsent: true,
    });

    await expectRouteReady(page, {
      expectedUrlPart: '/comunidade/ba/salvador/feed',
      readyPattern: /Feed|Comunidade|Complexo|Salvador/i,
    });

    await expect
      .poll(() => readBodyText(page), { timeout: 60_000 })
      .not.toMatch(/Publicar vaga|Vagas proximas|Vagas próximas/i);

    expect((await readRobots(page)) ?? '').toMatch(/noindex/i);
  });
});

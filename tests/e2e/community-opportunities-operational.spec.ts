import { test, type Page } from '@playwright/test';
import {
  expectNotFoundPublicRoute,
  readBodyText,
} from './support/publicRouteAssertions';

const JOBS_RUNTIME_COPY =
  /Oportunidades perto de voc|Circula(?:Ã§|ç)(?:Ã£|ã)o profissional local|Publicar vaga|Candidatar-se|Vagas em destaque|Vagas urgentes/i;

async function expectJobsUnavailable(page: Page, path: string) {
  await expectNotFoundPublicRoute(page, path);

  const body = await readBodyText(page);
  if (JOBS_RUNTIME_COPY.test(body)) {
    throw new Error(`Paused Jobs runtime leaked into ${path}`);
  }
}

test.describe('community opportunities public surface', () => {
  test.setTimeout(180_000);

  test('global jobs and opportunities entrypoints stay outside the MVP router', async ({ page }) => {
    for (const path of [
      '/vagas',
      '/vagas/publicar',
      '/oportunidades',
      '/oportunidades/oportunidade-demo',
    ]) {
      await expectJobsUnavailable(page, path);
    }
  });

  test('territorial jobs routes stay outside the MVP router', async ({ page }) => {
    for (const path of [
      '/vagas/ba/salvador',
      '/vagas/ba/salvador/nordeste-de-amaralina',
      '/vagas/ba/salvador/analista-de-suporte',
      '/comunidade/ba/salvador/vagas',
      '/comunidade/ba/salvador/vagas/publicar',
    ]) {
      await expectJobsUnavailable(page, path);
    }
  });
});

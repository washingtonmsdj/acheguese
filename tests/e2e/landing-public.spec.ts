import { expect, test, type Page } from '@playwright/test';

async function openPublicRoute(page: Page, path: string) {
  await page.goto(path, {
    timeout: 30_000,
    waitUntil: 'commit',
  });
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => undefined);
}

async function readBodyText(page: Page) {
  return page.locator('body').innerText().catch(() => '');
}

async function readTitle(page: Page) {
  return page.title().catch(() => '');
}

test.describe('public landing routes', () => {
  test.setTimeout(120_000);

  test('home route renders the Complexo-first positioning', async ({ page }) => {
    await openPublicRoute(page, '/');

    await expect
      .poll(() => readBodyText(page), { timeout: 60_000 })
      .toMatch(/Achegue-se|Entrar no Meu Bairro|O Achegue-se começa pelo Complexo/i);
    await expect
      .poll(async () => (await readBodyText(page)).includes('Preparando a casa para você se achegar'), {
        timeout: 30_000,
      })
      .toBe(false);
    await expect
      .poll(() => readTitle(page), { timeout: 30_000 })
      .toBe('Achegue-se - Comunidade hiperlocal');
  });

  test("home CTA 'Ver meu bairro' opens a city-level community route", async ({ page }) => {
    test.setTimeout(60_000);
    await openPublicRoute(page, '/');

    const neighborhoodButton = page.getByRole('button', { name: /Ver meu bairro/i }).first();
    await expect(neighborhoodButton).toBeVisible({ timeout: 30_000 });
    await Promise.all([
      page.waitForURL(/\/comunidade\/[a-z]{2}\/[^/?#]+/i, { timeout: 15_000 }),
      neighborhoodButton.click(),
    ]);

    const path = new URL(page.url()).pathname;
    const segments = path.split('/').filter(Boolean);
    expect(segments.length).toBeGreaterThanOrEqual(3);
    expect(segments[0]).toBe('comunidade');
  });

  test('complexo short route remains direct entry without redirect', async ({ page }) => {
    await openPublicRoute(page, '/complexo');

    await expect
      .poll(() => page.url(), { timeout: 30_000 })
      .toContain('/complexo');
    await expect
      .poll(() => readBodyText(page), { timeout: 60_000 })
      .toMatch(/Complexo do Nordeste de Amaralina|Entrar na Comunidade|Empresas Locais/i);
    await expect
      .poll(async () => (await readBodyText(page)).includes('Estado não encontrado'), {
        timeout: 15_000,
      })
      .toBe(false);
    await expect
      .poll(() => readTitle(page), { timeout: 30_000 })
      .toBe('Achegue-se - Comunidade hiperlocal');
  });

  test('businesses and services root routes expose branded SEO and main content', async ({ page }) => {
    await openPublicRoute(page, '/empresas');

    await expect
      .poll(() => readBodyText(page), { timeout: 60_000 })
      .toMatch(/Empresas|Cadastrar Empresa|Localiza/i);
    await expect
      .poll(async () => (await readBodyText(page)).includes('Preparando a casa para você se achegar'), {
        timeout: 30_000,
      })
      .toBe(false);
    await expect.poll(() => readTitle(page), { timeout: 30_000 }).toBe('Empresas locais | Achegue-se');

    await openPublicRoute(page, '/servicos');

    await expect
      .poll(() => readBodyText(page), { timeout: 60_000 })
      .toMatch(/Serviços|Servicos|Profissional|Eletricista/i);
    await expect
      .poll(async () => (await readBodyText(page)).includes('Preparando a casa para você se achegar'), {
        timeout: 30_000,
      })
      .toBe(false);
    await expect.poll(() => readTitle(page), { timeout: 30_000 }).toBe('Servicos locais | Achegue-se');
  });

  test('territorial business and services module routes use Salvador in SEO titles', async ({ page }) => {
    await openPublicRoute(page, '/empresas/ba/salvador/complexo-do-nordeste-de-amaralina');

    await expect
      .poll(() => readBodyText(page), { timeout: 60_000 })
      .toMatch(/Complexo do Nordeste de Amaralina|Empresas/i);
    await expect
      .poll(() => readTitle(page), { timeout: 30_000 })
      .toBe('Achegue-se Complexo do Nordeste de Amaralina | Empresas em Salvador');

    await openPublicRoute(page, '/servicos/ba/salvador/complexo-do-nordeste-de-amaralina');

    await expect
      .poll(() => readBodyText(page), { timeout: 60_000 })
      .toMatch(/Serviços|Servicos|Complexo do Nordeste de Amaralina|Profissional/i);
    await expect
      .poll(() => readTitle(page), { timeout: 30_000 })
      .toBe('Achegue-se Complexo do Nordeste de Amaralina | Serviços em Salvador');
  });

  test('canonical territorial area routes render city, district, modules and community cockpit', async ({ page }) => {
    const routes = [
      { path: '/ba/salvador', text: /Salvador|Achegue-se/i },
      { path: '/ba/salvador/nordeste-de-amaralina', text: /Nordeste de Amaralina|Achegue-se/i },
      { path: '/ba/salvador/complexo-do-nordeste-de-amaralina', text: /Complexo do Nordeste de Amaralina|Empresas Locais/i },
      { path: '/empresas/ba/salvador', text: /Empresas|Salvador/i },
      { path: '/empresas/ba/salvador/nordeste-de-amaralina', text: /Empresas|Nordeste de Amaralina/i },
      { path: '/empresas/ba/salvador/complexo-do-nordeste-de-amaralina', text: /Empresas|Complexo do Nordeste de Amaralina/i },
      { path: '/educacao/ba/salvador', text: /Educação|Educacao|Salvador/i },
      { path: '/educacao/ba/salvador/complexo-do-nordeste-de-amaralina', text: /Educação|Educacao|Complexo do Nordeste de Amaralina/i },
      { path: '/comunidade/ba/salvador/feed', text: /Feed|Comunidade|Salvador/i },
      { path: '/comunidade/ba/salvador/grupos', text: /Grupos|Comunidade|Salvador/i },
    ];

    for (const route of routes) {
      await openPublicRoute(page, route.path);
      await expect
        .poll(() => readBodyText(page), { timeout: 60_000 })
        .toMatch(route.text);
      await expect
        .poll(async () => (await readBodyText(page)).includes('Local não encontrado'), {
          timeout: 15_000,
        })
        .toBe(false);
    }
  });
});

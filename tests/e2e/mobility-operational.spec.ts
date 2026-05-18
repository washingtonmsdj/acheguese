import { expect, test } from '@playwright/test';
import { loginAsUser } from '../../e2e/helpers/auth';

test.setTimeout(90_000);

async function waitForCoreLayout(page: import('@playwright/test').Page) {
  await expect
    .poll(
      async () => {
        const mainVisible = await page.locator('main').first().isVisible().catch(() => false);
        const hasText = await page
          .evaluate(() => (document.body?.innerText ?? '').trim().length > 80)
          .catch(() => false);
        return mainVisible || hasText;
      },
      { timeout: 30_000 },
    )
    .toBe(true);
}

async function recoverFromGlobalErrorBoundary(page: import('@playwright/test').Page) {
  const boundaryHeading = page.getByRole('heading', { name: /oops! algo deu errado/i });
  const reloadButton = page.getByRole('button', { name: /recarregar/i });

  if (await boundaryHeading.isVisible().catch(() => false)) {
    if (await reloadButton.isVisible().catch(() => false)) {
      await reloadButton.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
    }
  }

  await expect(boundaryHeading).toHaveCount(0, { timeout: 15_000 });
}

test.describe('Mobility operational authenticated flow', () => {
  test('motorista acessa corridas da central com fluxo estavel', async ({ page }) => {
    await loginAsUser(page);

    await page.goto('/central/motorista/corridas', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });

    await waitForCoreLayout(page);

    await expect
      .poll(
        async () => {
          const text = await page
            .evaluate(() => (document.body?.innerText ?? '').toLowerCase())
            .catch(() => '');
          return !text.includes('preparando a casa para voce se achegar');
        },
        { timeout: 30_000 },
      )
      .toBe(true);

    await expect(page).toHaveURL(/\/central\/motorista\/corridas(\?|$)/i);

    await expect(
      page
        .getByText(/corridas|motorista|nenhuma corrida|disponibilidade|ganhos/i)
        .first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('motoboy acessa entregas com fluxo operacional ou onboarding canonico', async ({
    page,
  }) => {
    await loginAsUser(page);

    await page.goto('/central/motoboy/entregas', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await recoverFromGlobalErrorBoundary(page);

    await waitForCoreLayout(page);

    await expect
      .poll(
        async () => {
          const text = await page
            .evaluate(() => (document.body?.innerText ?? '').toLowerCase())
            .catch(() => '');
          return !text.includes('verificando perfil de motoboy');
        },
        { timeout: 60_000 },
      )
      .toBe(true);

    const hasOperationalLayout = await page
      .getByText(/entregas em andamento|pedidos de entrega disponiveis|modo motoboy/i)
      .first()
      .isVisible()
      .catch(() => false);

    if (hasOperationalLayout) {
      await expect(
        page
          .getByText(/entregas em andamento|pedidos de entrega disponiveis|nenhuma entrega/i)
          .first(),
      ).toBeVisible({ timeout: 20_000 });
      return;
    }

    const onboardingCta = page.locator('main').getByRole('button', {
      name: /cadastrar como motoboy/i,
    });
    const onboardingHeading = page.getByRole('heading', { name: /motoboy/i });

    await expect(onboardingHeading.or(onboardingCta).first()).toBeVisible({ timeout: 20_000 });

    if (await onboardingCta.isVisible().catch(() => false)) {
      await onboardingCta.click();
      await expect(page).toHaveURL(/\/central\/motoboy\/cadastro(\?|$)/i, { timeout: 20_000 });
    }
  });
});

import { expect, test, type Page } from "@playwright/test";
import { loginAsUser } from "../../e2e/helpers/auth";

test.setTimeout(90_000);

async function getNormalizedBodyText(page: Page): Promise<string> {
  return page
    .evaluate(() =>
      (document.body?.innerText ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase(),
    )
    .catch(() => "");
}

async function waitForCoreLayout(page: Page) {
  await expect
    .poll(
      async () => {
        const mainVisible = await page
          .locator("main")
          .first()
          .isVisible()
          .catch(() => false);
        const hasText = await page
          .evaluate(() => (document.body?.innerText ?? "").trim().length > 80)
          .catch(() => false);
        return mainVisible || hasText;
      },
      { timeout: 30_000 },
    )
    .toBe(true);
}

async function recoverFromGlobalErrorBoundary(page: Page) {
  const boundaryHeading = page.getByRole("heading", {
    name: /oops! algo deu errado/i,
  });
  const reloadButton = page.getByRole("button", { name: /recarregar/i });

  if (await boundaryHeading.isVisible().catch(() => false)) {
    if (await reloadButton.isVisible().catch(() => false)) {
      await reloadButton.click();
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1000);
    }
  }

  await expect(boundaryHeading).toHaveCount(0, { timeout: 15_000 });
}

async function isMobilityLaunchPaused(page: Page): Promise<boolean> {
  const text = await getNormalizedBodyText(page);
  return text.includes("mobilidade") && text.includes("separado para ajustes");
}

async function expectMobilityLaunchPaused(page: Page) {
  const text = await getNormalizedBodyText(page);

  expect(text).toContain("mobilidade");
  expect(text.includes("ajustes") || text.includes("mvp")).toBe(true);
}

async function resolveMobilitySurfaceState(
  page: Page,
): Promise<"paused" | "operational" | "onboarding" | ""> {
  const text = await getNormalizedBodyText(page);

  if (
    text.includes("mobilidade") &&
    (text.includes("ajustes") || text.includes("mvp"))
  ) {
    return "paused";
  }

  if (
    text.includes("entregas em andamento") ||
    text.includes("pedidos de entrega disponiveis") ||
    text.includes("modo motoboy") ||
    text.includes("nenhuma corrida") ||
    text.includes("disponibilidade") ||
    text.includes("ganhos")
  ) {
    return "operational";
  }

  if (
    text.includes("cadastrar como motoboy") ||
    text.includes("perfil de motoboy")
  ) {
    return "onboarding";
  }

  return "";
}

test.describe("Mobility operational authenticated flow", () => {
  test("motorista acessa corridas da central com fluxo estavel", async ({
    page,
  }) => {
    await loginAsUser(page);

    await page.goto("/central/motorista/corridas", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    await waitForCoreLayout(page);

    await expect
      .poll(
        async () => {
          const text = await page
            .evaluate(() => (document.body?.innerText ?? "").toLowerCase())
            .catch(() => "");
          return !text.includes("preparando a casa para voce se achegar");
        },
        { timeout: 30_000 },
      )
      .toBe(true);

    await expect(page).toHaveURL(/\/central\/motorista\/corridas(\?|$)/i);

    await expect
      .poll(() => resolveMobilitySurfaceState(page), { timeout: 60_000 })
      .not.toBe("");
    const driverSurfaceState = await resolveMobilitySurfaceState(page);

    if (
      driverSurfaceState === "paused" ||
      (await isMobilityLaunchPaused(page))
    ) {
      await expectMobilityLaunchPaused(page);
      return;
    }

    await expect(
      page
        .getByText(/corridas|motorista|nenhuma corrida|disponibilidade|ganhos/i)
        .first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("motoboy acessa entregas com fluxo operacional ou onboarding canonico", async ({
    page,
  }) => {
    await loginAsUser(page);

    await page.goto("/central/motoboy/entregas", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await recoverFromGlobalErrorBoundary(page);

    await waitForCoreLayout(page);

    await expect
      .poll(
        async () => {
          const text = await page
            .evaluate(() => (document.body?.innerText ?? "").toLowerCase())
            .catch(() => "");
          return !text.includes("verificando perfil de motoboy");
        },
        { timeout: 60_000 },
      )
      .toBe(true);

    await expect
      .poll(() => resolveMobilitySurfaceState(page), { timeout: 60_000 })
      .not.toBe("");
    const motoboySurfaceState = await resolveMobilitySurfaceState(page);

    if (
      motoboySurfaceState === "paused" ||
      (await isMobilityLaunchPaused(page))
    ) {
      await expectMobilityLaunchPaused(page);
      return;
    }

    if (motoboySurfaceState === "operational") {
      await expect(
        page
          .getByText(
            /entregas em andamento|pedidos de entrega disponiveis|nenhuma entrega/i,
          )
          .first(),
      ).toBeVisible({ timeout: 20_000 });
      return;
    }

    const onboardingCta = page.locator("main").getByRole("button", {
      name: /cadastrar como motoboy/i,
    });
    const onboardingHeading = page.getByRole("heading", { name: /motoboy/i });

    await expect(onboardingHeading.or(onboardingCta).first()).toBeVisible({
      timeout: 20_000,
    });

    if (await onboardingCta.isVisible().catch(() => false)) {
      await onboardingCta.click();
      await expect(page).toHaveURL(/\/central\/motoboy\/cadastro(\?|$)/i, {
        timeout: 20_000,
      });
    }
  });
});

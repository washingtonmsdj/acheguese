import { expect, test, type Page } from "@playwright/test";
import { loginAsUser } from "./helpers/auth";
import { isLaunchSurfaceEnabled } from "../../src/app/config/launchScope";

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

async function resolveMobilitySurfaceState(
  page: Page,
): Promise<"operational" | "onboarding" | ""> {
  const text = await getNormalizedBodyText(page);

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
  test.skip(
    !isLaunchSurfaceEnabled("mobility"),
    "Mobility remains launch-paused; operational certification requires the surface enabled.",
  );

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

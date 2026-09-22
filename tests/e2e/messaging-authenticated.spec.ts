import { expect, test } from "@playwright/test";
import {
  bootstrapFixtureSession,
  bootstrapProtectedPreviewAccess,
  ensureFixtureCurrentTermsAcceptance,
  hasE2EUserCredentials,
  requireE2EUserCredentials,
} from "./helpers/auth";
import {
  installPrivacyRpcPreviewBridge,
  installSessionProfilePreviewBridges,
} from "./helpers/remoteEdgeCorsBridge";

test.setTimeout(120_000);

test.describe("Mensagens autenticadas — provider Business", () => {
  test.skip(
    !hasE2EUserCredentials(),
    "E2E autenticado exige E2E_USER_EMAIL/E2E_USER_PASSWORD.",
  );

  test("abre a Inbox e consulta o provider Business sem criar mensagens", async ({
    page,
  }) => {
    const credentials = requireE2EUserCredentials();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.context().clearCookies();
    await bootstrapProtectedPreviewAccess(page);

    await page.goto("/mensagens", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page).toHaveURL(/\/login\?redirect=%2Fmensagens$/, {
      timeout: 30_000,
    });

    await Promise.all([
      installPrivacyRpcPreviewBridge(page),
      installSessionProfilePreviewBridges(page),
    ]);

    const businessPreviewStatuses: number[] = [];
    page.on("response", (response) => {
      if (
        response.request().method() === "POST" &&
        response.url().includes(
          "/rest/v1/rpc/list_business_direct_thread_previews",
        )
      ) {
        businessPreviewStatuses.push(response.status());
      }
    });

    const client = await bootstrapFixtureSession(
      page,
      credentials.email,
      credentials.password,
    );
    await ensureFixtureCurrentTermsAcceptance(client);

    await page.goto("/mensagens", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    await expect(page).toHaveURL(/\/mensagens(?:\?|$)/, {
      timeout: 30_000,
    });
    await expect(page.locator('[data-page="messaging-inbox"]')).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", { name: "Mensagens" }).first(),
    ).toBeVisible();

    await expect
      .poll(() => businessPreviewStatuses.length, { timeout: 30_000 })
      .toBeGreaterThan(0);
    expect(businessPreviewStatuses.every((status) => status >= 200 && status < 300)).toBe(
      true,
    );

    await expect(page.locator("body")).not.toContainText(
      /não foi possível carregar suas conversas/i,
    );

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(
      dimensions.clientWidth + 1,
    );
  });
});

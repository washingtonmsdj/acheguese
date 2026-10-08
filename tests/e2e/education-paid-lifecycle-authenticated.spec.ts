import { expect, test, type Download, type Page } from "@playwright/test";
import {
  E2E_AUTH_FIXTURE_MARKER,
  bootstrapFixtureSession,
  bootstrapProtectedPreviewAccess,
  requireE2EUserCredentials,
} from "./helpers/auth";

const PAID_BUSINESS_ID =
  process.env.E2E_EDUCATION_PAID_BUSINESS_ID?.trim() ?? "";

function requirePaidBusinessId(): string {
  if (!PAID_BUSINESS_ID) {
    throw new Error(
      "Paid Education E2E requires E2E_EDUCATION_PAID_BUSINESS_ID. " +
        "No synthetic plan or entitlement fallback is allowed.",
    );
  }
  return PAID_BUSINESS_ID;
}

async function authenticatePaidFixture(page: Page) {
  const credentials = requireE2EUserCredentials();
  const businessId = requirePaidBusinessId();

  await page.context().clearCookies();
  await bootstrapProtectedPreviewAccess(page);
  await page.goto("/central/empresas", { waitUntil: "domcontentloaded" });

  const client = await bootstrapFixtureSession(
    page,
    credentials.email,
    credentials.password,
  );

  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) {
    throw userError ?? new Error("Paid Education fixture user unavailable.");
  }

  const marker =
    userData.user.app_metadata?.acheguese_fixture ??
    userData.user.user_metadata?.acheguese_fixture;
  expect(marker).toBe(E2E_AUTH_FIXTURE_MARKER);

  const { data: business, error: businessError } = await client
    .from("business_data")
    .select("id, profile_id, business_name, status")
    .eq("profile_id", businessId)
    .maybeSingle();

  if (businessError) throw businessError;
  expect(business).not.toBeNull();
  expect(business?.profile_id).toBe(businessId);
  expect(business?.status).toBe("active");

  const { data: membership, error: membershipError } = await client
    .from("profile_members")
    .select("user_id, role")
    .eq("profile_id", businessId)
    .eq("user_id", userData.user.id)
    .eq("role", "owner")
    .maybeSingle();

  if (membershipError) throw membershipError;
  expect(membership?.role).toBe("owner");

  const { data: educationProfile, error: educationError } = await client
    .from("education_profiles")
    .select("id, status")
    .eq("business_id", businessId)
    .maybeSingle();

  if (educationError) throw educationError;
  expect(educationProfile).not.toBeNull();

  return { businessId };
}

async function readDownloadText(download: Download) {
  const stream = await download.createReadStream();
  if (!stream) throw new Error("CSV download stream unavailable.");

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

test.describe("Education paid lifecycle — authenticated read-only certification", () => {
  test.setTimeout(180_000);

  test("proves paid Analytics access and CSV export without changing plan", async ({
    page,
  }) => {
    const { businessId } = await authenticatePaidFixture(page);

    await page.goto(
      `/central/empresas/${businessId}/educacao/analytics`,
      { waitUntil: "domcontentloaded" },
    );

    await expect(
      page.getByRole("heading", { name: "Analytics", exact: true }),
    ).toBeVisible({ timeout: 30_000 });

    const exportButton = page.getByRole("button", { name: "Exportar CSV" });
    await expect(exportButton).toBeVisible({ timeout: 30_000 });
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent("download");
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      new RegExp(`^educacao-analytics-${businessId}-\\d{4}-\\d{2}-\\d{2}\\.csv$`),
    );

    const csv = await readDownloadText(download);
    expect(csv).toContain("secao");
    expect(csv).toContain("metrica");
    expect(csv).toContain("valor");
    expect(csv).toContain("leads");
    expect(csv).toContain("programas");
    expect(csv).toContain("eventos");

    await expect(page.getByText("Relatório exportado")).toBeVisible();
  });

  test("proves the paid Business plan is resolved from canonical Billing", async ({
    page,
  }) => {
    const { businessId } = await authenticatePaidFixture(page);

    await page.goto(
      `/central/empresas/${businessId}/educacao/planos`,
      { waitUntil: "domcontentloaded" },
    );

    await expect(
      page.getByRole("heading", { name: "Planos e assinatura" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Plano atual", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Ativo", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText("Plano não identificado no catálogo", { exact: true }),
    ).toHaveCount(0);

    const currentPlanButton = page.getByRole("button", {
      name: "Plano atual",
      exact: true,
    });
    await expect(currentPlanButton).toHaveCount(1);
    await expect(currentPlanButton).toBeDisabled();

    // Read-only certification: checkout is intentionally not started here.
    // A separate controlled release proof must cover real checkout behavior.
  });
});

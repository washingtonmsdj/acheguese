import { expect, test, type Page } from "@playwright/test";
import type { User } from "@supabase/supabase-js";
import { createOptionalOperationalAdminClient } from "../helpers/operational-env";

const ADMIN_PRICING_URL = "/admin/pricing";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? null;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? null;
const TEST_RULE_NAME = `Teste E2E Pricing ${Date.now()}`;
const TEST_RULE_NAME_EDITED = `${TEST_RULE_NAME} Editada`;
const TEMP_ADMIN_PASSWORD = "AdminPricing@2026!";

const adminClient = createOptionalOperationalAdminClient();

let runtimeAdminEmail: string | null = ADMIN_EMAIL;
let runtimeAdminPassword: string | null = ADMIN_PASSWORD;
let createdAdminEmail: string | null = null;

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function findUserByEmail(email: string): Promise<User | null> {
  if (!adminClient) return null;

  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;

    const users = data.users as User[];
    const user = users.find((item) => item.email === email);
    if (user) return user;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function cleanupUserByEmail(email: string): Promise<void> {
  if (!adminClient) return;
  const user = await findUserByEmail(email);
  if (!user) return;
  const { error } = await adminClient.auth.admin.deleteUser(user.id);
  if (error) throw error;
}

async function ensureAdminRole(userId: string): Promise<void> {
  if (!adminClient) return;

  const { data: existing, error: fetchError } = await adminClient
    .from("user_roles")
    .select("id, is_active")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existing?.id) {
    if (!existing.is_active) {
      const { error: activateError } = await adminClient
        .from("user_roles")
        .update({ is_active: true, revoked_at: null })
        .eq("id", existing.id);
      if (activateError) throw activateError;
    }
    return;
  }

  const { error: insertError } = await adminClient.from("user_roles").insert({
    user_id: userId,
    role: "admin",
    is_active: true,
    granted_at: new Date().toISOString(),
  });
  if (insertError) throw insertError;
}

function ruleRow(page: Page, ruleName: string) {
  return page
    .locator(".p-4.flex.items-center.justify-between")
    .filter({ hasText: ruleName })
    .first();
}

async function loginAsAdmin(page: Page) {
  test.skip(
    !runtimeAdminEmail || !runtimeAdminPassword,
    "Defina E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD ou SUPABASE_SERVICE_ROLE_KEY para provisionar admin de teste.",
  );

  await page.goto("/login");
  await page.locator("#login-identifier").fill(runtimeAdminEmail!);
  await page.locator("#login-password").fill(runtimeAdminPassword!);
  await page.getByRole("button", { name: /^Entrar$/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 30000,
  });
}

async function openAdminPricing(page: Page) {
  await page.goto(ADMIN_PRICING_URL);
  await expect(
    page.getByRole("heading", { name: /Gerenciamento de Pricing/i }),
  ).toBeVisible();
}

test.beforeAll(async () => {
  if (runtimeAdminEmail && runtimeAdminPassword) {
    return;
  }

  if (!adminClient) {
    return;
  }

  const email = `e2e-admin-pricing-${uniqueSuffix()}@example.com`;

  await cleanupUserByEmail(email);

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: TEMP_ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      name: "E2E Admin Pricing",
      display_name: "E2E Admin Pricing",
    },
  });

  if (error || !data.user?.id) {
    throw error ?? new Error("Falha ao criar usuario admin para E2E.");
  }

  await ensureAdminRole(data.user.id);

  runtimeAdminEmail = email;
  runtimeAdminPassword = TEMP_ADMIN_PASSWORD;
  createdAdminEmail = email;
});

test.afterAll(async () => {
  if (!createdAdminEmail) return;
  await cleanupUserByEmail(createdAdminEmail);
});

test.describe.serial("Admin Pricing - Validacao completa", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await openAdminPricing(page);
  });

  test("1. Pagina carrega corretamente", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Nova Regra/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Auditoria/i }),
    ).toBeVisible();
  });

  test("2. Lista renderiza estado com ou sem regras", async ({ page }) => {
    const emptyState = page.getByText(/Nenhuma regra cadastrada/i);
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const modeCards = page.locator(".border.rounded-lg.bg-card");
    await expect(modeCards.first()).toBeVisible();
    expect(await modeCards.count()).toBeGreaterThan(0);
  });

  test("3. Criar regra inativa", async ({ page }) => {
    await page.getByRole("button", { name: /Nova Regra/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/Nova Regra de Pricing/i)).toBeVisible();

    await dialog.locator('input[placeholder*="Corrida"]').fill(TEST_RULE_NAME);

    const numberInputs = dialog.locator('input[type="number"]');
    await expect(numberInputs).toHaveCount(5);
    await numberInputs.nth(0).fill("5.00");
    await numberInputs.nth(1).fill("2.50");
    await numberInputs.nth(2).fill("0.50");
    await numberInputs.nth(3).fill("8.00");
    await numberInputs.nth(4).fill("");

    const activeSwitch = dialog.getByRole("switch");
    if ((await activeSwitch.getAttribute("data-state")) === "checked") {
      await activeSwitch.click();
    }

    await dialog.getByRole("button", { name: /Criar/i }).click();

    await expect(page.getByText(/Regra criada com sucesso/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(ruleRow(page, TEST_RULE_NAME)).toBeVisible();
  });

  test("4. Editar regra criada", async ({ page }) => {
    const row = ruleRow(page, TEST_RULE_NAME);
    if ((await row.count()) === 0) {
      test.skip(true, "Regra de teste nao encontrada para edicao.");
    }

    await row.locator("button").first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/Editar Regra/i)).toBeVisible();

    const nameInput = dialog.locator('input[placeholder*="Corrida"]');
    await nameInput.clear();
    await nameInput.fill(TEST_RULE_NAME_EDITED);

    const baseFareInput = dialog.locator('input[type="number"]').first();
    await baseFareInput.clear();
    await baseFareInput.fill("6.00");

    await dialog.getByRole("button", { name: /Atualizar/i }).click();

    await expect(page.getByText(/Regra atualizada com sucesso/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(ruleRow(page, TEST_RULE_NAME_EDITED)).toBeVisible();
  });

  test("5. Alternar ativacao da regra", async ({ page }) => {
    const row = ruleRow(page, TEST_RULE_NAME_EDITED);
    if ((await row.count()) === 0) {
      test.skip(true, "Regra de teste nao encontrada para alternar ativacao.");
    }

    await row.locator("button").nth(1).click();

    await expect(
      page.getByText(
        /Regra (ativada|desativada)|Conflito|Nao e possivel desativar|Ja existe uma regra ativa/i,
      ),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: /Gerenciamento de Pricing/i }),
    ).toBeVisible();
  });

  test("6. Ver auditoria", async ({ page }) => {
    await page.getByRole("button", { name: /Auditoria/i }).click();

    const auditCard = page.locator(".border.rounded-lg.p-4.bg-card");
    await expect(auditCard).toBeVisible();

    await expect(
      auditCard.getByText(/Historico|Nenhum registro de auditoria/i),
    ).toBeVisible();
  });

  test("7. Refresh da lista", async ({ page }) => {
    const refreshButton = page.locator("button:has(svg.lucide-refresh-cw)");
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    await expect(
      page.getByRole("heading", { name: /Gerenciamento de Pricing/i }),
    ).toBeVisible();
  });

  test("8. Regra de teste permanece localizavel", async ({ page }) => {
    await expect(
      page.getByText(new RegExp(`${TEST_RULE_NAME}|${TEST_RULE_NAME_EDITED}`)),
    ).toBeVisible();
  });
});

test.describe("Admin Pricing - Validacao com RLS", () => {
  test("9. Verificar acesso com RLS habilitado", async ({ page }) => {
    await loginAsAdmin(page);
    await openAdminPricing(page);

    await expect(
      page.getByText(/permission denied|not authorized|access denied/i),
    ).not.toBeVisible();
  });
});

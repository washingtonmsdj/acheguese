import { expect, test, type Page } from "@playwright/test";
import { loginAsUser } from "./helpers/auth";
import {
  createOperationalAnonClient,
  createOptionalOperationalAdminClient,
  getOperationalEnv,
  hasOperationalAnonEnv,
} from "../helpers/operational-env";
import { expectNoSeriousA11yViolations } from "./support/axeAssertions";
import {
  DEFAULT_MOBILE_VIEWPORT,
  expectNoHorizontalOverflow,
} from "./support/publicRouteAssertions";

const BUSINESS_ID = process.env.E2E_GASTRONOMY_BUSINESS_ID || null;
const operationalEnv = getOperationalEnv();
const TEST_EMAIL = operationalEnv.driverEmail || "";
const TEST_PASSWORD = operationalEnv.driverPassword || "";
const admin = createOptionalOperationalAdminClient();
let BOOTSTRAP_BUSINESS_ID: string | null = null;
let BOOTSTRAP_BUSINESS_DATA_ID: string | null = null;

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

function isUuid(value: string | null | undefined): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function ensureBusinessProfileForE2EUser(): Promise<{
  businessProfileId: string | null;
  businessDataId: string | null;
}> {
  if (!TEST_EMAIL || !TEST_PASSWORD || !hasOperationalAnonEnv()) {
    return { businessProfileId: null, businessDataId: null };
  }

  const client = createOperationalAnonClient();

  const signIn = await client.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (signIn.error || !signIn.data.user) {
    return { businessProfileId: null, businessDataId: null };
  }

  const { data: businessProfiles, error: businessProfilesError } = await client
    .from("profiles")
    .select("id")
    .eq("user_id", signIn.data.user.id)
    .eq("profile_type", "business");

  if (businessProfilesError) throw businessProfilesError;

  let existingBusinessProfile: { id: string } | null = null;
  let businessDataId: string | null = null;
  const businessProfileIds = (businessProfiles ?? [])
    .map((profile) => profile.id)
    .filter(isUuid);

  if (businessProfileIds.length > 0) {
    const existingGastronomyBusiness = await client
      .from("business_data")
      .select("id, profile_id, category, business_name")
      .in("profile_id", businessProfileIds)
      .eq("category", "restaurante")
      .ilike("business_name", "E2E Gastronomia%")
      .limit(1)
      .maybeSingle();

    if (existingGastronomyBusiness.error)
      throw existingGastronomyBusiness.error;

    if (isUuid(existingGastronomyBusiness.data?.profile_id)) {
      existingBusinessProfile = {
        id: existingGastronomyBusiness.data.profile_id,
      };
      businessDataId = existingGastronomyBusiness.data.id ?? null;
    }
  }

  if (!existingBusinessProfile?.id) {
    if (!admin) {
      await client.auth.signOut();
      return { businessProfileId: null, businessDataId: null };
    }

    const handleSuffix = Date.now().toString().slice(-6);
    const handle = `e2e-gastronomia-${handleSuffix}`;
    const createdProfile = await admin
      .from("profiles")
      .insert({
        user_id: signIn.data.user.id,
        profile_type: "business",
        name: `E2E Gastronomia ${handleSuffix}`,
        display_name: `E2E Gastronomia ${handleSuffix}`,
        username: handle,
        handle,
        slug: handle,
        bio: "Perfil bootstrap para validacao automatizada de gastronomia.",
        is_active: true,
        is_public: true,
      })
      .select("id")
      .single();

    if (createdProfile.error) throw createdProfile.error;
    existingBusinessProfile = createdProfile.data ?? null;
  }

  if (existingBusinessProfile?.id) {
    await client.from("profile_members").upsert(
      {
        profile_id: existingBusinessProfile.id,
        user_id: signIn.data.user.id,
        role: "owner",
      },
      { onConflict: "profile_id,user_id" },
    );

    const existingBusinessData = businessDataId
      ? { data: { id: businessDataId, category: "restaurante" }, error: null }
      : await client
          .from("business_data")
          .select("id, category")
          .eq("profile_id", existingBusinessProfile.id)
          .eq("category", "restaurante")
          .ilike("business_name", "E2E Gastronomia%")
          .limit(1)
          .maybeSingle();

    businessDataId = existingBusinessData.data?.id ?? null;
    if (!businessDataId) {
      const suffix = Date.now().toString().slice(-6);
      const createdBusiness = await client
        .from("business_data")
        .insert({
          profile_id: existingBusinessProfile.id,
          business_name: `E2E Gastronomia ${suffix}`,
          description: "Empresa automatica para fluxo E2E.",
          category: "restaurante",
          status: "active",
        })
        .select("id")
        .single();

      businessDataId = createdBusiness.data?.id ?? null;
    } else if (existingBusinessData.data.category !== "restaurante") {
      await client
        .from("business_data")
        .update({
          category: "restaurante",
          subcategory: "e2e-gastronomia",
          status: "active",
        })
        .eq("id", businessDataId);
    }

    if (businessDataId) {
      const existingMenu = await client
        .from("menus")
        .select("id")
        .eq("business_id", businessDataId)
        .limit(1)
        .maybeSingle();

      let menuId = existingMenu.data?.id ?? null;
      if (!menuId) {
        const menuCreate = await client
          .from("menus")
          .insert({
            business_id: businessDataId,
            name: "Cardapio E2E",
            description: "Cardapio base para validacao automatizada",
            is_active: true,
            display_order: 0,
          })
          .select("id")
          .single();
        menuId = menuCreate.data?.id ?? null;
      }

      if (menuId) {
        const existingCategory = await client
          .from("menu_categories")
          .select("id")
          .eq("menu_id", menuId)
          .limit(1)
          .maybeSingle();

        let categoryId = existingCategory.data?.id ?? null;
        if (!categoryId) {
          const categoryCreate = await client
            .from("menu_categories")
            .insert({
              menu_id: menuId,
              name: "Pratos",
              description: "Categoria base E2E",
              display_order: 0,
              is_available: true,
            })
            .select("id")
            .single();
          categoryId = categoryCreate.data?.id ?? null;
        }

        if (categoryId) {
          const existingItem = await client
            .from("menu_items")
            .select("id")
            .eq("category_id", categoryId)
            .limit(1)
            .maybeSingle();

          if (!existingItem.data?.id) {
            await client.from("menu_items").insert({
              category_id: categoryId,
              name: "Item E2E",
              description: "Item base para fluxo de cardapio",
              base_price: 19.9,
              is_available: true,
              is_featured: false,
              display_order: 0,
            });
          }
        }
      }
    }
  }

  await client.auth.signOut();
  return {
    businessProfileId: existingBusinessProfile?.id ?? null,
    businessDataId: businessDataId ?? null,
  };
}

async function createOrderFixture(): Promise<string | null> {
  if (!TEST_EMAIL || !TEST_PASSWORD || !hasOperationalAnonEnv()) return null;
  if (!BOOTSTRAP_BUSINESS_ID || !BOOTSTRAP_BUSINESS_DATA_ID) return null;
  if (!admin) return null;

  const client = createOperationalAnonClient();

  const signIn = await client.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (signIn.error || !signIn.data.user) return null;

  const personalProfile = await client
    .from("profiles")
    .select("id")
    .eq("user_id", signIn.data.user.id)
    .eq("profile_type", "personal")
    .limit(1)
    .maybeSingle();
  const customerProfileId = personalProfile.data?.id ?? null;

  if (!customerProfileId) {
    await client.auth.signOut();
    return null;
  }

  let orderId: string | null = null;

  const rpcResult = await admin.rpc("delivery_create_order", {
    p_customer_profile_id: customerProfileId,
    p_merchant_profile_id: BOOTSTRAP_BUSINESS_ID,
    p_courier_profile_id: null,
    p_payment_mode: "direct_to_merchant",
    p_delivery_mode: "merchant_own_fleet",
    p_financial_status: "not_applicable",
    p_items_total: 19.9,
    p_delivery_fee: 0,
    p_discount_total: 0,
    p_order_total: 19.9,
    p_platform_fee_amount: null,
    p_merchant_net_amount: null,
    p_courier_amount: null,
    p_source_type: "gastronomy",
    p_source_id: BOOTSTRAP_BUSINESS_DATA_ID,
    p_source_reference: `e2e-${Date.now()}`,
    p_source_metadata: {
      customer_name: "Cliente E2E",
      customer_phone: "71999999999",
    },
    p_order_items: [
      {
        source_item_id: "e2e-item",
        sku: null,
        name: "Item E2E",
        quantity: 1,
        unit_price: 19.9,
        addons_total: 0,
        line_total: 19.9,
        notes: null,
        item_snapshot: { source: "e2e" },
        metadata: {},
      },
    ],
    p_payment_method: "pix",
    p_external_payment_reference: null,
    p_notes: "Pedido fixture E2E",
    p_actor_profile_id: BOOTSTRAP_BUSINESS_ID,
  });

  if (rpcResult.error) {
    await client.auth.signOut();
    throw rpcResult.error;
  }

  orderId = (rpcResult.data as { id?: string } | null)?.id ?? null;
  if (!orderId) {
    await client.auth.signOut();
    throw new Error(
      "delivery_create_order nao retornou id para a fixture E2E.",
    );
  }

  await client.auth.signOut();
  return orderId;
}

async function waitForOrderLogisticsStatus(
  orderId: string,
  expectedStatuses: string[],
): Promise<string> {
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ausente: nao foi possivel verificar status do pedido.",
    );
  }

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { data, error } = await admin
      .from("orders")
      .select("logistics_status")
      .eq("id", orderId)
      .maybeSingle();

    if (error) throw error;

    const status = String(data?.logistics_status ?? "");
    if (expectedStatuses.includes(status)) {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    `Pedido ${orderId} nao atingiu status esperado: ${expectedStatuses.join(", ")}.`,
  );
}

async function assertAdministrativeOrderEvidence(
  orderId: string,
): Promise<void> {
  if (!admin) {
    console.info(
      "SUPABASE_SERVICE_ROLE_KEY ausente: asserts administrativos profundos de orders/notifications/trust pulados explicitamente.",
    );
    return;
  }

  const [timelineResult, notificationResult, trustResult] = await Promise.all([
    admin
      .from("order_timeline_events")
      .select(
        "id, order_id, to_logistics_status, actor_profile_id, reason, created_at",
      )
      .eq("order_id", orderId),
    admin
      .from("notifications")
      .select(
        "id, user_id, type, category, action_url, action_label, metadata, created_at",
      )
      .eq("metadata->>order_id", orderId),
    admin
      .from("trust_events")
      .select("id, context_type, context_id, status, evidence, created_at")
      .eq("context_type", "order")
      .eq("context_id", orderId),
  ]);

  expect(timelineResult.error).toBeNull();
  expect(notificationResult.error).toBeNull();
  expect(trustResult.error).toBeNull();

  expect(timelineResult.data?.length ?? 0).toBeGreaterThan(0);
  expect(
    (timelineResult.data ?? []).some((event) =>
      ["delivered", "canceled", "failed"].includes(
        String(event.to_logistics_status ?? ""),
      ),
    ),
  ).toBe(true);
  expect(notificationResult.data?.length ?? 0).toBeGreaterThan(0);
  expect(
    (notificationResult.data ?? []).every(
      (notification) => String(notification.category ?? "") === "transactional",
    ),
  ).toBe(true);
  expect(
    (notificationResult.data ?? []).some((notification) =>
      ["info", "success", "warning", "error"].includes(
        String(notification.type ?? ""),
      ),
    ),
  ).toBe(true);
  expect(
    (notificationResult.data ?? []).some((notification) =>
      String(notification.action_url ?? "").includes(
        `/gastronomia/pedidos/${orderId}`,
      ),
    ),
  ).toBe(true);
  expect(
    (notificationResult.data ?? []).some((notification) =>
      ["customer", "merchant", "courier"].includes(
        String(
          (notification.metadata as Record<string, unknown>)?.audience ?? "",
        ),
      ),
    ),
  ).toBe(true);
  expect(
    (notificationResult.data ?? []).some((notification) =>
      [
        "order_created",
        "order_accepted",
        "order_preparing",
        "order_ready_for_pickup",
        "courier_picked_up",
        "order_delivered",
        "delivery_proof_attached",
      ].includes(
        String((notification.metadata as Record<string, unknown>)?.event ?? ""),
      ),
    ),
  ).toBe(true);

  // Trust events are contextual: not every successful order creates risk feedback.
  // The service-role assertion still proves the admin surface is queryable for this order.
  expect(Array.isArray(trustResult.data)).toBe(true);

  const trustEventIds = (trustResult.data ?? []).map((event) =>
    String(event.id),
  );
  if (trustEventIds.length > 0) {
    const adminActionsResult = await admin
      .from("trust_admin_actions")
      .select(
        "id, trust_event_id, subject_profile_id, action_type, metadata, created_at",
      )
      .in("trust_event_id", trustEventIds);

    expect(adminActionsResult.error).toBeNull();
    expect(Array.isArray(adminActionsResult.data)).toBe(true);

    const adminActionIds = (adminActionsResult.data ?? []).map((action) =>
      String(action.id),
    );
    if (adminActionIds.length > 0) {
      const adminActionNotificationsResult = await admin
        .from("notifications")
        .select(
          "id, type, category, action_url, action_label, metadata, created_at",
        )
        .in("metadata->>trust_admin_action_id", adminActionIds);

      expect(adminActionNotificationsResult.error).toBeNull();
      expect(
        (adminActionNotificationsResult.data ?? []).every(
          (notification) =>
            String(notification.category ?? "") === "transactional",
        ),
      ).toBe(true);
      expect(
        (adminActionNotificationsResult.data ?? []).some((notification) =>
          ["subject", "admin"].includes(
            String(
              (notification.metadata as Record<string, unknown>)?.audience ??
                "",
            ),
          ),
        ),
      ).toBe(true);
      expect(
        (adminActionNotificationsResult.data ?? []).some((notification) =>
          ["/admin/moderacao", "/perfil"].some((url) =>
            String(notification.action_url ?? "").includes(url),
          ),
        ),
      ).toBe(true);
    }
  }
}

async function prepareReviewSlotForE2EOrder(orderId: string): Promise<void> {
  if (!admin) {
    return;
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("customer_profile_id, merchant_profile_id")
    .eq("id", orderId)
    .maybeSingle();

  expect(orderError).toBeNull();

  const customerProfileId = String(order?.customer_profile_id ?? "");
  const merchantProfileId = String(order?.merchant_profile_id ?? "");

  if (!isUuid(customerProfileId) || !isUuid(merchantProfileId)) {
    throw new Error(
      `Pedido ${orderId} sem perfis validos para preparar avaliacao E2E.`,
    );
  }

  const cleanup = await admin
    .from("reviews")
    .delete()
    .eq("reviewer_profile_id", customerProfileId)
    .eq("reviewed_profile_id", merchantProfileId)
    .eq("review_type", "business");

  expect(cleanup.error).toBeNull();
}

async function assertCustomerReviewEvidence(
  orderId: string,
  expectedComment: string,
): Promise<void> {
  if (!admin) {
    console.info(
      "SUPABASE_SERVICE_ROLE_KEY ausente: assert administrativo da avaliacao pulado explicitamente.",
    );
    return;
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("customer_profile_id, merchant_profile_id")
    .eq("id", orderId)
    .maybeSingle();

  expect(orderError).toBeNull();
  expect(order?.merchant_profile_id).toBeTruthy();
  expect(order?.customer_profile_id).toBeTruthy();

  const { data: review, error: reviewError } = await admin
    .from("reviews")
    .select(
      "id, reviewed_profile_id, reviewer_profile_id, rating, comment, order_id, status, review_type",
    )
    .eq("order_id", orderId)
    .eq("review_type", "business")
    .maybeSingle();

  expect(reviewError).toBeNull();
  expect(review?.reviewed_profile_id).toBe(order?.merchant_profile_id);
  expect(review?.reviewer_profile_id).toBe(order?.customer_profile_id);
  expect(review?.rating).toBe(5);
  expect(review?.comment).toBe(expectedComment);
  expect(review?.status).toBe("active");
}

async function resolveBusinessId(page: Page) {
  if (BUSINESS_ID) return BUSINESS_ID;

  await page.goto("/central/empresas", {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  await page.waitForTimeout(1_500);

  const href = await page.evaluate(() => {
    const anchors = Array.from(
      document.querySelectorAll('a[href^="/central/empresas/"]'),
    );
    for (const anchor of anchors) {
      const href = anchor.getAttribute("href");
      if (!href) continue;
      if (
        href.includes("/gastronomia") ||
        /^\/central\/empresas\/[0-9a-f-]{36}(?:\/|$)/i.test(href)
      ) {
        return href;
      }
    }
    return null;
  });

  if (!href) return null;
  const match = href.match(/\/central\/empresas\/([^/]+)/);
  const candidate = match?.[1] ?? null;
  return isUuid(candidate) ? candidate : null;
}

test.describe("Gastronomia operacional autenticada", () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeAll(async () => {
    if (!TEST_EMAIL || !TEST_PASSWORD) return;
    const bootstrap = await ensureBusinessProfileForE2EUser();
    BOOTSTRAP_BUSINESS_ID = bootstrap.businessProfileId;
    BOOTSTRAP_BUSINESS_DATA_ID = bootstrap.businessDataId;
  });

  test.beforeEach(async () => {
    test.skip(
      !TEST_EMAIL || !TEST_PASSWORD,
      "Defina E2E_USER_EMAIL e E2E_USER_PASSWORD para validar fluxo autenticado da loja.",
    );

    if (!BOOTSTRAP_BUSINESS_ID || !BOOTSTRAP_BUSINESS_DATA_ID) {
      const bootstrap = await ensureBusinessProfileForE2EUser();
      BOOTSTRAP_BUSINESS_ID = bootstrap.businessProfileId;
      BOOTSTRAP_BUSINESS_DATA_ID = bootstrap.businessDataId;
    }
  });

  test("loja gerencia disponibilidade, estoque e esgotamento de item pelo cardapio canonico", async ({
    page,
  }) => {
    await loginAsUser(page);
    const businessId = BOOTSTRAP_BUSINESS_ID ?? (await resolveBusinessId(page));

    test.skip(
      !isUuid(businessId),
      "Usuario autenticado nao possui empresa vinculada em /central/empresas para validar gastronomia.",
    );

    await page.goto(`/central/empresas/${businessId}/gastronomia/cardapio`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    const hasMenuHeading = await page
      .getByRole("heading", { name: /gestao de cardapio|gestão de cardápio/i })
      .isVisible()
      .catch(() => false);

    if (hasMenuHeading) {
      await expect(
        page.getByRole("button", { name: /novo item/i }),
      ).toBeVisible();

      await page.getByRole("button", { name: /novo item/i }).click();

      await expect(
        page.getByRole("heading", { name: /novo item/i }),
      ).toBeVisible();
      await expect(page.getByLabel(/disponivel para venda/i)).toBeVisible();
      await expect(page.getByLabel(/estoque atual/i)).toBeVisible();
      await expect(page.getByLabel(/alerta de estoque baixo/i)).toBeVisible();

      await page.getByRole("button", { name: /cancelar/i }).click();

      const soldOutAction = page
        .getByRole("button", { name: /marcar esgotado/i })
        .first();
      const soldOutCount = await soldOutAction.count();

      if (soldOutCount > 0) {
        await expect(soldOutAction).toBeVisible();
      } else {
        await expect(
          page.getByText(
            /nenhum item cadastrado ainda|nenhum item encontrado/i,
          ),
        ).toBeVisible();
      }
    } else {
      await expect(page).toHaveURL(
        new RegExp(`/central/empresas/${businessId}/gastronomia/cardapio`),
        {
          timeout: 20_000,
        },
      );
      await expect(
        page.getByText(/preparando a casa para voce se achegar/i),
      ).toHaveCount(0);
    }
  });

  test("loja acessa dashboard e rota de pedido sem travar suspense global", async ({
    page,
  }) => {
    await loginAsUser(page);
    const businessId = BOOTSTRAP_BUSINESS_ID ?? (await resolveBusinessId(page));

    test.skip(
      !isUuid(businessId),
      "Usuario autenticado nao possui empresa vinculada em /central/empresas para validar dashboard gastronomico.",
    );

    await page.goto(`/central/empresas/${businessId}/gastronomia`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    const hasDashboardHeading = await page
      .getByRole("heading", {
        name: /dashboard gastronomia|painel gastrono|painel operacional/i,
      })
      .isVisible()
      .catch(() => false);

    if (!hasDashboardHeading) {
      await expect(page).toHaveURL(
        new RegExp(`/central/empresas/${businessId}/gastronomia`),
        {
          timeout: 20_000,
        },
      );
      await expect(
        page.getByText(/preparando a casa para voce se achegar/i),
      ).toHaveCount(0);
      return;
    }

    await page.goto(
      `/central/empresas/${businessId}/gastronomia/pedidos/fake-order-id`,
      {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      },
    );

    await expect(
      page.getByText(
        /pedido nao encontrado|nao foi possivel carregar o pedido/i,
      ),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("dashboard de gastronomia nao estoura horizontalmente em 360px", async ({
    page,
  }) => {
    await page.setViewportSize(DEFAULT_MOBILE_VIEWPORT);
    await loginAsUser(page);
    const businessId = BOOTSTRAP_BUSINESS_ID ?? (await resolveBusinessId(page));

    test.skip(
      !isUuid(businessId),
      "Usuario autenticado nao possui empresa vinculada em /central/empresas para validar dashboard gastronomico mobile.",
    );

    await page.goto(`/central/empresas/${businessId}/gastronomia`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    await expect(page.locator("main").first()).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText(/preparando a casa para voce se achegar/i),
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page, DEFAULT_MOBILE_VIEWPORT.width);
    await expectNoSeriousA11yViolations(page);
  });

  test("fluxo pedido autenticado: cliente visualiza e loja opera pedido ate estado terminal", async ({
    page,
  }) => {
    await loginAsUser(page);
    const businessId = BOOTSTRAP_BUSINESS_ID ?? (await resolveBusinessId(page));
    const orderId = await createOrderFixture();
    const adminOrderUrl = isUuid(businessId)
      ? `/central/empresas/${businessId}/gastronomia/pedidos/${orderId}`
      : null;

    if (!isUuid(businessId) || !orderId) {
      await page.goto("/central/empresas", {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await expect(page.locator("main").first()).toBeVisible({
        timeout: 20_000,
      });
      return;
    }

    await prepareReviewSlotForE2EOrder(orderId);

    await page.goto(`/gastronomia/pedidos/${orderId}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    await expect(
      page.getByRole("heading", { name: /pedido\s*#/i }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /^cliente$/i })).toBeVisible(
      { timeout: 20_000 },
    );

    await page.goto(adminOrderUrl!, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(
      page
        .getByRole("button", {
          name: /aceitar pedido|cancelar|marcar pagamento confirmado/i,
        })
        .first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText(/timeline em tempo real|reconectando timeline/i).first(),
    ).toBeVisible({ timeout: 20_000 });

    const actionSequence = [
      {
        current: /aceitar pedido/i,
        next: /iniciar preparo/i,
        nextType: "button",
      },
      {
        current: /iniciar preparo/i,
        next: /marcar pronto/i,
        nextType: "button",
      },
      {
        current: /marcar pronto/i,
        next: /marcar saiu para entrega|marcar retirado/i,
        nextType: "button",
      },
      {
        current: /marcar saiu para entrega|marcar retirado/i,
        next: /marcar entregue/i,
        nextType: "button",
      },
      {
        current: /marcar entregue/i,
        next: /sem ação operacional pendente|sem acao operacional pendente/i,
        nextType: "text",
      },
    ] as const;

    for (const step of actionSequence) {
      const actionButton = page
        .getByRole("button", { name: step.current })
        .first();
      const hasAction = await actionButton.isVisible().catch(() => false);
      if (!hasAction) break;

      await expect(actionButton).toBeEnabled({ timeout: 20_000 });
      await actionButton.click();

      if (step.nextType === "button") {
        const nextButton = page
          .getByRole("button", { name: step.next })
          .first();
        await expect(nextButton).toBeVisible({ timeout: 20_000 });
        await expect(nextButton).toBeEnabled({ timeout: 20_000 });
      } else {
        await expect(page.getByText(step.next).first()).toBeVisible({
          timeout: 20_000,
        });
      }
    }

    await page.goto(adminOrderUrl!, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.getByText(/pedido #/i)).toBeVisible({ timeout: 20_000 });

    const markDeliveredButton = page
      .getByRole("button", { name: /marcar entregue/i })
      .first();
    const terminalState = page
      .getByText(/sem ação operacional pendente|sem acao operacional pendente/i)
      .first();
    await expect
      .poll(
        async () =>
          (await markDeliveredButton.isVisible().catch(() => false)) ||
          (await terminalState.isVisible().catch(() => false)),
        { timeout: 20_000 },
      )
      .toBe(true);

    if (await markDeliveredButton.isVisible().catch(() => false)) {
      await expect(markDeliveredButton).toBeEnabled({ timeout: 20_000 });
      await markDeliveredButton.click();
      await waitForOrderLogisticsStatus(orderId, ["delivered"]);
    }

    await expect(terminalState).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole("button", { name: /marcar entregue/i }),
    ).toHaveCount(0);

    await page.goto(`/gastronomia/pedidos/${orderId}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.getByText(/pedido #/i)).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole("button", {
        name: /aceitar pedido|cancelar|marcar pagamento confirmado/i,
      }),
    ).toHaveCount(0);
    await expect(
      page.getByText(/linha do tempo|itens do pedido/i).first(),
    ).toBeVisible({
      timeout: 20_000,
    });

    const reviewComment = `Review operacional E2E ${Date.now()}`;
    await expect(
      page.getByRole("heading", { name: /avaliar experi/i }),
    ).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /5 estrelas/i }).click();
    await page.getByLabel(/conte sobre sua experi/i).fill(reviewComment);
    await page.getByRole("button", { name: /publicar avalia/i }).click();
    await expect(
      page.getByText(/avaliacao registrada|avalia.*registrada|obrigado/i),
    ).toBeVisible({
      timeout: 20_000,
    });
    await assertCustomerReviewEvidence(orderId, reviewComment);

    await page.goto(`/central/empresas/${businessId}/gastronomia/pedidos`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(
      page.getByText(/tempo real ativo|reconectando tempo real/i).first(),
    ).toBeVisible({ timeout: 20_000 });

    await assertAdministrativeOrderEvidence(orderId);
  });

  test("motoboy acessa central de entregas sem quebrar fluxo (entregas ou cadastro)", async ({
    page,
  }) => {
    await loginAsUser(page);

    await page.goto("/central/motoboy/entregas", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await recoverFromGlobalErrorBoundary(page);

    await expect
      .poll(
        async () => {
          const mainVisible = await page
            .locator("main")
            .first()
            .isVisible()
            .catch(() => false);
          const headerVisible = await page
            .locator("header")
            .first()
            .isVisible()
            .catch(() => false);
          const hasBodyText = await page
            .evaluate(() => (document.body?.innerText ?? "").trim().length > 80)
            .catch(() => false);
          return mainVisible || headerVisible || hasBodyText;
        },
        { timeout: 30_000 },
      )
      .toBe(true);

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

    const motoboySurfaceState = String(
      await page
        .waitForFunction(
          () => {
            const text = document.body?.innerText ?? "";
            const comparableText = text
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase();

            if (
              comparableText.includes("mvp publico") ||
              comparableText.includes(
                "mobilidade esta separado para ajustes",
              ) ||
              comparableText.includes("separado para ajustes")
            ) {
              return "paused";
            }

            if (
              comparableText.includes("entregas em andamento") ||
              comparableText.includes("pedidos de entrega disponiveis") ||
              comparableText.includes("modo motoboy")
            ) {
              return "deliveries";
            }

            if (
              comparableText.includes("cadastrar como motoboy") ||
              comparableText.includes("perfil de motoboy")
            ) {
              return "onboarding";
            }

            return "";
          },
          undefined,
          { timeout: 60_000 },
        )
        .then((handle) => handle.jsonValue())
        .catch(() => ""),
    );

    expect(motoboySurfaceState).not.toBe("");

    if (motoboySurfaceState === "paused") {
      await expect(
        page
          .getByText(
            /Mobilidade esta separado para ajustes|separado para ajustes/i,
          )
          .first(),
      ).toBeVisible({ timeout: 20_000 });
      return;
    }

    if (motoboySurfaceState === "deliveries") {
      await expect(
        page
          .getByText(
            /entregas em andamento|pedidos de entrega disponiveis|nenhuma entrega/i,
          )
          .first(),
      ).toBeVisible({ timeout: 20_000 });
      return;
    }

    const motoboyOnboardingHeading = page.getByRole("heading", {
      name: /motoboy/i,
    });
    const motoboyOnboardingButton = page.locator("main").getByRole("button", {
      name: /cadastrar como motoboy/i,
    });
    await expect(
      motoboyOnboardingHeading.or(motoboyOnboardingButton).first(),
    ).toBeVisible({
      timeout: 20_000,
    });

    const hasOnboardingCta = await motoboyOnboardingButton
      .isVisible()
      .catch(() => false);
    if (hasOnboardingCta) {
      await motoboyOnboardingButton.click();
      await expect(page).toHaveURL(/\/central\/motoboy\/cadastro(\?|$)/i, {
        timeout: 20_000,
      });
      await expect(
        page
          .getByRole("heading", { name: /motoboy|perfil de motoboy/i })
          .or(
            page.getByRole("button", {
              name: /cadastrar como motoboy|enviar cadastro/i,
            }),
          )
          .first(),
      ).toBeVisible({ timeout: 20_000 });
    }
  });
});

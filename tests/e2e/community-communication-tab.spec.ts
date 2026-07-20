import { expect, test } from "@playwright/test";

import { openPublicRoute } from "./support/publicRouteAssertions";

/**
 * Valida a aba /comunidade/:uf/:city/comunicacao renderizando os dois
 * formatos suportados pelo CommunityCommunicationCard:
 *  - `article`: layout editorial com CTA canonical "Ler matéria completa"
 *  - `update`: postagem simples com CTA secundário "Ver no canal" e sem
 *    navegação forçada
 *
 * Mockamos as tabelas Supabase de comunicação para não depender do estado
 * remoto e cobrir determinísticamente ambos os layouts.
 */

const ROUTE = "/comunidade/ba/salvador/comunicacao";

const CHANNEL_ID = "11111111-1111-4111-8111-111111111111";
const LOCATION_ID = "22222222-2222-4222-8222-222222222222";
const ARTICLE_PUB_ID = "33333333-3333-4333-8333-333333333333";
const UPDATE_PUB_ID = "44444444-4444-4444-8444-444444444444";
const CHANNEL_SLUG = "radio-teste-e2e";

const NOW = new Date("2026-07-20T12:00:00Z").toISOString();

const distributions = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    publication_id: ARTICLE_PUB_ID,
    channel_id: CHANNEL_ID,
    location_id: LOCATION_ID,
    target_type: "community_tab",
    is_active: true,
    relevance_score: 1,
    rank_score: 100,
    rank_reason: "test",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    publication_id: UPDATE_PUB_ID,
    channel_id: CHANNEL_ID,
    location_id: LOCATION_ID,
    target_type: "community_tab",
    is_active: true,
    relevance_score: 1,
    rank_score: 90,
    rank_reason: "test",
    created_at: NOW,
    updated_at: NOW,
  },
];

const publications = [
  {
    id: ARTICLE_PUB_ID,
    channel_id: CHANNEL_ID,
    author_profile_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    location_id: LOCATION_ID,
    publication_type: "news",
    content_format: "article",
    title: "Reportagem editorial de teste E2E",
    summary: "Resumo curto usado no layout de matéria.",
    body: "Corpo completo da matéria editorial para o teste.",
    source_url: null,
    media: {},
    status: "published",
    trust_label: "verificado",
    published_at: NOW,
    expires_at: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: UPDATE_PUB_ID,
    channel_id: CHANNEL_ID,
    author_profile_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    location_id: LOCATION_ID,
    publication_type: "public_utility",
    content_format: "update",
    title: "Aviso rápido do canal de teste",
    summary: null,
    body: "Este é um update curto que deve ficar inline no card comunitário.",
    source_url: null,
    media: {},
    status: "published",
    trust_label: "comunitario",
    published_at: NOW,
    expires_at: null,
    created_at: NOW,
    updated_at: NOW,
  },
];

const channels = [
  {
    id: CHANNEL_ID,
    profile_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    public_name: "Rádio Teste E2E",
    legal_name: null,
    slug: CHANNEL_SLUG,
    channel_kind: "radio",
    description: "Canal de teste",
    website_url: null,
    contact_email: null,
    contact_phone: null,
    status: "active",
    verification_status: "verified",
    reliability_score: 100,
    alert_cooldown_until: null,
    created_at: NOW,
    updated_at: NOW,
  },
];

async function mockCommunicationTables(page: import("@playwright/test").Page) {
  await page.route("**/rest/v1/communication_publication_distribution*", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(distributions),
    });
  });

  await page.route("**/rest/v1/communication_publications*", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(publications),
    });
  });

  await page.route("**/rest/v1/communication_channels*", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(channels),
    });
  });
}

test.describe("community communication tab", () => {
  test.setTimeout(240_000);

  test("renders article and update cards with correct layouts and CTAs", async ({ page }) => {
    await mockCommunicationTables(page);

    await openPublicRoute(page, ROUTE, {
      waitUntil: "domcontentloaded",
      dismissConsent: true,
    });

    const cards = page.locator('[data-testid="community-communication-card"]');
    await expect(cards).toHaveCount(2, { timeout: 45_000 });

    const articleCard = cards.filter({ has: page.locator('[data-content-format="article"]') }).first();
    const updateCard = cards.filter({ has: page.locator('[data-content-format="update"]') }).first();

    // Article: canonical CTA visible, no channel-link CTA
    await expect(articleCard).toHaveAttribute("data-content-format", "article");
    await expect(articleCard).toContainText("Reportagem editorial de teste E2E");
    const canonicalCta = articleCard.locator('[data-testid="communication-card-canonical-link"]');
    await expect(canonicalCta).toBeVisible();
    await expect(canonicalCta).toHaveAttribute(
      "href",
      `/comunicacao/ba/salvador/${CHANNEL_SLUG}`,
    );
    await expect(canonicalCta).toContainText(/Ler matéria completa/i);
    await expect(
      articleCard.locator('[data-testid="communication-card-channel-link"]'),
    ).toHaveCount(0);

    // Update: secondary "Ver no canal" CTA, no canonical "Ler matéria completa" CTA
    await expect(updateCard).toHaveAttribute("data-content-format", "update");
    await expect(updateCard).toContainText("Aviso rápido do canal de teste");
    const channelCta = updateCard.locator('[data-testid="communication-card-channel-link"]');
    await expect(channelCta).toBeVisible();
    await expect(channelCta).toHaveAttribute(
      "href",
      `/comunicacao/ba/salvador/${CHANNEL_SLUG}`,
    );
    await expect(channelCta).toContainText(/Ver no canal/i);
    await expect(
      updateCard.locator('[data-testid="communication-card-canonical-link"]'),
    ).toHaveCount(0);
  });
});

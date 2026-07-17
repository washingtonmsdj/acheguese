import { expect, test } from "@playwright/test";
import {
  expectRouteReady,
  openPublicRoute,
} from "./support/publicRouteAssertions";

const COMMUNITY_BASE = "/comunidade/ba/salvador/pituba";

const MODULES = [
  { slug: "empresas", section: "business" },
  { slug: "servicos", section: "services" },
  { slug: "classificados", section: "classifieds" },
  { slug: "gastronomia", section: "gastronomy" },
] as const;

test.describe("community persistent shell", () => {
  test.setTimeout(240_000);

  for (const module of MODULES) {
    test(`${module.slug} keeps the canonical community chrome`, async ({
      page,
    }) => {
      await openPublicRoute(page, `${COMMUNITY_BASE}/${module.slug}`, {
        waitUntil: "domcontentloaded",
        dismissConsent: true,
      });
      await expectRouteReady(page, {
        expectedUrlPart: `${COMMUNITY_BASE}/${module.slug}`,
        readyPattern: /Pituba|Empresas|ServiÃ§os|Classificados|Gastronomia/i,
      });

      await expect(
        page.locator('[data-community-overview="community-first"]'),
      ).toBeVisible();
      await expect(
        page.locator(".neighborhood-community-header"),
      ).toBeVisible();
      await expect(
        page.locator(`[data-community-module-content="${module.section}"]`),
      ).toBeVisible();
      await expect(
        page.locator('[data-module-presentation="embedded"]'),
      ).toHaveCount(1);
      await expect(
        page.locator('[data-module-presentation="standalone"]'),
      ).toHaveCount(0);
      await expect
        .poll(() => new URL(page.url()).pathname)
        .toBe(`${COMMUNITY_BASE}/${module.slug}`);
    });
  }

  test("desktop module navigation changes the route without losing community identity", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await openPublicRoute(page, COMMUNITY_BASE, {
      waitUntil: "domcontentloaded",
      dismissConsent: true,
    });
    await expectRouteReady(page, {
      expectedUrlPart: COMMUNITY_BASE,
      readyPattern: /Pituba|Feed|Comunidade/i,
    });

    const communityNavigation = page.getByRole("navigation", {
      name: "Navegacao da comunidade",
    });
    await expect(
      communityNavigation.locator("[data-community-nav-item]"),
    ).toHaveCount(7);
    await expect(
      communityNavigation.locator('[data-community-nav-item="map"]'),
    ).toBeVisible();
    await expect(
      communityNavigation.locator('[data-community-nav-item="events"]'),
    ).toBeVisible();

    await page.evaluate(() => {
      (
        window as Window & { __communityPersistentHeader?: Element | null }
      ).__communityPersistentHeader = document.querySelector(
        ".neighborhood-community-header",
      );
    });

    const businessPreviewButton = communityNavigation.getByRole("button", {
      name: "Empresas",
      exact: true,
    });
    await expect(businessPreviewButton).toHaveCount(1);
    await businessPreviewButton.click();

    await expect(page).toHaveURL(`${COMMUNITY_BASE}?view=business`);
    await expect(
      page.getByRole("heading", { name: "Empresas da comunidade" }),
    ).toBeVisible();
    await expect(page.locator("#grupos")).toHaveCount(0);
    await page.getByRole("link", { name: "Ver todas as empresas" }).click();

    await expect(page).toHaveURL(`${COMMUNITY_BASE}/empresas`);
    await expect(page.locator(".neighborhood-community-header")).toBeVisible();
    await expect(
      page.locator('[data-community-module-content="business"]'),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as Window & {
                __communityPersistentHeader?: Element | null;
              }
            ).__communityPersistentHeader ===
            document.querySelector(".neighborhood-community-header"),
        ),
      )
      .toBe(true);
    await expect(
      page
        .getByRole("navigation", { name: "Navegacao da comunidade" })
        .getByRole("link", {
          name: "Empresas",
          exact: true,
        }),
    ).toHaveAttribute("aria-current", "page");

    await page.screenshot({
      path: testInfo.outputPath("community-business-desktop.png"),
      fullPage: true,
    });

    const eventsLink = page
      .getByRole("navigation", { name: "Navegacao da comunidade" })
      .locator('[data-community-nav-item="events"]');
    await eventsLink.click();
    await expect(page).toHaveURL(`${COMMUNITY_BASE}#eventos`);
    await expect(page.locator("#eventos")).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.id))
      .toBe("eventos");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as Window & {
                __communityPersistentHeader?: Element | null;
              }
            ).__communityPersistentHeader ===
            document.querySelector(".neighborhood-community-header"),
        ),
      )
      .toBe(true);

    await page.goBack();
    await expect(page).toHaveURL(`${COMMUNITY_BASE}/empresas`);
    await expect(
      page.locator('[data-community-module-content="business"]'),
    ).toBeVisible();

    const servicesLink = page
      .getByRole("navigation", { name: "Navegacao da comunidade" })
      .getByRole("link", { name: "Serviços", exact: true });
    await servicesLink.click();
    await expect(page).toHaveURL(`${COMMUNITY_BASE}/servicos`);
    await expect(
      page.locator('[data-community-module-content="services"]'),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as Window & {
                __communityPersistentHeader?: Element | null;
              }
            ).__communityPersistentHeader ===
            document.querySelector(".neighborhood-community-header"),
        ),
      )
      .toBe(true);

    const mapLink = page
      .getByRole("navigation", { name: "Navegacao da comunidade" })
      .getByRole("link", { name: "Mapa", exact: true });
    await mapLink.click();
    await expect(page).toHaveURL(`${COMMUNITY_BASE}/mapa`);
    await expect(
      page.locator('[data-community-module-content="map"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-module-presentation="embedded"]'),
    ).toHaveCount(1);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as Window & {
                __communityPersistentHeader?: Element | null;
              }
            ).__communityPersistentHeader ===
            document.querySelector(".neighborhood-community-header"),
        ),
      )
      .toBe(true);

    await page.goBack();
    await expect(page).toHaveURL(`${COMMUNITY_BASE}/servicos`);
    await page.goBack();
    await expect(page).toHaveURL(`${COMMUNITY_BASE}/empresas`);

    await page
      .getByRole("navigation", { name: "Navegacao da comunidade" })
      .getByRole("link", { name: "Feed", exact: true })
      .click();
    await expect(page).toHaveURL(COMMUNITY_BASE);
    const contextualNavigation = page.getByRole("group", {
      name: "Navegação contextual do feed",
    });
    await expect(
      contextualNavigation.getByRole("button", { name: "Posts" }),
    ).toHaveAttribute("aria-pressed", "true");
    await contextualNavigation.getByRole("button", { name: "Grupos" }).click();
    const groupsTab = page.locator(
      '[data-community-feed-context-panel="groups"]',
    );
    await expect(groupsTab).toBeVisible();
    await expect(
      groupsTab.getByRole("link", { name: "Ver todos" }),
    ).toHaveAttribute("href", `${COMMUNITY_BASE}/grupos`);
    await groupsTab.getByRole("link", { name: "Ver todos" }).click();
    await expect(page).toHaveURL(`${COMMUNITY_BASE}/grupos`);
    await expect(page.locator("#groups-view")).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(COMMUNITY_BASE);
    await expect(page.locator("#feed")).toBeVisible();
  });

  test("module presentation stays responsive across the supported width matrix", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPublicRoute(page, `${COMMUNITY_BASE}/empresas`, {
      waitUntil: "domcontentloaded",
      dismissConsent: true,
    });
    await expectRouteReady(page, {
      expectedUrlPart: `${COMMUNITY_BASE}/empresas`,
      readyPattern: /Pituba|Empresas/i,
    });

    for (const width of [320, 390, 768, 1024, 1366, 1536]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await expect(
        page.locator(".neighborhood-community-header"),
      ).toBeVisible();
      await expect(page.locator(".neighborhood-community-header")).toHaveCount(
        1,
      );
      await expect(
        page.locator('[data-community-module-content="business"]'),
      ).toBeVisible();

      const dimensions = await page.evaluate(() => ({
        viewportWidth: document.documentElement.clientWidth,
        contentWidth: document.documentElement.scrollWidth,
      }));
      expect(
        dimensions.contentWidth,
        `horizontal overflow at ${width}px`,
      ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);

      if (width <= 390) {
        const heroHeight = await page
          .locator('[data-community-hero="true"]')
          .evaluate((element) => element.getBoundingClientRect().height);
        expect(
          heroHeight,
          `community hero height at ${width}px`,
        ).toBeLessThanOrEqual(230);
      }
    }

    await page.setViewportSize({ width: 390, height: 844 });

    await page.screenshot({
      path: testInfo.outputPath("community-business-mobile.png"),
      fullPage: true,
    });

    const sectionsTrigger = page.locator(
      '[data-community-sections-trigger="true"]',
    );
    await expect(sectionsTrigger).toBeVisible();
    await sectionsTrigger.click();
    const sectionsMenu = page.locator('[data-community-sections-menu="true"]');
    await expect(sectionsMenu).toBeVisible();
    await sectionsMenu
      .locator('[data-community-nav-item="classifieds"]')
      .click();
    await expect(page).toHaveURL(`${COMMUNITY_BASE}/classificados`);
    await expect(
      page.locator('[data-community-module-content="classifieds"]'),
    ).toBeVisible();
    await expect(sectionsMenu).toHaveCount(0);
    await expect(page.locator(".neighborhood-community-header")).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Abrir menu principal" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: "Navegacao principal mobile" }),
    ).toBeVisible();

    const bottomNavigation = page.getByRole("navigation", {
      name: "Navegacao principal mobile",
    });
    await expect(
      bottomNavigation.locator("[data-bottom-nav-item]"),
    ).toHaveCount(5);
    await expect(
      bottomNavigation.getByRole("button", { name: "Explorar", exact: true }),
    ).toBeVisible();
    await expect(
      bottomNavigation.getByRole("button", { name: "Busca", exact: true }),
    ).toBeVisible();
    await expect(
      bottomNavigation.getByRole("button", { name: "Empresas", exact: true }),
    ).toHaveCount(0);
    await expect(
      bottomNavigation.getByRole("button", { name: "Anúncios", exact: true }),
    ).toHaveCount(0);

    await bottomNavigation.getByRole("button", { name: "Mais opções" }).click();
    await expect(
      page.getByRole("heading", { name: "Explorar cidade" }),
    ).toBeVisible();
    await expect(page.locator("[data-bottom-nav-more-item]")).toHaveCount(5);
    await page.locator('[data-bottom-nav-more-item="empresas"]').click();
    await expect(page).toHaveURL("/empresas/ba/salvador");
  });

  test("mobile keeps posts, groups and discussions as contextual feed views", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPublicRoute(
      page,
      `${COMMUNITY_BASE}?view=business&visualMock=community-concept`,
      { waitUntil: "domcontentloaded", dismissConsent: true },
    );
    await expectRouteReady(page, {
      expectedUrlPart: "view=business",
      readyPattern: /Pituba|Empresas da comunidade/i,
    });

    const primaryNavigation = page.locator(
      '[data-community-mobile-primary-nav="true"]',
    );
    await expect(
      primaryNavigation.locator('[data-community-nav-item="feed"]'),
    ).toBeVisible();
    await expect(
      primaryNavigation.locator('[data-community-nav-item="business"]'),
    ).toBeVisible();
    await expect(
      primaryNavigation.locator('[data-community-nav-item="business"]'),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      primaryNavigation.locator('[data-community-nav-item="feed"]'),
    ).toHaveAttribute("aria-pressed", "false");
    await expect(
      primaryNavigation.locator('[data-community-nav-item="services"]'),
    ).toBeVisible();
    await expect(
      primaryNavigation.locator('[data-community-nav-item="groups"]'),
    ).toHaveCount(0);
    await expect(
      primaryNavigation.locator('[data-community-nav-item="discussions"]'),
    ).toHaveCount(0);

    await expect(
      page.getByRole("heading", { name: "Empresas da comunidade" }),
    ).toBeVisible();
    await expect(page.getByText("Negócio local")).toHaveCount(3);
    await expect(
      page.locator('[data-community-feed-discovery="true"]'),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Ver todas as empresas" }),
    ).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      contentWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.contentWidth).toBeLessThanOrEqual(
      dimensions.viewportWidth + 1,
    );

    await page.screenshot({
      path: testInfo.outputPath("community-business-preview-mobile.png"),
      fullPage: true,
    });

    await openPublicRoute(
      page,
      `${COMMUNITY_BASE}?visualMock=community-concept`,
      {
        waitUntil: "domcontentloaded",
        dismissConsent: true,
      },
    );
    await expectRouteReady(page, {
      expectedUrlPart: COMMUNITY_BASE,
      readyPattern: /Pituba|Posts|Compartilhe algo/i,
    });
    await expect(
      page.locator('[data-community-feed-discovery="true"]'),
    ).toHaveCount(0);
    await expect(page.locator("#feed-groups-tab")).toHaveCount(0);
    await expect(page.locator("#feed-discussions-tab")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Sobre Pituba" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Álbuns da comunidade" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Regras da comunidade" }),
    ).toHaveCount(0);
    await expect(
      page.locator(
        '[data-community-mobile-primary-nav="true"] [data-community-nav-item="feed"]',
      ),
    ).toHaveAttribute("aria-pressed", "true");

    await page.screenshot({
      path: testInfo.outputPath("community-posts-mobile.png"),
      fullPage: true,
    });

    const contextualNavigation = page.getByRole("group", {
      name: "Navegação contextual do feed",
    });
    await expect(
      contextualNavigation.getByRole("button", { name: "Posts" }),
    ).toBeVisible();
    await expect(
      contextualNavigation.getByRole("button", { name: "Para você" }),
    ).toHaveCount(0);
    await expect(
      contextualNavigation.getByRole("button", { name: "Perguntas" }),
    ).toHaveCount(0);
    await expect(
      contextualNavigation.getByRole("button", { name: "Grupos" }),
    ).toBeVisible();
    await expect(
      contextualNavigation.getByRole("button", { name: "Discussões" }),
    ).toBeVisible();
    const postSort = page.getByRole("group", { name: "Ordenação dos posts" });
    await expect(postSort).toBeVisible();
    await expect(
      postSort.getByRole("button", { name: "Melhores" }),
    ).toHaveAttribute("aria-pressed", "true");

    const feedUrl = page.url();
    await contextualNavigation.getByRole("button", { name: "Grupos" }).click();
    await expect(page).toHaveURL(feedUrl);
    await expect(
      page.locator('[data-community-feed-context-panel="groups"]'),
    ).toBeVisible();
    await expect(
      contextualNavigation.getByRole("button", { name: "Grupos" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      primaryNavigation.locator('[data-community-nav-item="feed"]'),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page
        .locator('[data-community-feed-context-panel="groups"]')
        .getByRole("link", { name: "Ver todos" }),
    ).toHaveAttribute("href", `${COMMUNITY_BASE}/grupos`);
    await expect(postSort).toHaveCount(0);

    await contextualNavigation.getByRole("button", { name: "Posts" }).click();
    await expect(page).toHaveURL(feedUrl);
    await expect(
      page.getByRole("group", { name: "Ordenação dos posts" }),
    ).toBeVisible();
    await expect(page.locator("#feed-groups-tab")).toHaveCount(0);
    await expect(page.locator("#feed-discussions-tab")).toHaveCount(0);

    await page
      .getByRole("group", { name: "Navegação contextual do feed" })
      .getByRole("button", { name: "Discussões" })
      .click();
    await expect(page).toHaveURL(feedUrl);
    await expect(
      page.locator('[data-community-feed-context-panel="discussions"]'),
    ).toBeVisible();
    await expect(
      page
        .getByRole("group", { name: "Navegação contextual do feed" })
        .getByRole("button", { name: "Discussões" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("public alias uses the same persistent shell contract", async ({
    page,
  }) => {
    const aliasBase = "/comunidade/pituba";
    const documentNavigations: string[] = [];
    page.on("request", (request) => {
      if (
        request.isNavigationRequest() &&
        request.frame() === page.mainFrame()
      ) {
        documentNavigations.push(request.url());
      }
    });
    await page.setViewportSize({ width: 1366, height: 900 });
    await openPublicRoute(page, aliasBase, {
      waitUntil: "domcontentloaded",
      dismissConsent: true,
    });
    await expectRouteReady(page, {
      expectedUrlPart: aliasBase,
      readyPattern: /Pituba|Feed|Comunidade/i,
    });
    await expect(
      page.locator('[data-community-territorial-shell="alias"]'),
    ).toBeVisible({
      timeout: 120_000,
    });
    await expect(page.locator(".neighborhood-community-header")).toBeVisible({
      timeout: 120_000,
    });

    await page.evaluate(() => {
      document
        .querySelector('[data-community-territorial-shell="alias"]')
        ?.setAttribute("data-persistence-probe", "original-shell");
      document
        .querySelector(".neighborhood-community-header")
        ?.setAttribute("data-persistence-probe", "original-header");
    });
    await expect(
      page.locator('[data-community-territorial-shell="alias"]'),
    ).toHaveAttribute("data-persistence-probe", "original-shell");
    await expect(
      page.locator(".neighborhood-community-header"),
    ).toHaveAttribute("data-persistence-probe", "original-header");
    documentNavigations.length = 0;

    const navigation = page.getByRole("navigation", {
      name: "Navegacao da comunidade",
    });
    await navigation
      .getByRole("button", { name: "Empresas", exact: true })
      .click();

    await expect(page).toHaveURL(`${aliasBase}?view=business`);
    await expect(
      page.getByRole("heading", { name: "Empresas da comunidade" }),
    ).toBeVisible();
    expect(documentNavigations).toEqual([]);
    await expect(
      page.locator('[data-community-territorial-shell="alias"]'),
    ).toHaveAttribute("data-persistence-probe", "original-shell");
    await expect(
      page.locator(".neighborhood-community-header"),
    ).toHaveAttribute("data-persistence-probe", "original-header");

    await page.getByRole("link", { name: "Ver todas as empresas" }).click();

    await expect(page).toHaveURL(`${aliasBase}/empresas`);
    await expect(
      page.locator('[data-community-module-content="business"]'),
    ).toBeVisible();
    expect(documentNavigations).toEqual([]);
    await expect(
      page.locator('[data-community-territorial-shell="alias"]'),
    ).toHaveAttribute("data-persistence-probe", "original-shell");
    await expect(
      page.locator(".neighborhood-community-header"),
    ).toHaveAttribute("data-persistence-probe", "original-header");
  });
});

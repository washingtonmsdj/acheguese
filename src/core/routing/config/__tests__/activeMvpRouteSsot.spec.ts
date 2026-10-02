import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  ACCOUNT_PATHS,
  ACCOUNT_ROUTE_PATTERNS,
} from "@/core/routing/config/account";
import { centralRoutes } from "@/core/routing/config/centralRoutes";
import { STATIC_ROUTE_PATHS } from "@/core/routing/config/staticRoutePaths";
import {
  DATA_PROTECTION_CONTACT_PATH,
  PRIVACY_POLICY_PATH,
  TERMS_OF_SERVICE_PATH,
} from "@/shared/constants/legal";
import {
  APP_MODULE_SLUGS,
  buildAppModulePath,
} from "@/shared/config/moduleSlugs";

describe("active MVP route SSOT", () => {
  it("keeps canonical standalone MVP paths owned by route configuration", () => {
    expect(buildAppModulePath(APP_MODULE_SLUGS.business)).toBe("/empresas");
    expect(buildAppModulePath(APP_MODULE_SLUGS.business, "cadastrar")).toBe(
      "/empresas/cadastrar",
    );
    expect(buildAppModulePath(APP_MODULE_SLUGS.map)).toBe("/mapa");
    expect(buildAppModulePath(APP_MODULE_SLUGS.nearby)).toBe("/perto-de-mim");
    expect(buildAppModulePath(APP_MODULE_SLUGS.search)).toBe("/busca");

    expect(STATIC_ROUTE_PATHS.searchAlias).toBe("/buscar");
    expect(STATIC_ROUTE_PATHS.notifications).toBe("/notificacoes");
    expect(STATIC_ROUTE_PATHS.howItWorks).toBe("/como-funciona");
    expect(STATIC_ROUTE_PATHS.about).toBe("/sobre");
    expect(centralRoutes.home).toBe("/central");
    expect(centralRoutes.admin.home).toBe("/admin");

    expect(ACCOUNT_PATHS.home).toBe("/conta");
    expect(ACCOUNT_ROUTE_PATTERNS.editProfile).toBe("/conta/editar/:profileId");
    expect(TERMS_OF_SERVICE_PATH).toBe("/termos");
    expect(PRIVACY_POLICY_PATH).toBe("/privacidade");
    expect(DATA_PROTECTION_CONTACT_PATH).toBe("/dpo");
  });

  it("makes the active route tree consume canonical owners instead of route literals", () => {
    const appRoutes = readFileSync("src/app/routes/AppRoutes.tsx", "utf8");
    const appLayout = readFileSync(
      "src/app/routes/sections/AppLayoutRoutes.tsx",
      "utf8",
    );

    expect(appRoutes).toContain("STATIC_ROUTE_PATHS.howItWorks");
    expect(appRoutes).toContain("STATIC_ROUTE_PATHS.about");
    expect(appRoutes).toContain("SUPPORT_PATH");
    expect(appRoutes).toContain("centralRoutes.home");
    expect(appRoutes).toContain("centralRoutes.admin.home");
    expect(appRoutes).not.toContain('path="/central/*"');
    expect(appRoutes).not.toContain('path="/admin/*"');

    expect(appLayout).toContain("buildAppModulePath(APP_MODULE_SLUGS.business)");
    expect(appLayout).toContain("buildAppModulePath(APP_MODULE_SLUGS.map)");
    expect(appLayout).toContain("buildAppModulePath(APP_MODULE_SLUGS.nearby)");
    expect(appLayout).toContain("buildAppModulePath(APP_MODULE_SLUGS.search)");
    expect(appLayout).toContain("STATIC_ROUTE_PATHS.searchAlias");
    expect(appLayout).toContain("STATIC_ROUTE_PATHS.notifications");
    expect(appLayout).toContain("ACCOUNT_PATHS.home");
    expect(appLayout).toContain("ACCOUNT_ROUTE_PATTERNS.editProfile");
    expect(appLayout).toContain("TERMS_OF_SERVICE_PATH");
    expect(appLayout).toContain("PRIVACY_POLICY_PATH");
    expect(appLayout).toContain("DATA_PROTECTION_CONTACT_PATH");

    for (const literal of [
      'path="/empresas"',
      'path="/empresas/cadastrar"',
      'path="/mapa"',
      'path="/perto-de-mim"',
      'path="/busca"',
      'path="/buscar"',
      'path="/notificacoes"',
      'path="/conta"',
      'path="/termos"',
      'path="/privacidade"',
      'path="/dpo"',
    ]) {
      expect(appLayout).not.toContain(literal);
    }
  });

  it("keeps migrated public consumers free of canonical route literals", () => {
    const territoryEntry = readFileSync(
      "src/app/pages/TerritoryEntryPage.tsx",
      "utf8",
    );
    const businessShell = readFileSync(
      "src/modules/business/company/pages/EmpresaDetailLayout.tsx",
      "utf8",
    );
    const businessDetail = readFileSync(
      "src/modules/business/company/pages/TerritoryBusinessDetail.tsx",
      "utf8",
    );
    const centralHeader = readFileSync(
      "src/modules/central/components/CentralHeader.tsx",
      "utf8",
    );
    const territoryTopbar = readFileSync(
      "src/shared/components/territory-vivo/TerritoryTopbar.tsx",
      "utf8",
    );
    const topbarNavigationOwner = readFileSync(
      "src/core/routing/config/territoryTopbarNavigation.ts",
      "utf8",
    );
    const searchPage = readFileSync("src/app/pages/BuscaPage.tsx", "utf8");
    const communityPage = readFileSync(
      "src/core/community-feed/pages/ComunidadePage.tsx",
      "utf8",
    );
    const professionalPage = readFileSync(
      "src/modules/professionals/pages/ProfissionalPublicPage.tsx",
      "utf8",
    );
    const useAppUrls = readFileSync(
      "src/core/routing/hooks/useAppUrls.ts",
      "utf8",
    );
    const prefetch = readFileSync("src/app/routes/prefetch.ts", "utf8");
    const notificationScope = readFileSync(
      "src/app/config/notificationActionScope.ts",
      "utf8",
    );

    for (const literal of [
      'href="/"',
      'href="/sobre"',
      'href="/como-funciona"',
      'href="/conta/preferencias#acessibilidade"',
    ]) {
      expect(territoryEntry).not.toContain(literal);
    }

    expect(territoryEntry).toContain("getStateByCode(LAUNCH_STATE)");
    expect(territoryEntry).toContain("launchCommunityPresentation.label");
    expect(territoryEntry).not.toContain('LAUNCH_STATE === "ba"');
    expect(territoryEntry).not.toContain("Agora no Complexo");
    expect(territoryEntry).not.toContain("Comece pelo Complexo");
    expect(territoryEntry).not.toContain(
      "nasce no Complexo do Nordeste de Amaralina",
    );

    for (const literal of [
      'to="/buscar"',
      'to="/notificacoes"',
      "navigate('/conta')",
      "navigate('/termos')",
      "navigate('/privacidade')",
    ]) {
      expect(businessShell).not.toContain(literal);
    }

    for (const literal of [
      'to="/perto-de-mim"',
      'to="/busca"',
      'to="/mapa"',
      'to="/como-funciona"',
      '${territoryUrl}/perto-de-mim',
      '${territoryUrl}/busca',
      '${territoryUrl}/mapa',
    ]) {
      expect(businessDetail).not.toContain(literal);
    }

    for (const literal of ['to="/sobre"', 'to="/notificacoes"', 'to="/conta"']) {
      expect(centralHeader).not.toContain(literal);
    }

    expect(territoryTopbar).not.toContain("@/core/");
    expect(territoryTopbar).toContain("navigation.home");
    expect(territoryTopbar).toContain("navigation.notifications");
    expect(territoryTopbar).toContain("navigation.login");
    expect(territoryTopbar).toContain("navigation.account");
    expect(territoryTopbar).toContain("navigation.messages");

    expect(topbarNavigationOwner).toContain("STATIC_ROUTE_PATHS.notifications");
    expect(topbarNavigationOwner).toContain("AUTH_PATHS.login");
    expect(topbarNavigationOwner).toContain("ACCOUNT_PATHS.home");
    expect(topbarNavigationOwner).toContain("messagingRoutes.inbox()");

    for (const caller of [searchPage, communityPage, professionalPage]) {
      expect(caller).toContain("TERRITORY_TOPBAR_NAVIGATION");
      expect(caller).toContain("navigation={TERRITORY_TOPBAR_NAVIGATION}");
    }

    expect(useAppUrls).toContain(
      "buildModuleTerritoryUrl(MODULE_SLUGS.map, cityBase)",
    );
    expect(useAppUrls).not.toContain("`/mapa${cityBase}`");
    expect(useAppUrls).not.toContain("notifications: '/notificacoes'");
    expect(prefetch).not.toContain('href: "/notificacoes"');
    expect(notificationScope).toContain(
      "NOTIFICATION_INBOX_PATH = STATIC_ROUTE_PATHS.notifications",
    );
    expect(notificationScope).not.toContain(
      'NOTIFICATION_INBOX_PATH = "/notificacoes"',
    );
  });
});

/**
 * AppLayoutSidebar
 *
 * Layout global unificado da aplicação autenticada e das superfícies públicas
 * que ainda não possuem shell territorial próprio.
 *
 * Mensagens e Notificações são capabilities horizontais ativas e participam
 * deste shell independentemente das verticais que forneçam providers/eventos.
 * Domínios pausados permanecem fora da navegação e do grafo ativo.
 */

import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { getActiveTerritoryNavigationModeIds } from "@/app/config/territoryNavigationScope";
import { prefetchRouteByHref, scheduleIdleRouteWarmup } from "@/app/routes/prefetch";
import { TerritoryMismatchBanner } from "@/core/location/components/TerritoryMismatchBanner";
import { messagingRoutes } from "@/core/messaging/routes/messagingRoutes";
import { BottomNav } from "@/core/navigation/BottomNav";
import {
  ACCOUNT_PATHS,
  ACCOUNT_SETTINGS_SHELL_PATHS,
} from "@/core/routing/config/account";
import { OFFLINE_SETTINGS_PATH } from "@/core/routing/config/platformSettings";
import { isReservedSlug } from "@/core/routing/reservedSlugs";
import { parsePublicTerritoryPath } from "@/core/routing/utils/publicTerritoryPath";
import { MODULE_SLUGS } from "@/core/routing/utils/territoryUrls";
import { getAppModuleSlugFromPath } from "@/shared/config/moduleSlugs";
import {
  DATA_PROTECTION_CONTACT_PATH,
  PRIVACY_POLICY_PATH,
  TERMS_OF_SERVICE_PATH,
} from "@/shared/constants/legal";
import { SidebarProvider } from "@/shared/components/ui/sidebar";
import { AppSidebar } from "./navigation/AppSidebar";
import { AppTopbar } from "./navigation/AppTopbar";
import { TerritoryAdaptiveNavigation } from "./territory-vivo";

const TERRITORY_PORTAL_MODULES = new Set<string>([
  MODULE_SLUGS.business,
  MODULE_SLUGS.map,
  MODULE_SLUGS.nearby,
  MODULE_SLUGS.search,
]);

const CHILD_OWNED_MAIN_ROUTES = new Set<string>([
  messagingRoutes.inbox(),
  TERMS_OF_SERVICE_PATH,
  PRIVACY_POLICY_PATH,
  OFFLINE_SETTINGS_PATH,
  DATA_PROTECTION_CONTACT_PATH,
]);

export function AppLayoutSidebar() {
  const { pathname } = useLocation();
  const activeNavigationModeIds = getActiveTerritoryNavigationModeIds();

  useEffect(() => {
    scheduleIdleRouteWarmup();
  }, []);

  const pathSegments = pathname.split("/").filter(Boolean);
  const parsedTerritory = parsePublicTerritoryPath(pathname);
  const hasCanonicalTerritory = Boolean(
    parsedTerritory.state && parsedTerritory.city,
  );
  const territorialModuleSlug = getAppModuleSlugFromPath(pathname);
  const isBarePublicTerritorialRoute =
    hasCanonicalTerritory &&
    !territorialModuleSlug &&
    pathSegments.length >= 2 &&
    pathSegments.length <= 3 &&
    !isReservedSlug(pathSegments[0] ?? "");
  const isCanonicalTerritorialModuleRoute =
    hasCanonicalTerritory && Boolean(territorialModuleSlug);
  const isTerritoryPortalModuleRoute = Boolean(
    parsedTerritory.territorySlug &&
      pathSegments.length === 4 &&
      territorialModuleSlug &&
      TERRITORY_PORTAL_MODULES.has(territorialModuleSlug),
  );
  const isTerritoryBusinessDetailRoute = Boolean(
    parsedTerritory.territorySlug &&
      pathSegments.length === 5 &&
      territorialModuleSlug === MODULE_SLUGS.business,
  );
  const isPublicBusinessLandingRoute =
    pathSegments[0] === MODULE_SLUGS.business &&
    pathSegments[1] !== "cadastrar";
  const isBusinessRegistrationRoute = pathname === "/empresas/cadastrar";
  const isAccountRoute = pathSegments[0] === "conta";
  const isAccountOverview = pathname === ACCOUNT_PATHS.home;
  const accountUsesSettingsShell = ACCOUNT_SETTINGS_SHELL_PATHS.has(pathname);
  const isPublicPersonalProfileRoute =
    pathSegments[0] === "u" && pathSegments.length === 2;
  const usesTerritoryVivoShell =
    (isCanonicalTerritorialModuleRoute &&
      !isTerritoryPortalModuleRoute &&
      !isTerritoryBusinessDetailRoute) ||
    isAccountRoute ||
    isPublicPersonalProfileRoute;

  const hideGlobalSidebar =
    pathname === "/" ||
    isBarePublicTerritorialRoute ||
    isTerritoryPortalModuleRoute ||
    isTerritoryBusinessDetailRoute ||
    isPublicBusinessLandingRoute ||
    isBusinessRegistrationRoute;

  const isConversationRoute =
    pathSegments[0] === "mensagens" && pathSegments.length >= 3;
  const childOwnsMainLandmark = CHILD_OWNED_MAIN_ROUTES.has(pathname);
  const useDocumentScrollPublicShell =
    pathname === "/" ||
    isBarePublicTerritorialRoute ||
    isTerritoryPortalModuleRoute ||
    isTerritoryBusinessDetailRoute ||
    isPublicBusinessLandingRoute ||
    isBusinessRegistrationRoute;
  const hideMobileBottomNav =
    pathname === "/" ||
    isBarePublicTerritorialRoute ||
    isTerritoryPortalModuleRoute ||
    isTerritoryBusinessDetailRoute ||
    isConversationRoute ||
    isBusinessRegistrationRoute;

  if (isConversationRoute) {
    return (
      <div className="messaging-route-shell h-[100dvh] w-full overflow-hidden bg-territory-canvas">
        <Outlet />
      </div>
    );
  }

  if (usesTerritoryVivoShell) {
    return (
      <>
        <div
          className={
            accountUsesSettingsShell
              ? "territory-vivo w-full"
              : "territory-vivo w-full md:pl-[4.5rem] xl:pl-44"
          }
        >
          <div
            id={accountUsesSettingsShell ? undefined : "main-content"}
            className="territory-vivo-safe-bottom min-h-[100dvh] min-w-0 max-md:h-[100dvh] max-md:overflow-y-auto max-md:scrollbar-hide"
            tabIndex={accountUsesSettingsShell ? undefined : -1}
          >
            <TerritoryMismatchBanner />
            <Outlet />
          </div>
        </div>
        <TerritoryAdaptiveNavigation
          hideMobile={accountUsesSettingsShell && !isAccountOverview}
          hideDesktop={accountUsesSettingsShell}
        />
      </>
    );
  }

  if (hideGlobalSidebar) {
    return (
      <>
        <div
          className={
            useDocumentScrollPublicShell
              ? "flex min-h-screen w-full bg-territory-canvas"
              : "flex h-screen w-full overflow-hidden bg-territory-canvas"
          }
        >
          <main
            id="main-content"
            className={
              useDocumentScrollPublicShell
                ? hideMobileBottomNav
                  ? "flex-1 flex flex-col min-w-0"
                  : "flex-1 flex flex-col min-w-0 pb-[calc(env(safe-area-inset-bottom)+6rem)]"
                : hideMobileBottomNav
                  ? "flex-1 overflow-y-auto flex flex-col min-h-0"
                  : "flex-1 overflow-y-auto flex flex-col min-h-0 pb-[calc(env(safe-area-inset-bottom)+6rem)]"
            }
            tabIndex={-1}
          >
            <TerritoryMismatchBanner />
            <div
              className={
                useDocumentScrollPublicShell ? "flex-1" : "flex-1 min-h-0"
              }
            >
              <Outlet />
            </div>
          </main>
        </div>
        {!hideMobileBottomNav ? (
          <BottomNav
            prefetchRoute={prefetchRouteByHref}
            visibleModeIds={activeNavigationModeIds}
          />
        ) : null}
      </>
    );
  }

  const MainContentElement = childOwnsMainLandmark ? "div" : "main";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-territory-canvas">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0 w-full">
          <AppTopbar />
          <MainContentElement
            id={childOwnsMainLandmark ? undefined : "main-content"}
            className="flex-1 p-4 md:p-6 pb-20 md:pb-6 w-full overflow-y-auto"
            tabIndex={childOwnsMainLandmark ? undefined : -1}
          >
            <TerritoryMismatchBanner />
            <Outlet />
          </MainContentElement>
        </div>
      </div>
      {!hideMobileBottomNav ? (
        <BottomNav
          prefetchRoute={prefetchRouteByHref}
          visibleModeIds={activeNavigationModeIds}
        />
      ) : null}
    </SidebarProvider>
  );
}

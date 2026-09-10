/**
 * AppLayoutSidebar
 *
 * Layout global unificado: sidebar completa com navegação integrada + topbar + bottom nav mobile.
 *
 * ✅ Sidebar contém: logo, território, navegação, mensagens, notificações, perfil, tema
 * ✅ Topbar com ações rápidas (notificações, mensagens, perfil, logout)
 * ✅ Bottom nav apenas no mobile
 * ✅ Estrutura idêntica à Central
 */

import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/shared/components/ui/sidebar";
import { AppSidebar } from "./navigation/AppSidebar";
import { AppTopbar } from "./navigation/AppTopbar";
import { BottomNav } from "@/core/navigation/BottomNav";
import { TerritoryAdaptiveNavigation } from "./territory-vivo";
import { TerritoryMismatchBanner } from "@/core/location/components/TerritoryMismatchBanner";
import { prefetchRouteByHref, scheduleIdleRouteWarmup } from "@/app/routes/prefetch";
import { isReservedSlug } from "@/core/routing/reservedSlugs";
import {
  MODULE_SLUGS,
  isCommunityRouteSuffixSegment,
} from "@/core/routing/utils/territoryUrls";

export function AppLayoutSidebar() {
  const { pathname } = useLocation();
  useEffect(() => {
    scheduleIdleRouteWarmup();
  }, []);

  const pathSegments = pathname.split("/").filter(Boolean);
  const isBarePublicTerritorialRoute =
    pathSegments.length >= 2 &&
    pathSegments.length <= 3 &&
    /^[a-z]{2}$/i.test(pathSegments[0] ?? "") &&
    !isReservedSlug(pathSegments[0] ?? "");
  const isCommunityPublicLandingRoute =
    pathSegments[0] === MODULE_SLUGS.community;
  const isCommunityAliasPublicRoute =
    pathSegments[0] === MODULE_SLUGS.community &&
    Boolean(pathSegments[1]) &&
    !/^[a-z]{2}$/i.test(pathSegments[1] ?? "");
  const isShortCommunityRoute =
    Boolean(pathSegments[0]) &&
    !/^[a-z]{2}$/i.test(pathSegments[0] ?? "") &&
    !isReservedSlug(pathSegments[0] ?? "") &&
    (pathSegments.length === 1 ||
      isCommunityRouteSuffixSegment(pathSegments[1]) ||
      (pathSegments.length === 2 && !isReservedSlug(pathSegments[1] ?? "")));
  const isPublicBusinessLandingRoute =
    pathname === "/empresas-landing" ||
    (pathSegments[0] === MODULE_SLUGS.business &&
      pathSegments[1] !== "cadastrar");
  const isTerritoryVivoExploreRoute =
    pathSegments[0] === MODULE_SLUGS.search &&
    (pathSegments.length === 1 ||
      (/^[a-z]{2}$/i.test(pathSegments[1] ?? "") &&
        pathSegments.length >= 3 &&
        pathSegments.length <= 4));
  const isAccountRoute = pathSegments[0] === "conta";
  const conceptAccountPreview =
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    isAccountRoute &&
    new URLSearchParams(window.location.search).get("concept-mock") === "1";
  const isPublicPersonalProfileRoute =
    pathSegments[0] === "u" && pathSegments.length === 2;
  const isProfessionalPublicRoute =
    pathSegments[0] === MODULE_SLUGS.services &&
    pathSegments[3] === "profissional" &&
    pathSegments.length >= 5;
  const usesTerritoryVivoShell =
    isBarePublicTerritorialRoute ||
    isTerritoryVivoExploreRoute ||
    isCommunityPublicLandingRoute ||
    isAccountRoute ||
    isPublicPersonalProfileRoute ||
    isProfessionalPublicRoute;

  // Ocultar sidebar na home e na página de perfil (que tem sua própria sidebar)
  const hideGlobalSidebar =
    pathname === "/" ||
    isBarePublicTerritorialRoute ||
    isTerritoryVivoExploreRoute ||
    isCommunityPublicLandingRoute ||
    isCommunityAliasPublicRoute ||
    isShortCommunityRoute ||
    isPublicBusinessLandingRoute;

  const isInternalGroupRoute =
    pathSegments[0] === "grupos" && pathSegments.length >= 2;
  const isConversationRoute =
    pathSegments[0] === "chat" && pathSegments.length >= 2;
  const isPublicEntityDetailRoute =
    isShortCommunityRoute &&
    pathSegments.length === 2 &&
    !isReservedSlug(pathSegments[1] ?? "") &&
    !isCommunityRouteSuffixSegment(pathSegments[1] ?? "");
  const useDocumentScrollPublicShell =
    isPublicEntityDetailRoute ||
    pathname === "/" ||
    isBarePublicTerritorialRoute ||
    isCommunityPublicLandingRoute ||
    isCommunityAliasPublicRoute ||
    isShortCommunityRoute ||
    isPublicBusinessLandingRoute;
  const hideMobileBottomNav =
    pathname === "/" ||
    isInternalGroupRoute ||
    isConversationRoute ||
    isPublicEntityDetailRoute ||
    isCommunityPublicLandingRoute ||
    isCommunityAliasPublicRoute;

  const isMessagingRoute =
    pathSegments[0] === "mensagens" || pathSegments[0] === "chat";

  if (isMessagingRoute) {
    return (
      <div className="min-h-[100dvh] w-full bg-territory-canvas">
        <Outlet />
      </div>
    );
  }

  // Se deve ocultar a sidebar global, renderizar apenas o conteúdo
  if (usesTerritoryVivoShell) {
    return (
      <>
        <div className="territory-vivo w-full md:pl-[4.5rem] xl:pl-44">
          <div
            id="main-content"
            className="territory-vivo-safe-bottom min-h-[100dvh] min-w-0 max-md:h-[100dvh] max-md:overflow-y-auto max-md:scrollbar-hide"
            tabIndex={-1}
          >
            <TerritoryMismatchBanner />
            <Outlet />
          </div>
        </div>
        <TerritoryAdaptiveNavigation
          hideMobile={isProfessionalPublicRoute || conceptAccountPreview}
          hideDesktop={conceptAccountPreview}
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
              ? "flex min-h-screen w-full bg-background"
              : "flex h-screen w-full overflow-hidden bg-background"
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
        {!hideMobileBottomNav ? <BottomNav prefetchRoute={prefetchRouteByHref} /> : null}
      </>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar unificada com tudo */}
        <AppSidebar />

        {/* Conteúdo principal com topbar */}
        <div className="flex-1 flex flex-col min-w-0 w-full">
          <AppTopbar />
          <main
            id="main-content"
            className="flex-1 p-4 md:p-6 pb-20 md:pb-6 w-full overflow-y-auto"
            tabIndex={-1}
          >
            <TerritoryMismatchBanner />
            <Outlet />
          </main>
        </div>
      </div>
      {!hideMobileBottomNav ? <BottomNav prefetchRoute={prefetchRouteByHref} /> : null}
    </SidebarProvider>
  );
}

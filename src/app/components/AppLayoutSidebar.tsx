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

import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/shared/components/ui/sidebar';
import { AppSidebar } from './navigation/AppSidebar';
import { AppTopbar } from './navigation/AppTopbar';
import { BottomNav } from './BottomNav';
import { TerritoryMismatchBanner } from '@/core/location/components/TerritoryMismatchBanner';
import { scheduleIdleRouteWarmup } from '@/app/routes/prefetch';
import { isReservedSlug } from '@/core/routing/reservedSlugs';
import { MODULE_SLUGS, isCommunityRouteSuffixSegment } from '@/core/routing/utils/territoryUrls';

export function AppLayoutSidebar() {
  const { pathname } = useLocation();
  useEffect(() => {
    scheduleIdleRouteWarmup();
  }, []);

  const pathSegments = pathname.split('/').filter(Boolean);
  const isBarePublicTerritorialRoute =
    pathSegments.length >= 2 &&
    pathSegments.length <= 3 &&
    /^[a-z]{2}$/i.test(pathSegments[0] ?? '') &&
    !isReservedSlug(pathSegments[0] ?? '');
  const isCommunityPublicLandingRoute =
    pathSegments[0] === MODULE_SLUGS.community &&
    /^[a-z]{2}$/i.test(pathSegments[1] ?? '') &&
    Boolean(pathSegments[2]) &&
    (
      pathSegments.length === 3 ||
      (pathSegments.length === 4 && !isCommunityRouteSuffixSegment(pathSegments[3]))
    );
  const isShortCommunityRoute =
    Boolean(pathSegments[0]) &&
    !/^[a-z]{2}$/i.test(pathSegments[0] ?? '') &&
    !isReservedSlug(pathSegments[0] ?? '') &&
    (
      pathSegments.length === 1 ||
      isCommunityRouteSuffixSegment(pathSegments[1])
    );

  // Ocultar sidebar na home e na página de perfil (que tem sua própria sidebar)
  const hideGlobalSidebar =
    pathname === '/' ||
    pathname.startsWith('/conta') ||
    isBarePublicTerritorialRoute ||
    isCommunityPublicLandingRoute ||
    isShortCommunityRoute;

  const isInternalGroupRoute =
    pathSegments[0] === 'grupos' && pathSegments.length >= 2;
  const isConversationRoute =
    pathSegments[0] === 'chat' && pathSegments.length >= 2;
  const hideMobileBottomNav = isInternalGroupRoute || isConversationRoute;

  // Se deve ocultar a sidebar global, renderizar apenas o conteúdo
  if (hideGlobalSidebar) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <main id="main-content" className="flex-1 overflow-y-auto flex flex-col min-h-0" tabIndex={-1}>
          <TerritoryMismatchBanner />
          <div className="flex-1 min-h-0">
            <Outlet />
          </div>
        </main>
      </div>
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
          <main id="main-content" className="flex-1 p-4 md:p-6 pb-20 md:pb-6 w-full overflow-y-auto" tabIndex={-1}>
            <TerritoryMismatchBanner />
            <Outlet />
          </main>
        </div>
      </div>
      {!hideMobileBottomNav ? <BottomNav /> : null}
    </SidebarProvider>
  );
}

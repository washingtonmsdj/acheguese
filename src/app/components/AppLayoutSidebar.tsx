/**
 * AppLayoutSidebar
 *
 * Layout global unificado: sidebar completa com navegação integrada + bottom nav mobile.
 * 
 * ✅ Sidebar contém: logo, território, navegação, mensagens, notificações, perfil
 * ✅ Sem topbar separada - tudo na sidebar
 * ✅ Bottom nav apenas no mobile
 */

import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/shared/components/ui/sidebar';
import { AppSidebar } from './navigation/AppSidebar';
import { BottomNav } from './BottomNav';
import { TerritoryMismatchBanner } from '@/core/location/components/TerritoryMismatchBanner';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { scheduleIdleRouteWarmup } from '@/app/routes/prefetch';

export function AppLayoutSidebar() {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  useEffect(() => {
    scheduleIdleRouteWarmup();
  }, []);

  const pathSegments = pathname.split('/').filter(Boolean);
  const isCommunityTerritorialPath =
    pathSegments[0] === 'comunidade' &&
    pathSegments.length >= 3;

  // Ocultar sidebar na home e na página de perfil (que tem sua própria sidebar)
  const hideGlobalSidebar = pathname === '/' || pathname.startsWith('/conta');

  const isInternalGroupRoute =
    pathSegments[0] === 'grupos' && pathSegments.length >= 2;
  const isConversationRoute =
    pathSegments[0] === 'chat' && pathSegments.length >= 2;
  const hideMobileBottomNav = isInternalGroupRoute || isConversationRoute;

  if (isCommunityTerritorialPath) {
    return (
      <div className="h-screen w-full overflow-hidden bg-background">
        <Outlet />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="h-screen bg-background flex flex-col w-full overflow-hidden">
        <TerritoryMismatchBanner />
        <main
          id="main-content"
          className={`flex-1 overflow-y-auto ${hideMobileBottomNav ? 'pb-0' : 'pb-16'}`}
          tabIndex={-1}
        >
          <Outlet />
        </main>
        {!hideMobileBottomNav ? <BottomNav /> : null}
      </div>
    );
  }

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
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Sidebar unificada com tudo */}
        <AppSidebar />
        
        {/* Conteúdo principal */}
        <main id="main-content" className="flex-1 overflow-y-auto flex flex-col min-h-0" tabIndex={-1}>
          <TerritoryMismatchBanner />
          <div className="flex-1 min-h-0">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

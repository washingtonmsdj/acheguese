/**
 * AppLayoutSidebar
 *
 * Layout global da aplicação: topbar fixo full-width + sidebar colapsável + bottom nav mobile.
 * 
 * ✅ Topbar ocupa 100% da largura (como na home)
 * ✅ Sidebar fica abaixo do topbar
 * ✅ Sem z-index, estrutura em flex column
 */

import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/shared/components/ui/sidebar';
import { AppSidebar } from './navigation/AppSidebar';
import { AppTopbar } from './AppTopbar';
import { BottomNav } from './BottomNav';
import { TerritoryMismatchBanner } from '@/core/location/components/TerritoryMismatchBanner';
import { useIsMobile } from '@/shared/hooks/use-mobile';

export function AppLayoutSidebar() {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const showTopbarOnMobile = pathname.startsWith('/gastronomia');
  
  // Ocultar sidebar na página de perfil (que tem sua própria sidebar)
  const hideGlobalSidebar = pathname.startsWith('/perfil');

  if (isMobile) {
    return (
      <div className="h-screen bg-background flex flex-col w-full overflow-hidden">
        {showTopbarOnMobile && <AppTopbar />}
        <TerritoryMismatchBanner />
        <main id="main-content" className="flex-1 overflow-y-auto pb-16" tabIndex={-1}>
          <Outlet />
        </main>
        <BottomNav />
      </div>
    );
  }

  // Se deve ocultar a sidebar global, renderizar apenas o conteúdo
  if (hideGlobalSidebar) {
    return (
      <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
        {/* Topbar fixo no topo, 100% largura */}
        <AppTopbar />
        
        {/* Conteúdo sem sidebar */}
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
      <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
        {/* Topbar fixo no topo, 100% largura */}
        <AppTopbar />
        
        {/* Sidebar + Conteúdo abaixo do topbar */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <AppSidebar />
          <main id="main-content" className="flex-1 overflow-y-auto flex flex-col min-h-0" tabIndex={-1}>
            <TerritoryMismatchBanner />
            <div className="flex-1 min-h-0">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

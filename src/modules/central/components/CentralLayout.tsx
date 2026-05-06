import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/shared/components/ui/sidebar";
import { CentralNavigation } from "@/modules/central/components/CentralNavigation";
import { CentralBreadcrumbs } from "@/modules/central/components/CentralBreadcrumbs";
import { TerritoryMismatchBanner } from "@/core/location/components/TerritoryMismatchBanner";

/**
 * CentralLayout
 * 
 * Layout próprio para rotas da Central (/central/*).
 * Usa navegação contextual específica da Central, separando gestão de negócios/perfis profissionais/mobilidade do perfil pessoal.
 * 
 * Desktop: sidebar com navegação lateral
 * Mobile: tabs/dropdown/accordion
 * 
 * Não mistura com sidebar de perfil pessoal (AppLayoutSidebar).
 */
export function CentralLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Navegação lateral específica da Central */}
        <CentralNavigation />
        
        {/* Conteúdo principal */}
        <main id="main-content" className="flex-1 overflow-y-auto flex flex-col min-h-0" tabIndex={-1}>
          <TerritoryMismatchBanner />
          <CentralBreadcrumbs />
          <div className="flex-1 min-h-0">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

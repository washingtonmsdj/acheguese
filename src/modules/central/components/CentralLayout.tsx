import type { ReactNode } from "react";
import { matchPath, Outlet, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SidebarProvider } from "@/shared/components/ui/sidebar";
import { CentralNavigation } from "@/modules/central/components/CentralNavigation";
import { CentralHeader } from "@/modules/central/components/CentralHeader";
import { BottomNav } from "@/core/navigation/BottomNav";
import type { TerritoryNavigationModeId } from "@/core/navigation/territoryNavigationModes";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";

/**
 * CentralLayout
 *
 * Layout principal da Central. O lifecycle continua pertencendo à camada app;
 * a Central recebe somente os modos de navegação já autorizados pela composição.
 */
interface CentralLayoutProps {
  readonly businessEnabled: boolean;
  readonly billingEnabled: boolean;
  readonly navigationModeIds: readonly TerritoryNavigationModeId[];
  readonly brand?: ReactNode;
}

export function CentralLayout({
  businessEnabled,
  billingEnabled,
  navigationModeIds,
  brand,
}: CentralLayoutProps) {
  const { pathname } = useLocation();

  const businessWorkspace = pathname === businessManagementRoutes.create() ||
    Boolean(matchPath("/central/empresas/:businessId/*", pathname));

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <SidebarProvider>
        <div className={`min-h-screen flex w-full ${businessWorkspace ? "bg-territory-canvas" : "bg-background"}`}>
          {!businessWorkspace ? <CentralNavigation businessEnabled={businessEnabled} /> : null}
          <div className="flex-1 flex flex-col min-w-0 w-full">
            <CentralHeader billingEnabled={billingEnabled} brand={brand} showNavigation={!businessWorkspace} />
            <main id="main-content" className={businessWorkspace ? "flex-1 min-w-0 w-full" : "flex-1 p-4 md:p-6 pb-20 md:pb-6 w-full"}>
              <Outlet />
            </main>
          </div>
        </div>
        {!businessWorkspace ? (
          <BottomNav visibleModeIds={navigationModeIds} />
        ) : null}
      </SidebarProvider>
    </>
  );
}

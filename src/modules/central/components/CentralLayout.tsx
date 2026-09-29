import { Outlet, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SidebarProvider } from "@/shared/components/ui/sidebar";
import { CentralNavigation } from "@/modules/central/components/CentralNavigation";
import { CentralHeader } from "@/modules/central/components/CentralHeader";
import { BottomNav } from "@/core/navigation/BottomNav";
import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";

/**
 * CentralLayout
 *
 * Layout principal da Central.
 */
interface CentralLayoutProps {
  readonly businessEnabled: boolean;
  readonly billingEnabled: boolean;
}

export function CentralLayout({
  businessEnabled,
  billingEnabled,
}: CentralLayoutProps) {
  const { pathname } = useLocation();

  if (pathname === businessManagementRoutes.create()) {
    return <><Helmet><meta name="robots" content="noindex, nofollow" /></Helmet><AuthBrandHeader showBack={false} /><main id="main-content"><Outlet /></main></>;
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CentralNavigation businessEnabled={businessEnabled} />
        <div className="flex-1 flex flex-col min-w-0 w-full">
          <CentralHeader billingEnabled={billingEnabled} />
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 w-full">
            <Outlet />
          </main>
        </div>
      </div>
        <BottomNav />
      </SidebarProvider>
    </>
  );
}

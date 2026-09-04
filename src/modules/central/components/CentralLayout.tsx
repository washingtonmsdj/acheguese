import { Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SidebarProvider } from "@/shared/components/ui/sidebar";
import { CentralNavigation } from "@/modules/central/components/CentralNavigation";
import { CentralHeader } from "@/modules/central/components/CentralHeader";
import { BottomNav } from "@/core/navigation/BottomNav";

/**
 * CentralLayout
 *
 * Layout principal da Central.
 */
export function CentralLayout() {
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CentralNavigation />
        <div className="flex-1 flex flex-col min-w-0 w-full">
          <CentralHeader />
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

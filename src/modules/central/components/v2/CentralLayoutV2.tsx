import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/shared/components/ui/sidebar";
import { CentralSidebarV2 } from "./CentralSidebarV2";
import { CentralTopbarV2 } from "./CentralTopbarV2";
import { BottomNav } from "@/core/navigation/BottomNav";

/**
 * CentralLayoutV2
 *
 * Layout COPIADO EXATAMENTE do maker-forge-net AppLayout
 * Estrutura identica, classes identicas, comportamento identico
 */
export function CentralLayoutV2() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CentralSidebarV2 />
        <div className="flex-1 flex flex-col min-w-0 w-full">
          <CentralTopbarV2 />
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 w-full">
            <Outlet />
          </main>
        </div>
      </div>
      <BottomNav />
    </SidebarProvider>
  );
}

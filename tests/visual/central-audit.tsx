import React from "react";
import { createRoot } from "react-dom/client";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import "@/index.css";
import { BrandMark } from "@/app/components/navigation/PublicBrandHeader";
import { getActiveBusinessManagementNavigation } from "@/app/config/businessManagementSurfaceScope";
import { CentralHeader } from "@/modules/central/components/CentralHeader";
import BusinessDashboardShellPage from "@/modules/business/dashboard/pages/BusinessDashboardShellPage";
import BusinessDetailsPage from "@/modules/business/dashboard/pages/BusinessDetailsPage";
import BusinessSettingsPage from "@/modules/business/dashboard/pages/BusinessSettingsPage";

createRoot(document.getElementById("root")!).render(
  <MemoryRouter initialEntries={["/central/empresas/test-business/dados"]}>
    <div className="min-h-screen bg-background text-foreground">
      <CentralHeader billingEnabled={false} showNavigation={false} brand={<Link to="/" className="inline-flex items-center gap-2 text-base font-bold sm:text-xl"><BrandMark /><span>achegue-se</span></Link>} />
      <p className="mx-auto max-w-[1440px] px-4 pt-3 text-xs text-muted-foreground">Teste visual isolado · dados simulados · sem gravação ou autenticação de produção.</p>
      <Routes>
        <Route path="/central/empresas/:businessId" element={<BusinessDashboardShellPage navigationItems={getActiveBusinessManagementNavigation()} />}>
          <Route path="dados" element={<BusinessDetailsPage />} />
          <Route path="configuracoes" element={<BusinessSettingsPage />} />
          <Route path="*" element={<p>Seção fora deste teste visual. Abra Dados ou Configurações.</p>} />
        </Route>
      </Routes>
      <Toaster />
    </div>
  </MemoryRouter>,
);

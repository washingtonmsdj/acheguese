import { Route, Routes } from "react-router-dom";

import { isProductModuleEnabled } from "@/app/config/lifecycleRegistry";

import * as P from "../activeCentralLazyImports";

/**
 * Active MVP Central route tree.
 *
 * Only Business/Empresas management and Central infrastructure belong here.
 * Post-MVP modules remain preserved outside this graph until their lifecycle
 * is explicitly reactivated and certified.
 */
export function CentralRoutes() {
  const businessEnabled = isProductModuleEnabled("business");

  return (
    <Routes>
      <Route element={<P.CentralLayout />}>
        <Route element={<P.CentralAccessGuard />}>
          <Route index element={<P.CentralHubPage />} />

          {businessEnabled ? (
            <>
              <Route path="empresas" element={<P.CentralEmpresasPage />} />
              <Route path="empresas/nova" element={<P.CriarEmpresaPage />} />

              <Route
                path="empresas/:businessId"
                element={<P.BusinessAdminGuard />}
              >
                <Route path="editar" element={<P.EditarEmpresaPage />} />
                <Route element={<P.BusinessDashboardShellPage />}>
                  <Route index element={<P.BusinessOverviewPage />} />
                  <Route path="dados" element={<P.BusinessDetailsPage />} />
                  <Route
                    path="configuracoes"
                    element={<P.BusinessSettingsPage />}
                  />
                </Route>
              </Route>
            </>
          ) : null}

          <Route path="*" element={<P.NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}

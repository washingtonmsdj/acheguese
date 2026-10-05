import { Link, Route, Routes } from "react-router-dom";

import { BrandMark } from "@/app/components/navigation/PublicBrandHeader";
import { getActiveBusinessManagementNavigation } from "@/app/config/businessManagementSurfaceScope";
import { getActiveBusinessVerticalKeys } from "@/app/config/businessVerticalScope";
import { isProductModuleEnabled } from "@/app/config/lifecycleRegistry";
import { getActiveMessagingProviderIds } from "@/app/config/messagingProviderScope";
import { getActiveTerritoryNavigationModeIds } from "@/app/config/territoryNavigationScope";

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
  const billingEnabled = isProductModuleEnabled("billing");
  const activeBusinessVerticalKeys = getActiveBusinessVerticalKeys();
  const navigationModeIds = getActiveTerritoryNavigationModeIds();
  const businessMessagingAvailable =
    getActiveMessagingProviderIds().includes("business");

  return (
    <Routes>
      <Route
        element={
          <P.CentralLayout
            businessEnabled={businessEnabled}
            billingEnabled={billingEnabled}
            navigationModeIds={navigationModeIds}
            brand={
              <Link
                to="/"
                className="inline-flex items-center gap-2 font-heading text-base font-bold tracking-tight text-foreground sm:text-xl"
                aria-label="Achegue-se, início"
              >
                <BrandMark />
                <span>achegue-se</span>
              </Link>
            }
          />
        }
      >
        <Route element={<P.CentralAccessGuard />}>
          <Route
            index
            element={<P.CentralHubPage businessEnabled={businessEnabled} />}
          />

          {businessEnabled ? (
            <>
              <Route
                path="empresas"
                element={
                  <P.CentralEmpresasPage billingEnabled={billingEnabled} />
                }
              />
              <Route
                path="empresas/nova"
                element={
                  <P.CriarEmpresaPage
                    enabledVerticalKeys={activeBusinessVerticalKeys}
                  />
                }
              />

              <Route
                path="empresas/:businessId"
                element={<P.BusinessAdminGuard />}
              >
                <Route
                  element={
                    <P.BusinessDashboardShellPage
                      navigationItems={getActiveBusinessManagementNavigation()}
                    />
                  }
                >
                  <Route
                    index
                    element={
                      <P.BusinessOverviewPage
                        messagingAvailable={businessMessagingAvailable}
                      />
                    }
                  />
                  <Route path="editar" element={<P.EditarEmpresaPage />} />
                  <Route path="fotos" element={<P.BusinessPhotosPage />} />
                  <Route
                    path="horarios"
                    element={<P.BusinessOpeningHoursPage />}
                  />
                  <Route
                    path="localizacao"
                    element={<P.BusinessLocationPage />}
                  />
                  <Route
                    path="produtos-servicos"
                    element={<P.BusinessCatalogPage />}
                  />
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

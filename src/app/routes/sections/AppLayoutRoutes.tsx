import type { ReactNode } from "react";
import { Route, Routes } from "react-router-dom";

import { AppLayoutSidebar } from "@/app/components/AppLayoutSidebar";
import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "@/app/config/lifecycleRegistry";
import TerritoryHomePage from "@/app/pages/TerritoryHomePage";
import { messagingRoutes } from "@/core/messaging";
import { ProtectedRoute } from "@/core/routing/components/ProtectedRoute";
import { TerritorialIndexPage } from "@/core/routing/components/TerritorialIndexPage";
import {
  TERRITORIAL_ROUTE_PARAMS,
  TERRITORIAL_ROUTE_STATIC_SEGMENTS,
  buildTerritorialBareRoutePath,
  buildTerritorialModuleRoutePath,
  buildTerritorialRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";
import { APP_MODULE_SLUGS } from "@/shared/config/moduleSlugs";

import * as P from "../activeLazyImports";
import {
  APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES,
  renderAppLayoutRouteDescriptors,
} from "./AppLayoutRouteRegistry";

const TERRITORIAL_PARAMS = TERRITORIAL_ROUTE_PARAMS;
const TERRITORIAL_STATIC = TERRITORIAL_ROUTE_STATIC_SEGMENTS;

const protectedElement = (element: ReactNode) => (
  <ProtectedRoute>{element}</ProtectedRoute>
);

/**
 * Active MVP route tree.
 *
 * Paused product modules are intentionally absent from this graph. Their code
 * stays versioned in its bounded context for post-MVP work, while unmatched
 * public URLs fall through to the canonical NotFound route.
 */
export function AppLayoutRoutes() {
  const businessEnabled = isProductModuleEnabled("business");

  const profilesEnabled = isPlatformCapabilityEnabled("profiles");
  const accountEnabled = isPlatformCapabilityEnabled("account");
  const notificationsEnabled = isPlatformCapabilityEnabled("notifications");
  const territoryEnabled = isPlatformCapabilityEnabled("territory");
  const mapEnabled = isPlatformCapabilityEnabled("map");
  const nearbyEnabled = isPlatformCapabilityEnabled("nearby");
  const searchEnabled = isPlatformCapabilityEnabled("search");
  const messagingEnabled = isPlatformCapabilityEnabled("messaging");

  return (
    <Routes>
      <Route element={<AppLayoutSidebar />}>
        {notificationsEnabled ? (
          <Route
            path="/notificacoes"
            element={protectedElement(<P.NotificationsPage />)}
          />
        ) : null}

        {profilesEnabled ? (
          <Route path="/u/:username" element={<P.ProfilePublicRoute />} />
        ) : null}

        {accountEnabled ? (
          <>
            <Route
              path="/conta/preferencias"
              element={protectedElement(<P.ContaPreferenciasPage />)}
            />
            {notificationsEnabled ? (
              <Route
                path="/conta/notificacoes"
                element={protectedElement(<P.NotificationPreferencesPage />)}
              />
            ) : null}
            <Route
              path="/conta/privacidade"
              element={protectedElement(<P.PrivacySettingsPage />)}
            />
            <Route
              path="/conta/perfil/configuracoes"
              element={protectedElement(<P.ProfileSettingsPage />)}
            />
            <Route
              path="/conta/seguranca"
              element={protectedElement(<P.ContaSegurancaPage />)}
            />
            <Route
              path="/conta/enderecos"
              element={protectedElement(<P.ContaEnderecosPage />)}
            />
            <Route
              path="/conta/editar/:profileId"
              element={protectedElement(<P.ContaEditarPerfilPage />)}
            />
            <Route path="/conta" element={protectedElement(<P.ContaPage />)} />
          </>
        ) : null}

        {businessEnabled ? (
          <>
            <Route path="/empresas" element={<P.EmpresasLandingPage />} />
            <Route
              path="/empresas/cadastrar"
              element={protectedElement(<P.EmpresasCadastroLandingPage />)}
            />
          </>
        ) : null}

        {messagingEnabled ? (
          <>
            <Route
              path={messagingRoutes.inbox()}
              element={protectedElement(<P.MensagensPage />)}
            />
            <Route
              path={messagingRoutes.threadPattern()}
              element={protectedElement(<P.MensagensPage />)}
            />
          </>
        ) : null}

        {mapEnabled ? <Route path="/mapa" element={<P.MapaPage />} /> : null}

        {nearbyEnabled ? (
          <Route path="/perto-de-mim" element={<P.NearbyPage />} />
        ) : null}

        {searchEnabled ? (
          <>
            <Route path="/busca" element={<P.BuscaPage />} />
            <Route path="/buscar" element={<P.BuscarPage />} />
            <Route
              path={buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.search)}
              element={<P.BuscaPage />}
            />
            <Route
              path={buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.search, [
                TERRITORIAL_PARAMS.district,
              ])}
              element={<P.BuscaPage />}
            />
            <Route
              path={buildTerritorialRoutePath(TERRITORIAL_STATIC.searchAlias)}
              element={<P.BuscarPage />}
            />
            <Route
              path={buildTerritorialRoutePath(TERRITORIAL_STATIC.searchAlias, [
                TERRITORIAL_PARAMS.district,
              ])}
              element={<P.BuscarPage />}
            />
          </>
        ) : null}

        <Route path="/termos" element={<P.TermosPage />} />
        <Route path="/privacidade" element={<P.PrivacidadePage />} />
        <Route path="/offline-settings" element={<P.OfflineSettingsPage />} />
        <Route path="/dpo" element={<P.DPOContactPage />} />

        {renderAppLayoutRouteDescriptors(APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES)}

        {territoryEnabled ? (
          <>
            <Route
              path={buildTerritorialBareRoutePath([TERRITORIAL_PARAMS.district])}
              element={<P.ActiveTerritorialLayout />}
            >
              <Route
                index
                element={
                  <TerritorialIndexPage
                    CityLandingComponent={TerritoryHomePage}
                  />
                }
              />
            </Route>
            <Route
              path={buildTerritorialBareRoutePath()}
              element={<P.ActiveTerritorialLayout />}
            >
              <Route
                index
                element={
                  <TerritorialIndexPage
                    CityLandingComponent={TerritoryHomePage}
                  />
                }
              />
            </Route>
            <Route path="/:state" element={<P.StateLandingPage />} />
            <Route path="/brasil" element={<P.BrasilShowcasePage />} />
            <Route path="/br" element={<P.CountryLandingPage />} />
          </>
        ) : null}
      </Route>

      <Route path="*" element={<P.NotFound />} />
    </Routes>
  );
}

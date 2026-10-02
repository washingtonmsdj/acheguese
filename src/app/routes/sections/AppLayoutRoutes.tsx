import type { ReactNode } from "react";
import { Route, Routes } from "react-router-dom";

import { AppLayoutSidebar } from "@/app/components/AppLayoutSidebar";
import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { getActiveBusinessVerticalKeys } from "@/app/config/businessVerticalScope";
import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "@/app/config/lifecycleRegistry";
import TerritoryHomePage from "@/app/pages/TerritoryHomePage";
import { messagingRoutes } from "@/core/messaging";
import { ACCOUNT_PATHS, ACCOUNT_ROUTE_PATTERNS } from "@/core/routing/config/account";
import { STATIC_ROUTE_PATHS } from "@/core/routing/config/staticRoutePaths";
import { PUBLIC_PROFILE_ROUTE_PATTERN } from "@/core/profiles/utils/publicProfileUrl";
import { ProtectedRoute } from "@/core/routing/components/ProtectedRoute";
import {
  TERRITORIAL_ROUTE_PARAMS,
  TERRITORIAL_ROUTE_STATIC_SEGMENTS,
  buildScopedTerritorialModuleRoutePath,
  buildScopedTerritorialRoutePath,
  buildTerritorialBareRoutePath,
  buildTerritorialModuleRoutePath,
  buildTerritorialRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";
import { APP_MODULE_SLUGS, buildAppModulePath } from "@/shared/config/moduleSlugs";
import {
  DATA_PROTECTION_CONTACT_PATH,
  PRIVACY_POLICY_PATH,
  TERMS_OF_SERVICE_PATH,
} from "@/shared/constants/legal";

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
  const activeBusinessVerticalKeys = businessEnabled
    ? getActiveBusinessVerticalKeys()
    : [];

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
          <>
            <Route
              path={STATIC_ROUTE_PATHS.notifications}
              element={protectedElement(<P.NotificationsPage />)}
            />
            <Route
              path="/settings/email-logs"
              element={protectedElement(<P.EmailLogsPage />)}
            />
          </>
        ) : null}

        {profilesEnabled ? (
          <Route path={PUBLIC_PROFILE_ROUTE_PATTERN} element={<P.ProfilePublicRoute />} />
        ) : null}

        {accountEnabled ? (
          <>
            <Route
              path={ACCOUNT_PATHS.preferences}
              element={protectedElement(<P.ContaPreferenciasPage />)}
            />
            <Route
              path={ACCOUNT_PATHS.notifications}
              element={protectedElement(<P.NotificationPreferencesPage />)}
            />
            <Route
              path={ACCOUNT_PATHS.privacy}
              element={protectedElement(<P.PrivacySettingsPage />)}
            />
            <Route
              path={ACCOUNT_PATHS.profileSettings}
              element={protectedElement(<P.ProfileSettingsPage />)}
            />
            <Route
              path={ACCOUNT_PATHS.security}
              element={protectedElement(<P.ContaSegurancaPage />)}
            />
            <Route
              path={ACCOUNT_PATHS.addresses}
              element={protectedElement(<P.ContaEnderecosPage />)}
            />
            <Route
              path={ACCOUNT_ROUTE_PATTERNS.editProfile}
              element={protectedElement(<P.ContaEditarPerfilPage />)}
            />
            <Route path={ACCOUNT_PATHS.home} element={protectedElement(<P.ContaPage />)} />
          </>
        ) : null}

        {businessEnabled ? (
          <>
            <Route path={buildAppModulePath(APP_MODULE_SLUGS.business)} element={<P.EmpresasLandingPage />} />
            <Route
              path={buildAppModulePath(APP_MODULE_SLUGS.business, "cadastrar")}
              element={protectedElement(
                <P.EmpresasCadastroLandingPage
                  header={<AuthBrandHeader showBack={false} />}
                  enabledVerticalKeys={activeBusinessVerticalKeys}
                />,
              )}
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

        {mapEnabled ? <Route path={buildAppModulePath(APP_MODULE_SLUGS.map)} element={<P.MapaPage />} /> : null}

        {nearbyEnabled ? (
          <Route path={buildAppModulePath(APP_MODULE_SLUGS.nearby)} element={<P.NearbyPage />} />
        ) : null}

        {searchEnabled ? (
          <>
            <Route path={buildAppModulePath(APP_MODULE_SLUGS.search)} element={<P.BuscaPage />} />
            <Route path={STATIC_ROUTE_PATHS.searchAlias} element={<P.BuscarPage />} />
            <Route
              path={buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.search)}
              element={<P.ActiveTerritorialLayout />}
            >
              <Route index element={<P.TerritorialSearchPortalPage />} />
            </Route>
            <Route
              path={buildTerritorialRoutePath(TERRITORIAL_STATIC.searchAlias)}
              element={<P.BuscarPage />}
            />
            <Route
              path={buildScopedTerritorialRoutePath(TERRITORIAL_STATIC.searchAlias)}
              element={<P.BuscarPage />}
            />
          </>
        ) : null}

        <Route path={TERMS_OF_SERVICE_PATH} element={<P.TermosPage />} />
        <Route path={PRIVACY_POLICY_PATH} element={<P.PrivacidadePage />} />
        <Route path="/offline-settings" element={<P.OfflineSettingsPage />} />
        <Route path={DATA_PROTECTION_CONTACT_PATH} element={<P.DPOContactPage />} />

        {renderAppLayoutRouteDescriptors(APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES)}

        {territoryEnabled ? (
          <>
            <Route
              path={buildTerritorialBareRoutePath([TERRITORIAL_PARAMS.territorySlug])}
              element={<P.ActiveTerritoryPortalLayout />}
            >
              <Route
                path={TERRITORIAL_PARAMS.portalView}
                element={<TerritoryHomePage />}
              />
            </Route>
            <Route
              path={buildTerritorialBareRoutePath()}
              element={<P.ActiveTerritorialLayout />}
            >
              <Route
                index
                element={<TerritoryHomePage />}
              />
            </Route>
            <Route path="/:state" element={<P.StateLandingPage />} />
            <Route path={STATIC_ROUTE_PATHS.brazilShowcase} element={<P.BrasilShowcasePage />} />
            <Route path={STATIC_ROUTE_PATHS.countryLanding} element={<P.CountryLandingPage />} />
          </>
        ) : null}
      </Route>

      <Route path="*" element={<P.NotFound />} />
    </Routes>
  );
}

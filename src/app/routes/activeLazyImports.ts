/**
 * Lazy imports reachable from the active AppLayout runtime only.
 *
 * Post-MVP modules deliberately do not belong here. Their code remains in the
 * repository for future certification, but paused owners must not enter the
 * active route module graph.
 */
import { lazy } from "react";

export const EmpresasLandingPage = lazy(
  () => import("@/app/pages/EmpresasLandingPage"),
);
export const BuscaPage = lazy(() => import("@/app/pages/BuscaPage"));
export const BuscarPage = lazy(() => import("@/app/pages/BuscarPage"));
export const NearbyPage = lazy(() => import("@/core/nearby/pages/NearbyPage"));
export const NotFound = lazy(() => import("@/app/pages/NotFound"));

export const StateLandingPage = lazy(() =>
  import("@/app/routes/territorial/ActiveTerritorialModulePages").then(
    (module) => ({
      default: module.ActiveStateLandingPage,
    }),
  ),
);
export const CountryLandingPage = lazy(() =>
  import("@/core/routing/components/CountryLandingPage").then((module) => ({
    default: module.CountryLandingPage,
  })),
);
export const BrasilShowcasePage = lazy(() =>
  import("@/core/routing/components/BrasilShowcasePage").then((module) => ({
    default: module.BrasilShowcasePage,
  })),
);

export const ContaPage = lazy(
  () => import("@/modules/profile/pages/ContaHubPage"),
);
export const ContaEditarPerfilPage = lazy(
  () => import("@/modules/profile/pages/ContaEditarPerfilPage"),
);
export const ContaSegurancaPage = lazy(
  () => import("@/modules/profile/pages/ContaSegurancaPage"),
);
export const ContaPreferenciasPage = lazy(
  () => import("@/modules/profile/pages/ContaPreferenciasPage"),
);
export const ContaEnderecosPage = lazy(
  () => import("@/modules/profile/pages/ContaEnderecosPage"),
);

export const NotificationsPage = lazy(
  () => import("@/app/pages/NotificationsPage"),
);
export const NotificationPreferencesPage = lazy(
  () => import("@/app/pages/NotificationPreferencesPage"),
);

export const ProfileSettingsPage = lazy(
  () => import("@/app/pages/ProfileSettingsPage"),
);
export const ProfilePublicRoute = lazy(
  () => import("@/core/routing/components/ProfilePublicRoute"),
);

export const EmpresasCadastroLandingPage = lazy(
  () => import("@/modules/business/pages/EmpresasCadastroLandingPage"),
);
export const EmpresaDetailLandingPage = lazy(
  () => import("@/app/pages/EmpresaDetailLandingPage"),
);
export const BusinessRouteResolver = lazy(
  () => import("@/core/routing/components/BusinessRouteResolver"),
);

export const MensagensPage = lazy(
  () => import("@/app/pages/MessagingInboxPage"),
);
export const MapaPage = lazy(() => import("@/core/maps/pages/MapaPageV4"));

export const TerritorialCategoryBusinessPage = lazy(() =>
  import("@/app/routes/territorial/ActiveTerritorialModulePages").then(
    (module) => ({
      default: module.TerritorialCategoryBusinessPage,
    }),
  ),
);
export const TerritorialMapPage = lazy(() =>
  import("@/app/routes/territorial/ActiveTerritorialModulePages").then(
    (module) => ({
      default: module.TerritorialMapPage,
    }),
  ),
);

export const ActiveTerritorialLayout = lazy(() =>
  import("@/app/routes/territorial/ActiveTerritorialModulePages").then(
    (module) => ({
      default: module.ActiveTerritorialLayout,
    }),
  ),
);

export const TermosPage = lazy(() => import("@/app/pages/TermosPage"));
export const PrivacidadePage = lazy(
  () => import("@/app/pages/PrivacidadePage"),
);
export const OfflineSettingsPage = lazy(
  () => import("@/app/pages/OfflineSettingsPage"),
);
export const PrivacySettingsPage = lazy(
  () => import("@/app/pages/PrivacySettingsPage"),
);
export const DPOContactPage = lazy(() => import("@/app/pages/DPOContactPage"));

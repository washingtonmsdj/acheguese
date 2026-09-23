import { lazy } from "react";

/**
 * Lazy imports reachable from the active Central runtime only.
 *
 * Post-MVP domains remain versioned in their bounded contexts and in the
 * legacy centralLazyImports barrel, but they must not enter the MVP Central
 * route graph while their lifecycle is paused.
 */
export const CentralLayout = lazy(() =>
  import("@/modules/central/components/CentralLayout").then((module) => ({
    default: module.CentralLayout,
  })),
);
export const CentralAccessGuard = lazy(() =>
  import("@/modules/central/guards/CentralAccessGuard").then((module) => ({
    default: module.CentralAccessGuard,
  })),
);
export const BusinessAdminGuard = lazy(() =>
  import("@/modules/central/guards/BusinessAdminGuard").then((module) => ({
    default: module.BusinessAdminGuard,
  })),
);

export const CentralHubPage = lazy(() =>
  import("@/modules/central/pages/CentralHubPage"),
);
export const CentralEmpresasPage = lazy(() =>
  import("@/modules/central/pages/CentralEmpresasPage"),
);
export const CriarEmpresaPage = lazy(() =>
  import("@/modules/business/pages/CriarEmpresaPage"),
);
export const EditarEmpresaPage = lazy(() =>
  import("@/modules/business/pages/EditarEmpresaPage"),
);
export const BusinessDashboardShellPage = lazy(() =>
  import("@/modules/business/dashboard/pages/BusinessDashboardShellPage"),
);
export const BusinessOverviewPage = lazy(() =>
  import("@/modules/business/dashboard/pages/BusinessOverviewPage"),
);
export const BusinessDetailsPage = lazy(() =>
  import("@/modules/business/dashboard/pages/BusinessDetailsPage"),
);
export const BusinessSettingsPage = lazy(() =>
  import("@/modules/business/dashboard/pages/BusinessSettingsPage"),
);

export const NotFound = lazy(() => import("@/app/pages/NotFound"));

import { lazy } from "react";
import { createLaunchPausedRoute } from "./launchPausedComponent";

export const EventsOrganizerDashboard = createLaunchPausedRoute("Eventos");
export const EventsOrganizerForm = createLaunchPausedRoute("Eventos");
export const EventsOrganizerAnalyticsPage = createLaunchPausedRoute("Eventos");
export const EventsErrorBoundary = createLaunchPausedRoute("Eventos");

export const CriarEmpresaPage = lazy(() =>
  import("@/modules/business/pages/CriarEmpresaPage"),
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
export const BusinessPlansPage = lazy(() =>
  import("@/modules/business/dashboard/pages/BusinessPlansPage"),
);
export const BusinessPremiumSitePage = lazy(() =>
  import("@/modules/business/dashboard/pages/BusinessPremiumSitePage"),
);
export const BusinessAnalyticsPage = createLaunchPausedRoute("Analytics");
export const BusinessSettingsPage = lazy(() =>
  import("@/modules/business/dashboard/pages/BusinessSettingsPage"),
);

export const GastronomySetupPage = lazy(() =>
  import("@/modules/business/gastronomy/pages/GastronomySetupPage"),
);
export const GastronomyDashboardPage = lazy(() =>
  import("@/modules/business/gastronomy/pages/GastronomyDashboardPage"),
);
export const MenuManagementPage = lazy(() =>
  import("@/modules/business/gastronomy/pages/MenuManagementPage"),
);
export const BusinessHoursPage = lazy(() =>
  import("@/modules/business/gastronomy/pages/BusinessHoursPage"),
);
export const DeliveryAreaPage = lazy(() =>
  import("@/modules/business/gastronomy/pages/DeliveryAreaPage"),
);
export const OrdersPage = createLaunchPausedRoute("Pedidos");
export const OrderDetailsPage = createLaunchPausedRoute("Pedidos");
export const DeliveryManagementPage = createLaunchPausedRoute("Entregas");
export const AnalyticsPage = createLaunchPausedRoute("Analytics");
export const GastronomyPromotionsPage = createLaunchPausedRoute("Promocoes");

export const EducationDashboardPage = createLaunchPausedRoute("Educacao");
export const EducationSetupPage = createLaunchPausedRoute("Educacao");
export const EducationLeadsPage = createLaunchPausedRoute("Educacao");
export const EducationEventsPage = createLaunchPausedRoute("Educacao");
export const EducationProgramsPage = createLaunchPausedRoute("Educacao");
export const EducationAnalyticsPage = createLaunchPausedRoute("Educacao");
export const EducationPlansPage = createLaunchPausedRoute("Educacao");

export const CommunicationAgentDashboard = createLaunchPausedRoute("Comunicacao");

export const CentralHubPage = lazy(() =>
  import("@/modules/central/pages/CentralHubPage"),
);
export const CentralEmpresasPage = lazy(() =>
  import("@/modules/central/pages/CentralEmpresasPage"),
);
export const CentralProfissionalPage = lazy(() =>
  import("@/modules/central/pages/CentralProfissionalPage"),
);
export const CentralMotoristaPage = createLaunchPausedRoute("Mobilidade");
export const CentralMotoboyPage = createLaunchPausedRoute("Mobilidade");
export const CentralComunicacaoPage = createLaunchPausedRoute("Comunicacao");
export const CentralMotoristaCadastroPage = createLaunchPausedRoute("Mobilidade");
export const CentralMotoristaDisponibilidadePage = createLaunchPausedRoute("Mobilidade");
export const CentralMotoristaCorridasPage = createLaunchPausedRoute("Mobilidade");
export const CentralMotoristaGanhosPage = createLaunchPausedRoute("Mobilidade");
export const CentralMotoristaConfiguracoesPage = createLaunchPausedRoute("Mobilidade");
export const CentralMotoboyCadastroPage = createLaunchPausedRoute("Mobilidade");
export const CentralMotoboyDisponibilidadePage = createLaunchPausedRoute("Mobilidade");
export const CentralMotoboyEntregasPage = createLaunchPausedRoute("Mobilidade");
export const CentralMotoboyGanhosPage = createLaunchPausedRoute("Mobilidade");
export const CentralMotoboyConfiguracoesPage = createLaunchPausedRoute("Mobilidade");
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
export const ProfessionalGuard = lazy(() =>
  import("@/modules/central/guards/ProfessionalGuard").then((module) => ({
    default: module.ProfessionalGuard,
  })),
);
export const DriverGuard = createLaunchPausedRoute("Mobilidade");

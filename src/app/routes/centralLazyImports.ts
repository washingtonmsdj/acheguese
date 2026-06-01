import { lazy } from "react";

export const EventsOrganizerDashboard = lazy(() =>
  import("@/features/events/pages/EventsOrganizerDashboard"),
);
export const EventsOrganizerForm = lazy(() =>
  import("@/features/events/pages/EventsOrganizerForm"),
);
export const EventsOrganizerAnalyticsPage = lazy(() =>
  import("@/features/events/pages/EventsOrganizerAnalyticsPage"),
);
export const EventsErrorBoundary = lazy(() =>
  import("@/features/events/components/EventsErrorBoundary").then((module) => ({
    default: module.EventsErrorBoundary,
  })),
);

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
export const BusinessAnalyticsPage = lazy(() =>
  import("@/modules/business/dashboard/pages/BusinessAnalyticsPage"),
);
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
export const OrdersPage = lazy(() =>
  import("@/modules/business/gastronomy/pages/OrdersPage"),
);
export const OrderDetailsPage = lazy(() =>
  import("@/modules/business/gastronomy/pages/OrderDetailsPage"),
);
export const DeliveryManagementPage = lazy(() =>
  import("@/modules/business/gastronomy/pages/DeliveryManagementPage"),
);
export const AnalyticsPage = lazy(() =>
  import("@/modules/business/gastronomy/pages/AnalyticsPage"),
);
export const GastronomyPromotionsPage = lazy(() =>
  import("@/modules/business/gastronomy/pages/GastronomyPromotionsPage"),
);

export const EducationDashboardPage = lazy(() =>
  import("@/modules/business/education/pages/EducationDashboardPage"),
);
export const EducationSetupPage = lazy(() =>
  import("@/modules/business/education/pages/EducationSetupPage"),
);
export const EducationLeadsPage = lazy(() =>
  import("@/modules/business/education/pages/EducationLeadsPage"),
);
export const EducationEventsPage = lazy(() =>
  import("@/modules/business/education/pages/EducationEventsPage"),
);
export const EducationProgramsPage = lazy(() =>
  import("@/modules/business/education/pages/EducationProgramsPage"),
);
export const EducationAnalyticsPage = lazy(() =>
  import("@/modules/business/education/pages/EducationAnalyticsPage"),
);
export const EducationPlansPage = lazy(() =>
  import("@/modules/business/education/pages/EducationPlansPage"),
);

export const CommunicationAgentDashboard = lazy(() =>
  import("@/modules/communication-territorial/pages/CommunicationAgentDashboard"),
);

export const CentralHubPage = lazy(() =>
  import("@/modules/central/pages/CentralHubPage"),
);
export const CentralEmpresasPage = lazy(() =>
  import("@/modules/central/pages/CentralEmpresasPage"),
);
export const CentralProfissionalPage = lazy(() =>
  import("@/modules/central/pages/CentralProfissionalPage"),
);
export const CentralMotoristaPage = lazy(() =>
  import("@/modules/central/pages/CentralMotoristaPage"),
);
export const CentralMotoboyPage = lazy(() =>
  import("@/modules/central/pages/CentralMotoboyPage"),
);
export const CentralComunicacaoPage = lazy(() =>
  import("@/modules/central/pages/CentralComunicacaoPage"),
);
export const CentralMotoristaCadastroPage = lazy(() =>
  import("@/modules/central/pages/motorista/CentralMotoristaCadastroPage"),
);
export const CentralMotoristaDisponibilidadePage = lazy(() =>
  import("@/modules/central/pages/motorista/CentralMotoristaDisponibilidadePage"),
);
export const CentralMotoristaCorridasPage = lazy(() =>
  import("@/modules/central/pages/motorista/CentralMotoristaCorridasPage"),
);
export const CentralMotoristaGanhosPage = lazy(() =>
  import("@/modules/central/pages/motorista/CentralMotoristaGanhosPage"),
);
export const CentralMotoristaConfiguracoesPage = lazy(() =>
  import("@/modules/central/pages/motorista/CentralMotoristaConfiguracoesPage"),
);
export const CentralMotoboyCadastroPage = lazy(() =>
  import("@/modules/central/pages/motoboy/CentralMotoboyCadastroPage"),
);
export const CentralMotoboyDisponibilidadePage = lazy(() =>
  import("@/modules/central/pages/motoboy/CentralMotoboyDisponibilidadePage"),
);
export const CentralMotoboyEntregasPage = lazy(() =>
  import("@/modules/central/pages/motoboy/CentralMotoboyEntregasPage"),
);
export const CentralMotoboyGanhosPage = lazy(() =>
  import("@/modules/central/pages/motoboy/CentralMotoboyGanhosPage"),
);
export const CentralMotoboyConfiguracoesPage = lazy(() =>
  import("@/modules/central/pages/motoboy/CentralMotoboyConfiguracoesPage"),
);
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
export const DriverGuard = lazy(() =>
  import("@/modules/central/guards/DriverGuard").then((module) => ({
    default: module.DriverGuard,
  })),
);

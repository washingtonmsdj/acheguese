import { lazy } from "react";
import { createLaunchPausedRoute } from "./launchPausedComponent";

export const AdminGuideTouristPointsPage = lazy(() =>
  import("@/modules/guide/pages/AdminTouristPointsPage"),
);
export const AdminGuideTouristPointFormPage = lazy(() =>
  import("@/modules/guide/pages/AdminTouristPointFormPage"),
);
export const LocationsAdminPage = lazy(() =>
  import("@/modules/admin/pages/LocationsAdminPage"),
);

export const AdminLayout = lazy(() => import("@/modules/admin/pages/AdminLayout"));
export const AdminDashboard = lazy(() => import("@/modules/admin/pages/AdminDashboard"));
export const AdminBanners = lazy(() => import("@/modules/admin/pages/BannersPage"));
export const AdminEmpresas = lazy(() => import("@/modules/admin/pages/AdminEmpresas"));
export const AdminGastronomia = lazy(() => import("@/modules/admin/pages/AdminGastronomia"));
export const AdminServicos = lazy(() => import("@/modules/admin/pages/AdminServicos"));
export const AdminAnuncios = lazy(() => import("@/modules/admin/pages/AdminAnuncios"));
export const AdminClassificados = lazy(() =>
  import("@/modules/admin/pages/AdminClassificados"),
);
export const AdminClassificadosDenuncias = lazy(() =>
  import("@/modules/admin/pages/AdminClassificadosDenuncias"),
);
export const AdminVagas = createLaunchPausedRoute("Vagas");
export const AdminEventos = createLaunchPausedRoute("Eventos");
export const AdminUsuarios = lazy(() => import("@/modules/admin/pages/AdminUsuarios"));
export const AdminMotoristas = createLaunchPausedRoute("Mobilidade");
export const AdminReportsPassageiros = createLaunchPausedRoute("Mobilidade");
export const AdminPontosEmbarque = createLaunchPausedRoute("Mobilidade");
export const AdminVerificacoes = lazy(() =>
  import("@/core/verification/pages/AdminVerificationsPage"),
);
export const AdminAnalyticsMobilidade = createLaunchPausedRoute("Mobilidade");
export const AdminRealtimeDashboard = lazy(() =>
  import("@/modules/admin/pages/AdminRealtimeDashboard"),
);
export const AdminModeracao = lazy(() => import("@/modules/admin/pages/AdminModeracao"));
export const AdminAnalytics = createLaunchPausedRoute("Analytics");
export const AdminCupons = createLaunchPausedRoute("Cupons");
export const AdminPromocoes = createLaunchPausedRoute("Promocoes");
export const AdminAssinaturas = lazy(() =>
  import("@/modules/admin/pages/AdminAssinaturas"),
);
export const AdminRoles = lazy(() => import("@/modules/admin/pages/AdminRoles"));
export const AdminPricing = lazy(() => import("@/modules/admin/pages/AdminPricing"));
export const AdminBranding = lazy(() => import("@/modules/admin/pages/AdminBranding"));
export const AdminMensagens = createLaunchPausedRoute("Mensagens");
export const AdminNotifications = lazy(() =>
  import("@/modules/admin/pages/AdminNotifications"),
);
export const AdminCommunityAlerts = lazy(() =>
  import("@/modules/admin/pages/AdminCommunityAlerts"),
);
export const AdminCommunityIssues = lazy(() =>
  import("@/modules/admin/pages/AdminCommunityIssues"),
);
export const AdminCommunityInterest = lazy(() =>
  import("@/modules/admin/pages/AdminCommunityInterest"),
);
export const AdminComunicacao = createLaunchPausedRoute("Comunicacao");
export const AdminIdentidade = lazy(() =>
  import("@/core/admin/identity/pages/AdminIdentidadePage"),
);
export const AdminMapa = lazy(() => import("@/modules/admin/pages/AdminMapa"));
export const AdminConfiguracoes = lazy(() =>
  import("@/modules/admin/pages/AdminConfiguracoes"),
);
export const AdminOperacoes = lazy(() =>
  import("@/modules/admin/pages/AdminOperacoes"),
);
export const AdminMotoboyOperations = createLaunchPausedRoute("Mobilidade");
export const AdminReivindicacoes = lazy(() =>
  import("@/modules/admin/pages/AdminReivindicacoes"),
);
export const AdminSSOT = lazy(() => import("@/modules/admin/pages/AdminSSOT"));
export const AdminHighlights = lazy(() =>
  import("@/modules/admin/pages/AdminHighlights"),
);
export const AdminTerritoryContent = lazy(() =>
  import("@/modules/admin/pages/AdminTerritoryContent"),
);
export const AdminTerritorialGroups = lazy(() =>
  import("@/modules/admin/pages/AdminTerritorialGroups"),
);
export const AdminCityMetadata = lazy(() =>
  import("@/modules/admin/pages/AdminCityMetadata"),
);
export const AdminTerritoryManagement = lazy(() =>
  import("@/modules/admin/pages/AdminTerritoryManagement"),
);

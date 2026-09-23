import type { ReactElement } from "react";
import { Route, Routes } from "react-router-dom";
import {
  filterAdminNavigationSections,
  isAdminSurfaceEnabled,
  type AdminSurfaceKey,
} from "@/app/config/adminSurfaceScope";
import { ADMIN_NAV_SECTIONS } from "@/modules/admin/config/adminNavigation.config";
import * as P from "../adminLazyImports";

function adminRoute(
  surface: AdminSurfaceKey,
  route: ReactElement,
): ReactElement | null {
  return isAdminSurfaceEnabled(surface) ? route : null;
}

const adminNavigationSections =
  filterAdminNavigationSections(ADMIN_NAV_SECTIONS);

export function AdminRoutes() {
  return (
    <Routes>
      <Route
        element={
          <P.AdminLayout navigationSections={adminNavigationSections} />
        }
      >
        {adminRoute("dashboard", <Route index element={<P.AdminDashboard />} />)}
        {adminRoute("banners", <Route path="banners" element={<P.AdminBanners />} />)}
        {adminRoute("empresas", <Route path="empresas" element={<P.AdminEmpresas />} />)}
        {adminRoute("gastronomia", <Route path="gastronomia" element={<P.AdminGastronomia />} />)}
        {adminRoute("services", <Route path="servicos" element={<P.AdminServicos />} />)}
        {adminRoute("anuncios", <Route path="anuncios" element={<P.AdminAnuncios />} />)}
        {adminRoute("classificados", <Route path="classificados" element={<P.AdminClassificados />} />)}
        {adminRoute(
          "classificados-denuncias",
          <Route path="classificados/denuncias" element={<P.AdminClassificadosDenuncias />} />,
        )}
        {adminRoute("vagas", <Route path="vagas" element={<P.AdminVagas />} />)}
        {adminRoute("eventos", <Route path="eventos" element={<P.AdminEventos />} />)}
        {adminRoute("usuarios", <Route path="usuarios" element={<P.AdminUsuarios />} />)}
        {adminRoute("motoristas", <Route path="motoristas" element={<P.AdminMotoristas />} />)}
        {adminRoute(
          "reports-passageiros",
          <Route path="reports-passageiros" element={<P.AdminReportsPassageiros />} />,
        )}
        {adminRoute(
          "pontos-embarque",
          <Route path="pontos-embarque" element={<P.AdminPontosEmbarque />} />,
        )}
        {adminRoute("verificacoes", <Route path="verificacoes" element={<P.AdminVerificacoes />} />)}
        {adminRoute(
          "analytics-mobilidade",
          <Route path="analytics-mobilidade" element={<P.AdminAnalyticsMobilidade />} />,
        )}
        {adminRoute(
          "motoboy-operacoes",
          <Route path="motoboy-operacoes" element={<P.AdminMotoboyOperations />} />,
        )}
        {adminRoute(
          "realtime-dashboard",
          <Route path="realtime-dashboard" element={<P.AdminRealtimeDashboard />} />,
        )}
        {adminRoute("moderacao", <Route path="moderacao" element={<P.AdminModeracao />} />)}
        {adminRoute(
          "qualidade-dados",
          <Route path="qualidade-dados" element={<P.AdminDataQuality />} />,
        )}
        {adminRoute("privacidade", <Route path="privacidade" element={<P.AdminPrivacyRequests />} />)}
        {adminRoute(
          "community-alerts",
          <Route path="community-alerts" element={<P.AdminCommunityAlerts />} />,
        )}
        {adminRoute(
          "community-issues",
          <Route path="community-issues" element={<P.AdminCommunityIssues />} />,
        )}
        {adminRoute(
          "community-interest",
          <Route path="lista-espera" element={<P.AdminCommunityInterest />} />,
        )}
        {adminRoute("comunicacao", <Route path="comunicacao" element={<P.AdminComunicacao />} />)}
        {adminRoute("notifications", <Route path="notifications" element={<P.AdminNotifications />} />)}
        {adminRoute("mensagens", <Route path="mensagens" element={<P.AdminMensagens />} />)}
        {adminRoute("cupons", <Route path="cupons" element={<P.AdminCupons />} />)}
        {adminRoute("promocoes", <Route path="promocoes" element={<P.AdminPromocoes />} />)}
        {adminRoute("assinaturas", <Route path="assinaturas" element={<P.AdminAssinaturas />} />)}
        {adminRoute("roles", <Route path="roles" element={<P.AdminRoles />} />)}
        {adminRoute("identidade", <Route path="identidade" element={<P.AdminIdentidade />} />)}
        {adminRoute("mapa", <Route path="mapa" element={<P.AdminMapa />} />)}
        {adminRoute("pricing", <Route path="pricing" element={<P.AdminPricing />} />)}
        {adminRoute("branding", <Route path="branding" element={<P.AdminBranding />} />)}
        {adminRoute(
          "configuracoes",
          <Route path="configuracoes" element={<P.AdminConfiguracoes />} />,
        )}
        {adminRoute("operacoes", <Route path="operacoes" element={<P.AdminOperacoes />} />)}
        {adminRoute("analytics", <Route path="analytics" element={<P.AdminAnalytics />} />)}
        {adminRoute(
          "reivindicacoes",
          <Route path="reivindicacoes" element={<P.AdminReivindicacoes />} />,
        )}
        {adminRoute("ssot", <Route path="ssot" element={<P.AdminSSOT />} />)}
        {adminRoute("highlights", <Route path="highlights" element={<P.AdminHighlights />} />)}
        {adminRoute(
          "territory-content",
          <Route path="territory-content" element={<P.AdminTerritoryContent />} />,
        )}
        {adminRoute(
          "territorial-groups",
          <Route path="territorial-groups" element={<P.AdminTerritorialGroups />} />,
        )}
        {adminRoute(
          "city-metadata",
          <Route path="city-metadata" element={<P.AdminCityMetadata />} />,
        )}
        {adminRoute(
          "territory-management",
          <Route path="territory-management" element={<P.AdminTerritoryManagement />} />,
        )}
        {adminRoute(
          "pontos-turisticos",
          <Route path="guia/pontos-turisticos" element={<P.AdminGuideTouristPointsPage />} />,
        )}
        {adminRoute(
          "pontos-turisticos",
          <Route path="guia/pontos-turisticos/novo" element={<P.AdminGuideTouristPointFormPage />} />,
        )}
        {adminRoute(
          "pontos-turisticos",
          <Route
            path="guia/pontos-turisticos/:id/editar"
            element={<P.AdminGuideTouristPointFormPage />}
          />,
        )}
        {adminRoute("locations", <Route path="locations" element={<P.LocationsAdminPage />} />)}
      </Route>
    </Routes>
  );
}

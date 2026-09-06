import { Route, Routes } from "react-router-dom";
import * as P from "../adminLazyImports";

export function AdminRoutes() {
  return (
    <Routes>
      <Route element={<P.AdminLayout />}>
      <Route index element={<P.AdminDashboard />} />
      <Route path="banners" element={<P.AdminBanners />} />
      <Route path="empresas" element={<P.AdminEmpresas />} />
      <Route path="gastronomia" element={<P.AdminGastronomia />} />
      <Route path="servicos" element={<P.AdminServicos />} />
      <Route path="anuncios" element={<P.AdminAnuncios />} />
      <Route path="classificados" element={<P.AdminClassificados />} />
      <Route path="classificados/denuncias" element={<P.AdminClassificadosDenuncias />} />
      <Route path="vagas" element={<P.AdminVagas />} />
      <Route path="eventos" element={<P.AdminEventos />} />
      <Route path="usuarios" element={<P.AdminUsuarios />} />
      <Route path="motoristas" element={<P.AdminMotoristas />} />
      <Route path="reports-passageiros" element={<P.AdminReportsPassageiros />} />
      <Route path="pontos-embarque" element={<P.AdminPontosEmbarque />} />
      <Route path="verificacoes" element={<P.AdminVerificacoes />} />
      <Route path="analytics-mobilidade" element={<P.AdminAnalyticsMobilidade />} />
      <Route path="motoboy-operacoes" element={<P.AdminMotoboyOperations />} />
      <Route path="realtime-dashboard" element={<P.AdminRealtimeDashboard />} />
      <Route path="moderacao" element={<P.AdminModeracao />} />
      <Route path="qualidade-dados" element={<P.AdminDataQuality />} />
      <Route path="alertas" element={<P.AdminCommunityAlerts />} />
      <Route path="community-alerts" element={<P.AdminCommunityAlerts />} />
      <Route path="community-issues" element={<P.AdminCommunityIssues />} />
      <Route path="lista-espera" element={<P.AdminCommunityInterest />} />
      <Route path="community-interest" element={<P.AdminCommunityInterest />} />
      <Route path="comunicacao" element={<P.AdminComunicacao />} />
      <Route path="notifications" element={<P.AdminNotifications />} />
      <Route path="mensagens" element={<P.AdminMensagens />} />
      <Route path="cupons" element={<P.AdminCupons />} />
      <Route path="promocoes" element={<P.AdminPromocoes />} />
      <Route path="assinaturas" element={<P.AdminAssinaturas />} />
      <Route path="roles" element={<P.AdminRoles />} />
      <Route path="identidade" element={<P.AdminIdentidade />} />
      <Route path="mapa" element={<P.AdminMapa />} />
      <Route path="pricing" element={<P.AdminPricing />} />
      <Route path="branding" element={<P.AdminBranding />} />
      <Route path="configuracoes" element={<P.AdminConfiguracoes />} />
      <Route path="operacoes" element={<P.AdminOperacoes />} />
      <Route path="analytics" element={<P.AdminAnalytics />} />
      <Route path="reivindicacoes" element={<P.AdminReivindicacoes />} />
      <Route path="ssot" element={<P.AdminSSOT />} />
      <Route path="highlights" element={<P.AdminHighlights />} />
      <Route path="territory-content" element={<P.AdminTerritoryContent />} />
      <Route path="territorial-groups" element={<P.AdminTerritorialGroups />} />
      <Route path="city-metadata" element={<P.AdminCityMetadata />} />
      <Route path="territory-management" element={<P.AdminTerritoryManagement />} />
      <Route path="guia/pontos-turisticos" element={<P.AdminGuideTouristPointsPage />} />
      <Route path="guia/pontos-turisticos/novo" element={<P.AdminGuideTouristPointFormPage />} />
      <Route path="guia/pontos-turisticos/:id/editar" element={<P.AdminGuideTouristPointFormPage />} />
      <Route path="locations" element={<P.LocationsAdminPage />} />
      </Route>
    </Routes>
  );
}

import { Route, Routes } from "react-router-dom";
import * as P from "../centralLazyImports";

export function CentralRoutes() {
  return (
    <Routes>
      <Route element={<P.CentralLayout />}>
        <Route element={<P.CentralAccessGuard />}>
          <Route index element={<P.CentralHubPage />} />
          <Route path="eventos" element={<P.EventsErrorBoundary><P.EventsOrganizerDashboard /></P.EventsErrorBoundary>} />
          <Route path="eventos/novo" element={<P.EventsErrorBoundary><P.EventsOrganizerForm /></P.EventsErrorBoundary>} />
          <Route path="eventos/editar/:eventId" element={<P.EventsErrorBoundary><P.EventsOrganizerForm /></P.EventsErrorBoundary>} />
          <Route path="eventos/analytics/:eventId" element={<P.EventsErrorBoundary><P.EventsOrganizerAnalyticsPage /></P.EventsErrorBoundary>} />
          <Route path="comunicacao" element={<P.CentralComunicacaoPage />} />
          <Route path="comunicacao/:channelSlug" element={<P.CommunicationAgentDashboard />} />
          <Route path="empresas" element={<P.CentralEmpresasPage />} />
          <Route path="empresas/nova" element={<P.CriarEmpresaPage />} />
          <Route path="empresas/nova/:verticalSlug" element={<P.CriarEmpresaPage />} />
          <Route path="empresas/:businessId" element={<P.BusinessAdminGuard />}>
            <Route element={<P.BusinessDashboardShellPage />}>
              <Route index element={<P.BusinessOverviewPage />} />
              <Route path="dados" element={<P.BusinessDetailsPage />} />
              <Route path="gastronomia" element={<P.GastronomyDashboardPage />} />
              <Route path="gastronomia/setup" element={<P.GastronomySetupPage />} />
              <Route path="gastronomia/cardapio" element={<P.MenuManagementPage />} />
              <Route path="gastronomia/horarios" element={<P.BusinessHoursPage />} />
              <Route path="gastronomia/area-entrega" element={<P.DeliveryAreaPage />} />
              <Route path="gastronomia/pedidos" element={<P.OrdersPage />} />
              <Route path="gastronomia/pedidos/:orderId" element={<P.OrderDetailsPage />} />
              <Route path="gastronomia/entregas" element={<P.DeliveryManagementPage />} />
              <Route path="gastronomia/analytics" element={<P.AnalyticsPage />} />
              <Route path="gastronomia/promocoes" element={<P.GastronomyPromotionsPage />} />
              <Route path="educacao" element={<P.EducationDashboardPage />} />
              <Route path="educacao/setup" element={<P.EducationSetupPage />} />
              <Route path="educacao/programas" element={<P.EducationProgramsPage />} />
              <Route path="educacao/leads" element={<P.EducationLeadsPage />} />
              <Route path="educacao/eventos" element={<P.EducationEventsPage />} />
              <Route path="educacao/analytics" element={<P.EducationAnalyticsPage />} />
              <Route path="educacao/planos" element={<P.EducationPlansPage />} />
              <Route path="planos" element={<P.BusinessPlansPage />} />
              <Route path="link-premium" element={<P.BusinessPremiumSitePage />} />
              <Route path="analytics" element={<P.BusinessAnalyticsPage />} />
              <Route path="configuracoes" element={<P.BusinessSettingsPage />} />
            </Route>
          </Route>
          <Route path="profissional" element={<P.ProfessionalGuard />}>
            <Route index element={<P.CentralProfissionalPage />} />
          </Route>
          <Route path="motorista" element={<P.DriverGuard service="motorista" />}>
            <Route element={<P.CentralMotoristaPage />} />
            <Route path="cadastro" element={<P.CentralMotoristaCadastroPage />} />
            <Route path="disponibilidade" element={<P.CentralMotoristaDisponibilidadePage />} />
            <Route path="corridas" element={<P.CentralMotoristaCorridasPage />} />
            <Route path="ganhos" element={<P.CentralMotoristaGanhosPage />} />
            <Route path="configuracoes" element={<P.CentralMotoristaConfiguracoesPage />} />
          </Route>
          <Route path="motoboy" element={<P.DriverGuard service="motoboy" />}>
            <Route element={<P.CentralMotoboyPage />} />
            <Route path="cadastro" element={<P.CentralMotoboyCadastroPage />} />
            <Route path="disponibilidade" element={<P.CentralMotoboyDisponibilidadePage />} />
            <Route path="entregas" element={<P.CentralMotoboyEntregasPage />} />
            <Route path="ganhos" element={<P.CentralMotoboyGanhosPage />} />
            <Route path="configuracoes" element={<P.CentralMotoboyConfiguracoesPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

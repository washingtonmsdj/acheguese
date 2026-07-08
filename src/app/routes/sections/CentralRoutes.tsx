import { Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { isLaunchSurfaceEnabled, type LaunchSurfaceKey } from "@/config/launchScope";
import LaunchPausedPage from "@/app/pages/LaunchPausedPage";
import * as P from "../centralLazyImports";

export function CentralRoutes() {
  const launchElement = (
    surface: LaunchSurfaceKey,
    moduleName: string,
    element: ReactNode,
  ) => (isLaunchSurfaceEnabled(surface) ? element : <LaunchPausedPage moduleName={moduleName} />);

  return (
    <Routes>
      <Route element={<P.CentralLayout />}>
        <Route element={<P.CentralAccessGuard />}>
          <Route index element={<P.CentralHubPage />} />
          <Route path="eventos" element={launchElement("events", "Eventos", <P.EventsErrorBoundary><P.EventsOrganizerDashboard /></P.EventsErrorBoundary>)} />
          <Route path="eventos/novo" element={launchElement("events", "Eventos", <P.EventsErrorBoundary><P.EventsOrganizerForm /></P.EventsErrorBoundary>)} />
          <Route path="eventos/editar/:eventId" element={launchElement("events", "Eventos", <P.EventsErrorBoundary><P.EventsOrganizerForm /></P.EventsErrorBoundary>)} />
          <Route path="eventos/analytics/:eventId" element={launchElement("events", "Eventos", <P.EventsErrorBoundary><P.EventsOrganizerAnalyticsPage /></P.EventsErrorBoundary>)} />
          <Route path="comunicacao" element={launchElement("communication", "Comunicação", <P.CentralComunicacaoPage />)} />
          <Route path="comunicacao/:channelSlug" element={launchElement("communication", "Comunicação", <P.CommunicationAgentDashboard />)} />
          <Route path="empresas" element={<P.CentralEmpresasPage />} />
          <Route path="empresas/nova" element={<P.CriarEmpresaPage />} />
          <Route path="empresas/nova/:verticalSlug" element={<P.CriarEmpresaPage />} />
          <Route path="empresas/:businessId" element={<P.BusinessAdminGuard />}>
            <Route element={<P.BusinessDashboardShellPage />}>
              <Route index element={<P.BusinessOverviewPage />} />
              <Route path="dados" element={<P.BusinessDetailsPage />} />
              <Route path="gastronomia">
                <Route index element={<P.GastronomyDashboardPage />} />
                <Route path="setup" element={<P.GastronomySetupPage />} />
                <Route path="cardapio" element={<P.MenuManagementPage />} />
                <Route path="horarios" element={<P.BusinessHoursPage />} />
                <Route path="area-entrega" element={<P.DeliveryAreaPage />} />
                <Route path="pedidos">
                  <Route index element={<P.OrdersPage />} />
                  <Route path=":orderId" element={<P.OrderDetailsPage />} />
                </Route>
                <Route path="entregas" element={launchElement("mobility", "Entregas", <P.DeliveryManagementPage />)} />
                <Route path="analytics" element={launchElement("publicAnalytics", "Analytics", <P.AnalyticsPage />)} />
                <Route path="promocoes" element={launchElement("coupons", "Promocoes", <P.GastronomyPromotionsPage />)} />
              </Route>
              <Route path="educacao" element={launchElement("education", "Educação", <P.EducationDashboardPage />)} />
              <Route path="educacao/setup" element={launchElement("education", "Educação", <P.EducationSetupPage />)} />
              <Route path="educacao/programas" element={launchElement("education", "Educação", <P.EducationProgramsPage />)} />
              <Route path="educacao/leads" element={launchElement("education", "Educação", <P.EducationLeadsPage />)} />
              <Route path="educacao/eventos" element={launchElement("education", "Educação", <P.EducationEventsPage />)} />
              <Route path="educacao/analytics" element={launchElement("education", "Educação", <P.EducationAnalyticsPage />)} />
              <Route path="educacao/planos" element={launchElement("education", "Educação", <P.EducationPlansPage />)} />
              <Route path="planos" element={<P.BusinessPlansPage />} />
              <Route path="link-premium" element={<P.BusinessPremiumSitePage />} />
              <Route path="analytics" element={launchElement("publicAnalytics", "Analytics", <P.BusinessAnalyticsPage />)} />
              <Route path="configuracoes" element={<P.BusinessSettingsPage />} />
            </Route>
          </Route>
          <Route path="profissional" element={<P.ProfessionalGuard />}>
            <Route index element={<P.CentralProfissionalPage />} />
          </Route>
          <Route path="motorista" element={launchElement("mobility", "Mobilidade", <P.DriverGuard service="motorista" />)}>
            <Route element={<P.CentralMotoristaPage />} />
            <Route path="cadastro" element={<P.CentralMotoristaCadastroPage />} />
            <Route path="disponibilidade" element={<P.CentralMotoristaDisponibilidadePage />} />
            <Route path="corridas" element={<P.CentralMotoristaCorridasPage />} />
            <Route path="ganhos" element={<P.CentralMotoristaGanhosPage />} />
            <Route path="configuracoes" element={<P.CentralMotoristaConfiguracoesPage />} />
          </Route>
          <Route path="motoboy" element={launchElement("mobility", "Mobilidade", <P.DriverGuard service="motoboy" />)}>
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

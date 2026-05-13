/**
 * AppRoutes - Configuração Centralizada de Rotas
 * 
 * Este componente contém todas as rotas da aplicação,
 * separado do App.tsx para melhor organização e manutenção.
 * 
 * @version 1.0.0
 */

import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { LAUNCH_TERRITORIES } from "@/config/territory";

// Territorial Components (eager - critical for routing)
import { TerritorialLayout } from "@/core/routing/components/TerritorialLayout";
import { CommunityTerritorialShell } from "@/core/routing/components/CommunityTerritorialShell";
import { TerritorialIndexPage } from "@/core/routing/components/TerritorialIndexPage";
import { StateLandingPage } from "@/core/routing/components/StateLandingPage";
import { CountryLandingPage } from "@/core/routing/components/CountryLandingPage";
import { BrasilShowcasePage } from "@/core/routing/components/BrasilShowcasePage";
import {
  TerritorialCommunityPage,
  TerritorialCommunityAlertsPage,
  TerritorialCommunityIssuesPage,
  TerritorialBusinessPage,
  TerritorialServicesPage,
  TerritorialClassificadosPage,
  TerritorialEventosPage,
  TerritorialGastronomyPage,
  TerritorialMobilidadePage,
  TerritorialVagasPage,
  TerritorialCategoryBusinessPage,
  TerritorialMapPage,
} from "@/core/routing/components/TerritorialModulePages";

// Lazy imports organizados por domínio
import * as P from "./lazyImports";

export function AppRoutes() {
  const launchComplexoPath =
    LAUNCH_TERRITORIES.find((territory) => territory.slug === "complexo-do-nordeste-de-amaralina")?.path ??
    "/ba/salvador/area/complexo-do-nordeste-de-amaralina";
  const mvpCommunityPath = "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina";

  return (
    <Routes>
      {/* QR Code Resolver - DEVE VIR ANTES DE OUTRAS ROTAS */}
      <Route path="/q/:token" element={<P.QrResolverPage />} />
      
      {/* Status Page - Página pública de status do sistema */}
      <Route path="/status" element={<P.StatusPage />} />
      
      <Route path="/splash" element={<P.SplashPage />} />
      <Route path="/login" element={<P.LoginPage />} />
      <Route path="/cadastro" element={<P.CadastroPage />} />
      <Route path="/cadastro/confirmacao" element={<P.CadastroConfirmacaoPage />} />
      <Route path="/login-simple" element={<P.SimpleLoginPage />} />
      <Route path="/sobre" element={<P.AboutPage />} />
      <Route path="/contato" element={<P.ContactPage />} />
      <Route path="/onboarding" element={<P.OnboardingPage />} />
      <Route path="/reset-password" element={<P.ResetPasswordPage />} />
      <Route path="/complexo" element={<Navigate to={launchComplexoPath} replace />} />
        <Route path="/empresas/:id/catalogo" element={<P.EmpresaCatalogoPublicoPage />} />
        <Route path="/servicos" element={<P.ServicosLandingPage />} />
        <Route path="/p/:slug/*" element={<P.PremiumBusinessSiteRoute />}>
        <Route index element={<P.PremiumBusinessHomePage />} />
        <Route path="cardapio" element={<P.PremiumBusinessMenuPage />} />
        <Route path="produto/:productSlug" element={<P.PremiumBusinessProductPage />} />
        <Route path="carrinho" element={<P.PremiumBusinessCartPage />} />
        <Route path="checkout" element={<P.PremiumBusinessCheckoutPage />} />
      </Route>

      <Route element={<P.AppLayoutSidebar />}>
        {/* Página inicial */}
        <Route path="/" element={<P.MainLandingPage />} />
        <Route path="/home-v2" element={<P.HomePageV2 />} />
        <Route path="/home-v1" element={<P.HomePage />} />
        
        {/* Rotas de Billing e Assinaturas */}
        <Route path="/pricing" element={<P.PricingPage />} />
        <Route path="/checkout/success" element={<P.CheckoutSuccessPage />} />
        <Route path="/checkout/cancel" element={<P.CheckoutCancelPage />} />
        <Route path="/settings/subscription" element={<P.SubscriptionManagementPage />} />
        
        {/* Rotas de Notificações */}
        <Route path="/notifications" element={<P.NotificationsPage />} />
        <Route path="/notificacoes" element={<P.NotificationsPage />} />
        <Route path="/settings/notifications" element={<P.NotificationPreferencesPage />} />
        <Route path="/settings/email-logs" element={<P.EmailLogsPage />} />
        
        {/* Rotas públicas de landing pages */}
        <Route path="/empresas-landing" element={<P.EmpresasLandingPage />} />
        <Route path="/servicos-landing" element={<P.ServicosLandingPage />} />
        <Route path="/empresa/:id" element={<P.BusinessLegacyRoute />} />
        <Route path="/classificado/:id" element={<P.ClassificadoDetailLandingPage />} />
        <Route path="/classificado/:id/chat" element={<P.ClassificadoChatLandingPage />} />
        <Route path="/vagas/detalhe/:id" element={<P.VagaDetailPage />} />
        
        {/* Rotas globais */}
        <Route path="/u/:username" element={<P.ProfilePublicRoute />} />
        <Route path="/c/:publicId" element={<P.ClassifiedShortRoute />} />
        <Route path="/vagas/publicar" element={<P.PublicarVagaPage />} />
        <Route path="/services/cadastrar" element={<P.CadastrarServicoPage />} />
        <Route path="/services/:id/editar" element={<P.EditarServicoPage />} />
        <Route path="/services/:id" element={<P.ProfissionalDetailPage />} />
        <Route path="/servicos/orcamentos/:leadId" element={<P.ProfessionalLeadTrackingPage />} />
        <Route path="/classificados/novo" element={<P.NovoClassificadoPage />} />
        <Route path="/classificados/editar/:id" element={<P.EditarClassificadoPage />} />
        <Route path="/classificados/vendedor/:sellerId" element={<P.VendedorPerfilPage />} />
        <Route path="/classificados/:id" element={<P.ClassificadoDetailPage />} />
        
        {/* Dev/Admin Routes */}
        {import.meta.env.DEV && (
          <Route path="/dev/mobility/motoboy-validation" element={<P.MotoboyValidationPage />} />
        )}
        
        <Route path="/eventos" element={<P.EventosPage />} />
        <Route path="/eventos/:id" element={<P.EventoDetailPage />} />
        <Route path="/cupons" element={<P.CuponsPage />} />
        <Route path="/cupons/:id" element={<P.CupomDetailPage />} />
        <Route path="/conta/preferencias" element={<P.ContaPreferenciasPage />} />
        <Route path="/conta/notificacoes" element={<P.NotificationPreferencesPage />} />
        <Route path="/conta/privacidade" element={<P.PrivacySettingsPage />} />
        <Route path="/conta/seguranca" element={<P.ContaSegurancaPage />} />
        <Route path="/conta/enderecos" element={<P.ContaEnderecosPage />} />
        <Route path="/conta/profissional" element={<P.ContaProfissionalPage />} />
        <Route path="/conta/editar" element={<P.ContaEditarPage />} />
        <Route path="/conta/editar/:profileId" element={<P.ContaEditarPerfilPage />} />
        <Route path="/conta" element={<P.ContaPage />} />
        <Route path="/gamificacao" element={<P.GamificacaoPage />} />
        <Route path="/empresas" element={<P.EmpresasLandingPage />} />
        <Route path="/empresas/cadastrar" element={<P.EmpresasCadastroLandingPage />} />
        <Route path="/edit-business/:profileId" element={<P.EditarEmpresaPage />} />
        <Route path="/central" element={<P.CentralLayout />}>
          <Route element={<P.CentralAccessGuard />}>
            <Route index element={<P.CentralHubPage />} />
            <Route path="empresas" element={<P.CentralEmpresasPage />} />
            <Route path="empresas/nova" element={<P.CriarEmpresaPage />} />
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
                <Route path="education" element={<P.EducationDashboardPage />} />
                <Route path="education/setup" element={<P.EducationSetupPage />} />
                <Route path="education/programas" element={<P.EducationProgramsPage />} />
                <Route path="education/programs" element={<P.EducationProgramsPage />} />
                <Route path="education/leads" element={<P.EducationLeadsPage />} />
                <Route path="education/eventos" element={<P.EducationEventsPage />} />
                <Route path="education/events" element={<P.EducationEventsPage />} />
                <Route path="education/analytics" element={<P.EducationAnalyticsPage />} />
                <Route path="education/planos" element={<P.EducationPlansPage />} />
                <Route path="education/plans" element={<P.EducationPlansPage />} />
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

        <Route path="/admin/dashboard" element={<P.AdminDashboardPage />} />
        <Route path="/admin/businesses" element={<P.AdminBusinessesPage />} />
        <Route path="/admin/plans" element={<P.AdminPlansPage />} />
        <Route path="/mensagens" element={<P.MensagensPage />} />
        <Route path="/chat/:conversationId" element={<P.ChatPage />} />
        <Route path="/mapa" element={<P.MapaPage />} />
        <Route path="/perto-de-mim" element={<P.NearbyPage />} />
        <Route path="/analytics" element={<P.GeneralAnalyticsPage />} />
        <Route path="/recomendacoes" element={<P.RecomendacoesPage />} />
        <Route path="/recomendacoes/nova" element={<P.NovaRecomendacaoPage />} />
        <Route path="/recomendacoes/:id" element={<P.RecomendacaoDetailPage />} />
        <Route path="/achados-perdidos" element={<P.AchadosPerdidosPage />} />
        <Route path="/achados-perdidos/novo" element={<P.NovoAchadoPerdidoPage />} />
        <Route path="/achados-perdidos/:id" element={<P.AchadoPerdidoDetailPage />} />
        <Route path="/ranking" element={<P.RankingPage />} />
        <Route path="/track/:token" element={<P.TrackRidePage />} />
        <Route path="/comunidade/grupos" element={<Navigate to="/comunidade?tab=grupos" replace />} />
        <Route path="/comunidade/grupos/:id" element={<P.GrupoDetailPage />} />
        <Route path="/novo-post" element={<P.NovoPostPage />} />
        <Route path="/exemplo-post" element={<P.ExamplePostPage />} />
        <Route path="/busca" element={<P.BuscaPage />} />
        <Route path="/buscar" element={<P.BuscarPage />} />
        <Route path="/buscar/:state/:city" element={<P.BuscarPage />} />
        <Route path="/buscar/:state/:city/:district" element={<P.BuscarPage />} />
        <Route path="/ai/virtual-try-on" element={<P.VirtualTryOnPage />} />
        <Route path="/regras" element={<P.RegrasPage />} />
        <Route path="/termos" element={<P.TermosPage />} />
        <Route path="/privacidade" element={<P.PrivacidadePage />} />
        <Route path="/offline-settings" element={<P.OfflineSettingsPage />} />
        
        {/* 🔒 LGPD / Privacidade */}
        <Route path="/dpo" element={<P.DPOContactPage />} />
        <Route path="/motorista-legacy" element={<P.MotoristaPage />} />

        {/* Rotas legadas sem território */}
        <Route path="/educacao" element={<P.EducationExplorerPage />} />
        <Route path="/comunidade" element={<P.ComunidadePage />} />
        <Route path="/comunidade/alertas" element={<P.AlertasPage />} />
        <Route path="/comunidade/problemas" element={<P.ProblemasPage />} />
        <Route path="/alertas" element={<P.AlertasPage />} />
        <Route path="/services" element={<P.ServicosLandingPage />} />
        <Route path="/classificados" element={<P.ClassificadosPage />} />
        <Route path="/mobilidade/passageiro" element={<P.PassageiroPage />} />
        <Route path="/mobilidade/buscando/:rideId" element={<P.BuscandoMotoristaPage />} />
        <Route path="/mobilidade/motorista" element={<P.MotoristaPageV2 />} />
        <Route path="/mobilidade/motoboy" element={<P.MotoboyPage />} />
        <Route path="/mobilidade/motorista/perfil" element={<P.DriverProfilePage />} />
        <Route path="/mobilidade/historico" element={<P.HistoricoPage />} />
        <Route path="/mobilidade/contatos-emergencia" element={<P.EmergencyContactsPage />} />
        <Route path="/mobilidade" element={<P.MobilidadePage />} />

        {/* Rotas canônicas específicas — DEVEM VIR ANTES DAS TERRITORIAIS GENÉRICAS */}
        
        {/* Rota pública de profissional: /profissionais/:uf/:cidade/:slug */}
        <Route path="/profissionais/:uf/:cidade/:slug" element={<P.ProfissionalPublicPage />} />

        {/* Módulo Pontos Turísticos — vertical tourism */}
        
        {/* Rota de fallback por ID (UUID): /pontos-turisticos/:id */}
        <Route path="/pontos-turisticos/:id" element={<P.GuideTouristPointDetailPage />} />
        
        {/* Detalhe com distrito (4 segmentos): /pontos-turisticos/:state/:city/:district/:slug */}
        <Route path="/pontos-turisticos/:state/:city/area/:groupSlug/:slug" element={<TerritorialLayout />}>
          <Route index element={<P.GuideTouristPointDetailPage />} />
        </Route>
        <Route path="/pontos-turisticos/:state/:city/:groupSlugOrDistrict/:slug" element={<TerritorialLayout />}>
          <Route index element={<P.GuideTouristPointDetailPage />} />
        </Route>
        
        {/* Rota ambígua (3 segmentos): pode ser listagem com district OU detalhe com slug */}
        <Route path="/pontos-turisticos/:state/:city/area/:groupSlug" element={<TerritorialLayout />}>
          <Route index element={<P.TouristPointRouteResolver />} />
        </Route>
        <Route path="/pontos-turisticos/:state/:city/:district" element={<TerritorialLayout />}>
          <Route index element={<P.TouristPointRouteResolver />} />
        </Route>
        
        {/* Listagem cidade (2 segmentos): /pontos-turisticos/:state/:city */}
        <Route path="/pontos-turisticos/:state/:city" element={<TerritorialLayout />}>
          <Route index element={<P.GuideTouristPointsPage />} />
        </Route>

        {/* Rotas territoriais genéricas — DEVEM VIR DEPOIS DAS ESPECÍFICAS */}
        
        {/* Landing territorial genérico */}
        <Route path="/:state/:city/area/:groupSlug" element={<TerritorialLayout />}>
          <Route
            index
            element={
              <TerritorialIndexPage
                CityLandingComponent={P.CidadeLandingPage}
                ComplexoLandingComponent={P.ComplexoNordesteLandingPage}
              />
            }
          />
        </Route>
        <Route path="/:state/:city/:district" element={<TerritorialLayout />}>
          <Route
            index
            element={
              <TerritorialIndexPage
                CityLandingComponent={P.CidadeLandingPage}
                ComplexoLandingComponent={P.ComplexoNordesteLandingPage}
              />
            }
          />
        </Route>
        <Route path="/:state/:city" element={<TerritorialLayout />}>
          <Route
            index
            element={
              <TerritorialIndexPage
                CityLandingComponent={P.CidadeLandingPage}
                ComplexoLandingComponent={P.ComplexoNordesteLandingPage}
              />
            }
          />
        </Route>

        {/* Landing de estado — lista cidades ativas */}
        <Route path="/:state" element={<StateLandingPage />} />

        {/* Landing de país — lista estados ativos */}
        <Route path="/brasil" element={<BrasilShowcasePage />} />
        <Route path="/br" element={<CountryLandingPage />} />

        {/* Módulo empresas — estrutura hierárquica clara */}
        {/* 5 segmentos = empresa específica: /empresas/:uf/:cidade/:bairro/:slug */}
        <Route
          path="/empresas/:state/:city/:district/:slug"
          element={<P.BusinessRouteResolver BusinessDetailComponent={P.EmpresaDetailLandingPage} />}
        />
        
        {/* Categoria: /empresas/:uf/:cidade/categoria/:category */}
        <Route path="/empresas/:state/:city/categoria/:category" element={<TerritorialLayout />}>
          <Route index element={<TerritorialCategoryBusinessPage />} />
        </Route>
        
        {/* Categoria no bairro: /empresas/:uf/:cidade/:bairro/categoria/:category */}
        <Route path="/empresas/:state/:city/:district/categoria/:category" element={<TerritorialLayout />}>
          <Route index element={<TerritorialCategoryBusinessPage />} />
        </Route>
        
        {/* Grupo territorial: /empresas/:uf/:cidade/area/:grupo */}
        <Route path="/empresas/:state/:city/area/:groupSlug" element={<TerritorialLayout />}>
          <Route index element={<P.EmpresasLandingPage />} />
        </Route>

        {/* 4 segmentos = hub do bairro: /empresas/:uf/:cidade/:bairro */}
        <Route path="/empresas/:state/:city/:district" element={<TerritorialLayout />}>
          <Route index element={<P.EmpresasLandingPage />} />
        </Route>
        
        {/* 3 segmentos = hub da cidade: /empresas/:uf/:cidade */}
        <Route path="/empresas/:state/:city" element={<TerritorialLayout />}>
          <Route index element={<P.EmpresasLandingPage />} />
        </Route>

        {/* Rotas de serviços */}
        <Route path="/servicos/:state/:city/area/:groupSlug" element={<TerritorialLayout />}>
          <Route index element={<TerritorialServicesPage />} />
        </Route>
        <Route path="/servicos/:state/:city/:district" element={<TerritorialLayout />}>
          <Route index element={<TerritorialServicesPage />} />
        </Route>
        <Route path="/servicos/:state/:city" element={<TerritorialLayout />}>
          <Route index element={<TerritorialServicesPage />} />
        </Route>

        {/* Rotas de classificados */}
        {/* 7 segmentos = classificado específico: /classificados/:uf/:cidade/:bairro/:categoria/:subcategoria/:slug/:publicId */}
        <Route path="/classificados/:uf/:cidade/:bairro/:categoria/:subcategoria/:slug/:publicId" element={<P.ClassifiedCanonicalRoute />} />
        
        {/* 5 segmentos = hub categoria no bairro: /classificados/:uf/:cidade/:bairro/:categoria/:subcategoria */}
        <Route path="/classificados/:state/:city/:district/:category/:subcategory" element={<TerritorialLayout />}>
          <Route index element={<TerritorialClassificadosPage />} />
        </Route>
        
        {/* 4 segmentos = hub categoria no bairro: /classificados/:uf/:cidade/:bairro/:categoria */}
        <Route path="/classificados/:state/:city/:district/:category" element={<TerritorialLayout />}>
          <Route index element={<TerritorialClassificadosPage />} />
        </Route>
        
        {/* 3 segmentos = hub do bairro: /classificados/:uf/:cidade/:bairro */}
        <Route path="/classificados/:state/:city/area/:groupSlug" element={<TerritorialLayout />}>
          <Route index element={<TerritorialClassificadosPage />} />
        </Route>
        <Route path="/classificados/:state/:city/:district" element={<TerritorialLayout />}>
          <Route index element={<TerritorialClassificadosPage />} />
        </Route>
        
        {/* 2 segmentos = hub da cidade: /classificados/:uf/:cidade */}
        <Route path="/classificados/:state/:city" element={<TerritorialLayout />}>
          <Route index element={<TerritorialClassificadosPage />} />
        </Route>

        {/* Rotas de eventos */}
        <Route path="/eventos/:state/:city/area/:groupSlug" element={<TerritorialLayout />}>
          <Route index element={<TerritorialEventosPage />} />
        </Route>
        <Route path="/eventos/:state/:city/:district" element={<TerritorialLayout />}>
          <Route index element={<TerritorialEventosPage />} />
        </Route>
        <Route path="/eventos/:state/:city" element={<TerritorialLayout />}>
          <Route index element={<TerritorialEventosPage />} />
        </Route>

        {/* Rotas do mapa — mesmo padrão territorial */}
        <Route path="/mapa/:state/:city/area/:groupSlug" element={<TerritorialLayout />}>
          <Route index element={<TerritorialMapPage />} />
        </Route>
        <Route path="/mapa/:state/:city/:district" element={<TerritorialLayout />}>
          <Route index element={<TerritorialMapPage />} />
        </Route>
        <Route path="/mapa/:state/:city" element={<TerritorialLayout />}>
          <Route index element={<TerritorialMapPage />} />
        </Route>

        {/* Rotas de gastronomia */}
        <Route path="/gastronomia" element={<P.GastronomyLandingPage />} />
        {/* Detalhe premium: /gastronomia-premium/:uf/:cidade/:bairro/:slug */}
        <Route path="/gastronomia-premium/:state/:city/:district/:slug" element={<TerritorialLayout />}>
          <Route index element={<P.GastronomyPremiumDetailPage />} />
          <Route path="checkout" element={<P.GastronomyCheckoutPage />} />
        </Route>

        {/* Detalhe: /gastronomia/:uf/:cidade/:bairro/:slug */}
        <Route path="/gastronomia/:state/:city/:district/:slug" element={<TerritorialLayout />}>
          <Route index element={<P.GastronomyDetailPage />} />
          <Route path="checkout" element={<P.GastronomyCheckoutPage />} />
        </Route>
        
        {/* Listagem bairro: /gastronomia/:uf/:cidade/:bairro */}
        <Route path="/gastronomia/:state/:city/area/:groupSlug" element={<TerritorialLayout />}>
          <Route index element={<P.GastronomyLandingPage />} />
        </Route>
        <Route path="/gastronomia/:state/:city/:district" element={<TerritorialLayout />}>
          <Route index element={<P.GastronomyLandingPage />} />
        </Route>
        
        {/* Listagem cidade: /gastronomia/:uf/:cidade */}
        <Route path="/gastronomia/:state/:city" element={<TerritorialLayout />}>
          <Route index element={<P.GastronomyLandingPage />} />
        </Route>

        {/* Favoritos de gastronomia */}
        <Route path="/gastronomia/favoritos" element={<P.MyFavoritesPage />} />
        <Route path="/gastronomia/pedidos/:orderId" element={<P.OrderDetailsPage />} />

        {/* Rotas de Education — públicas territoriais (vitrine premium consolidada) */}
        {/* Detalhe: /educacao/:uf/:cidade/:bairro/:slug */}
        <Route path="/educacao/:state/:city/:district/:slug" element={<TerritorialLayout />}>
          <Route index element={<P.EducationDetailPage />} />
        </Route>

        {/* Listagem bairro: /educacao/:uf/:cidade/:bairro */}
        <Route path="/educacao/:state/:city/area/:groupSlug" element={<TerritorialLayout />}>
          <Route index element={<P.EducationExplorerPage />} />
        </Route>
        <Route path="/educacao/:state/:city/:district" element={<TerritorialLayout />}>
          <Route index element={<P.EducationExplorerPage />} />
        </Route>

        {/* Listagem cidade: /educacao/:uf/:cidade */}
        <Route path="/educacao/:state/:city" element={<TerritorialLayout />}>
          <Route index element={<P.EducationExplorerPage />} />
        </Route>

        {/* Redirecionamentos de URLs antigas — preservam o caminho apos o prefixo */}
        <Route path="/educacao-v3/*" element={<P.EducationExplorerPage />} />
        <Route path="/educacao-v2/*" element={<P.EducationExplorerPage />} />
        <Route path="/educacao-explorer/*" element={<P.EducationExplorerPage />} />

        {/* Rotas de comunidade */}
        <Route path="/comunidade/:state/:city/:territorySlug/alertas" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialCommunityAlertsPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/problemas" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialCommunityIssuesPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/empresas" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialBusinessPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/servicos" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialServicesPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/classificados" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialClassificadosPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/gastronomia" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialGastronomyPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/vagas" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialVagasPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/eventos" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialEventosPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/mapa" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialMapPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/mobilidade" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialMobilidadePage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/feed" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialCommunityPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/grupos" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialCommunityPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/achados-e-perdidos" element={<CommunityTerritorialShell />}>
          <Route index element={<P.AchadosPerdidosPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/area/:groupSlug/alertas" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialCommunityAlertsPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/area/:groupSlug/problemas" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialCommunityIssuesPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/area/:groupSlug/empresas" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialBusinessPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/area/:groupSlug/servicos" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialServicesPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/area/:groupSlug/classificados" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialClassificadosPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/area/:groupSlug/gastronomia" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialGastronomyPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/area/:groupSlug/vagas" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialVagasPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/area/:groupSlug/eventos" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialEventosPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/area/:groupSlug/mapa" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialMapPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/area/:groupSlug/mobilidade" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialMobilidadePage />} />
        </Route>
        <Route path="/comunidade/:state/:city/area/:groupSlug/feed" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialCommunityPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/area/:groupSlug/grupos" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialCommunityPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/area/:groupSlug/achados-e-perdidos" element={<CommunityTerritorialShell />}>
          <Route index element={<P.AchadosPerdidosPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/area/:groupSlug" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialCommunityPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug" element={<CommunityTerritorialShell />}>
          <Route index element={<TerritorialCommunityPage />} />
        </Route>
        <Route path="/comunidade/:state/:city" element={<P.MainLandingPage />} />

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* ROTAS DE VAGAS — Módulo Vertical AAA                                              */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        
        <Route path="/vagas" element={<P.VagasPublicPage />} />
        {/* Detalhe canônico: /vagas/:uf/:cidade/:slug */}
        <Route path="/vagas/:state/:city/:slug" element={<P.VagaDetailPublicPage />} />
        
        {/* Listagem territorial: /vagas/:uf/:cidade/:bairro */}
        <Route path="/vagas/:state/:city/area/:groupSlug" element={<TerritorialLayout />}>
          <Route index element={<TerritorialVagasPage />} />
        </Route>
        <Route path="/vagas/:state/:city/:district" element={<TerritorialLayout />}>
          <Route index element={<TerritorialVagasPage />} />
        </Route>
        
        {/* Listagem territorial cidade: /vagas/:uf/:cidade */}
        <Route path="/vagas/:state/:city" element={<TerritorialLayout />}>
          <Route index element={<TerritorialVagasPage />} />
        </Route>

      </Route>

      {/* Rotas de admin */}
      <Route path="/admin" element={<P.AdminLayout />}>
        <Route index element={<P.AdminDashboard />} />
        <Route path="banners" element={<P.AdminBanners />} />
        <Route path="empresas" element={<P.AdminEmpresas />} />
        <Route path="gastronomia" element={<P.AdminGastronomia />} />
        <Route path="services" element={<P.AdminServicos />} />
        <Route path="classificados" element={<P.AdminClassificados />} />
        <Route path="classificados/denuncias" element={<P.AdminClassificadosDenuncias />} />
        <Route path="vagas" element={<P.AdminVagas />} />
        <Route path="eventos" element={<P.AdminEventos />} />
        <Route path="usuarios" element={<P.AdminUsuarios />} />
        <Route path="users" element={<P.AdminUsuarios />} />
        <Route path="motoristas" element={<P.AdminMotoristas />} />
        <Route path="reports-passageiros" element={<P.AdminReportsPassageiros />} />
        <Route path="pontos-embarque" element={<P.AdminPontosEmbarque />} />
        <Route path="verificacoes" element={<P.AdminVerificacoes />} />
        <Route path="zeladoria" element={<P.AdminZeladoria />} />
        <Route path="analytics-mobilidade" element={<P.AdminAnalyticsMobilidade />} />
        <Route path="motoboy-operacoes" element={<P.AdminMotoboyOperations />} />
        <Route path="realtime-dashboard" element={<P.AdminRealtimeDashboard />} />
        <Route path="moderacao-completa" element={<P.AdminModeracaoCompleta />} />
        <Route path="moderacao" element={<P.AdminModeracao />} />
        <Route path="alertas" element={<P.AdminAlertas />} />
        <Route path="community-alerts" element={<P.AdminCommunityAlerts />} />
        <Route path="community-issues" element={<P.AdminCommunityIssues />} />
        <Route path="notifications" element={<P.AdminNotifications />} />
        <Route path="mensagens" element={<P.AdminMensagens />} />
        <Route path="gamificacao" element={<P.AdminGamificacao />} />
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
        <Route path="google-places-import" element={<P.AdminGooglePlacesImport />} />
        {/* Compatibilidade com links legados de pontos turísticos */}
        <Route path="pontos-turisticos" element={<P.AdminGuideTouristPointsPage />} />
        <Route path="pontos-turisticos/novo" element={<P.AdminGuideTouristPointFormPage />} />
        <Route path="pontos-turisticos/:id/editar" element={<P.AdminGuideTouristPointFormPage />} />

        {/* Módulo Guide - Pontos Turísticos */}
        <Route path="guia/pontos-turisticos" element={<P.AdminGuideTouristPointsPage />} />
        <Route path="guia/pontos-turisticos/novo" element={<P.AdminGuideTouristPointFormPage />} />
        <Route path="guia/pontos-turisticos/:id/editar" element={<P.AdminGuideTouristPointFormPage />} />
        
        {/* Gerenciamento de Locations */}
        <Route path="locations" element={<P.LocationsAdminPage />} />
      </Route>

      <Route path="*" element={<P.NotFound />} />
    </Routes>
  );
}

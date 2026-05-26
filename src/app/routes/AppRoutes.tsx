/**
 * AppRoutes - Configuracao Centralizada de Rotas
 *
 * Este componente contem todas as rotas da aplicacao,
 * separado do App.tsx para melhor organizacao e manutencao.
 *
 * @version 1.0.0
 */

import { Routes, Route } from "react-router-dom";

// Lazy imports organizados por dominio
import * as P from "./lazyImports";

export function AppRoutes() {
  return (
    <Routes>
      {/* QR Code Resolver - DEVE VIR ANTES DE OUTRAS ROTAS */}
      <Route path="/q/:token" element={<P.QrResolverPage />} />

      {/* Status Page - Pagina publica de status do sistema */}
      <Route path="/status" element={<P.StatusPage />} />

      {/* EVENTS - Sistema de Eventos */}
      <Route path="/eventos" element={<P.EventsErrorBoundary><P.EventsListPage /></P.EventsErrorBoundary>} />
      <Route path="/eventos/favoritos" element={<P.EventsErrorBoundary><P.EventsFavoritesPage /></P.EventsErrorBoundary>} />
      <Route path="/eventos/calendario" element={<P.EventsErrorBoundary><P.EventsCalendarPage /></P.EventsErrorBoundary>} />
      <Route path="/eventos/mapa" element={<P.EventsErrorBoundary><P.EventsMapPage /></P.EventsErrorBoundary>} />

      {/* Event Detail - Deve vir depois das rotas especificas */}
      <Route path="/eventos/:eventId" element={<P.EventsErrorBoundary><P.EventDetailPage /></P.EventsErrorBoundary>} />

      <Route path="/splash" element={<P.SplashPage />} />
      <Route path="/login" element={<P.LoginPage />} />
      <Route path="/cadastro" element={<P.CadastroPage />} />
      <Route path="/cadastro/confirmacao" element={<P.CadastroConfirmacaoPage />} />
      <Route path="/sobre" element={<P.AboutPage />} />
      <Route path="/contato" element={<P.ContactPage />} />
      <Route path="/onboarding" element={<P.OnboardingPage />} />
      <Route path="/reset-password" element={<P.ResetPasswordPage />} />
        <Route path="/empresas/:id/catalogo" element={<P.EmpresaCatalogoPublicoPage />} />
        <Route path="/p/:slug/*" element={<P.PremiumBusinessSiteRoute />}>
        <Route index element={<P.PremiumBusinessHomePage />} />
        <Route path="cardapio" element={<P.PremiumBusinessMenuPage />} />
        <Route path="produto/:productSlug" element={<P.PremiumBusinessProductPage />} />
        <Route path="carrinho" element={<P.PremiumBusinessCartPage />} />
        <Route path="checkout" element={<P.PremiumBusinessCheckoutPage />} />
      </Route>

      {/* Central - tem sidebar propria; nao usa AppLayoutSidebar */}
      <Route path="/central" element={<P.CentralLayout />}>
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

      <Route element={<P.AppLayoutSidebar />}>
        {/* Pagina inicial */}
        <Route path="/" element={<P.MainLandingPage />} />

        {/* Rotas de Billing e Assinaturas */}
        <Route path="/planos" element={<P.PricingPage />} />
        <Route path="/checkout/success" element={<P.CheckoutSuccessPage />} />
        <Route path="/checkout/cancel" element={<P.CheckoutCancelPage />} />
        <Route path="/settings/subscription" element={<P.SubscriptionManagementPage />} />

        {/* Rotas de Notificacoes */}
        <Route path="/notifications" element={<P.NotificationsPage />} />
        <Route path="/notificacoes" element={<P.NotificationsPage />} />
        <Route path="/settings/notifications" element={<P.NotificationPreferencesPage />} />
        <Route path="/settings/email-logs" element={<P.EmailLogsPage />} />

        {/* Rotas publicas de landing pages */}
        <Route path="/empresas-landing" element={<P.EmpresasLandingPage />} />
        <Route path="/servicos-landing" element={<P.ServicosLandingPage />} />
        <Route path="/vagas/detalhe/:id" element={<P.VagaDetailPage />} />

        {/* Rotas globais */}
        <Route path="/u/:username" element={<P.ProfilePublicRoute />} />
        <Route path="/c/:publicId" element={<P.ClassifiedShortRoute />} />
        <Route path="/vagas/publicar" element={<P.PublicarVagaPage />} />
        <Route path="/oportunidades" element={<P.WorkOpportunitiesPage />} />
        <Route path="/oportunidades/:id" element={<P.WorkOpportunityDetailPage />} />
        <Route path="/servicos/cadastrar" element={<P.CadastrarServicoPage />} />
        <Route path="/servicos/:id/editar" element={<P.EditarServicoPage />} />
        <Route path="/servicos/:id" element={<P.ProfissionalDetailPage />} />
        <Route path="/servicos/orcamentos/:leadId" element={<P.ProfessionalLeadTrackingPage />} />
        <Route path="/classificados/novo" element={<P.NovoClassificadoPage />} />
        <Route path="/classificados/editar/:id" element={<P.EditarClassificadoPage />} />
        <Route path="/classificados/vendedor/:sellerId" element={<P.VendedorPerfilPage />} />
        <Route path="/classificados/:id" element={<P.ClassificadoDetailPage />} />

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
        <Route path="/novo-post" element={<P.NovoPostPage />} />
        <Route path="/busca" element={<P.BuscaPage />} />
        <Route path="/buscar" element={<P.BuscarPage />} />
        <Route path="/buscar/:state/:city" element={<P.BuscarPage />} />
        <Route path="/buscar/:state/:city/:district" element={<P.BuscarPage />} />
        <Route path="/ai/virtual-try-on" element={<P.VirtualTryOnPage />} />
        <Route path="/regras" element={<P.RegrasPage />} />
        <Route path="/termos" element={<P.TermosPage />} />
        <Route path="/privacidade" element={<P.PrivacidadePage />} />
        <Route path="/offline-settings" element={<P.OfflineSettingsPage />} />

        {/* LGPD / Privacidade */}
        <Route path="/dpo" element={<P.DPOContactPage />} />
        {/* Rotas globais sem territorio */}
        <Route path="/educacao" element={<P.EducationExplorerPage />} />
        <Route path="/comunicacao" element={<P.CommunicationLandingPage />} />
        <Route path="/comunicacao/solicitar" element={<P.CommunicationRequestPage />} />
        <Route path="/servicos" element={<P.ServicosLandingPage />} />
        <Route path="/classificados" element={<P.ClassificadosPage />} />
        <Route path="/mobilidade/passageiro" element={<P.PassageiroPage />} />
        <Route path="/mobilidade/buscando/:rideId" element={<P.BuscandoMotoristaPage />} />
        <Route path="/mobilidade/motorista" element={<P.MotoristaPage />} />
        <Route path="/mobilidade/motoboy" element={<P.MotoboyPage />} />
        <Route path="/mobilidade/motorista/perfil" element={<P.DriverProfilePage />} />
        <Route path="/mobilidade/historico" element={<P.HistoricoPage />} />
        <Route path="/mobilidade/contatos-emergencia" element={<P.EmergencyContactsPage />} />
        <Route path="/mobilidade" element={<P.MobilidadePage />} />

        {/* Rotas canonicas especificas - DEVEM VIR ANTES DAS TERRITORIAIS GENERICAS */}

        {/* Rota publica de profissional: /profissionais/:uf/:cidade/:slug */}
        <Route path="/profissionais/:uf/:cidade/:slug" element={<P.ProfissionalPublicPage />} />

        {/* Comunicacao Territorial - rotas especificas antes das territoriais genericas */}
        <Route path="/comunicacao/:state/:city/:territorySlug/:channelSlug" element={<P.CommunicationChannelPage />} />
        <Route path="/comunicacao/empresa/:channelSlug" element={<P.CommunicationCompanyDetailsPage />} />
        <Route path="/comunicacao/agente/:channelSlug" element={<P.CommunicationAgentPage />} />
        <Route path="/comunicacao/:state/:city/:territorySlug" element={<P.CommunicationTerritoryPage />} />
        <Route path="/comunicacao/:state/:city" element={<P.CommunicationCityPage />} />

        {/* Modulo Pontos Turisticos - vertical tourism */}

        {/* Rota de fallback por ID (UUID): /pontos-turisticos/:id */}
        <Route path="/pontos-turisticos/:id" element={<P.GuideTouristPointDetailPage />} />

        {/* Detalhe com distrito (4 segmentos): /pontos-turisticos/:state/:city/:district/:slug */}
        <Route path="/pontos-turisticos/:state/:city/:groupSlugOrDistrict/:slug" element={<P.TerritorialLayout />}>
          <Route index element={<P.GuideTouristPointDetailPage />} />
        </Route>

        {/* Rota ambigua (3 segmentos): pode ser listagem com district OU detalhe com slug */}
        <Route path="/pontos-turisticos/:state/:city/:district" element={<P.TerritorialLayout />}>
          <Route index element={<P.TouristPointRouteResolver />} />
        </Route>

        {/* Listagem cidade (2 segmentos): /pontos-turisticos/:state/:city */}
        <Route path="/pontos-turisticos/:state/:city" element={<P.TerritorialLayout />}>
          <Route index element={<P.GuideTouristPointsPage />} />
        </Route>

        {/* Rotas territoriais genericas - DEVEM VIR DEPOIS DAS ESPECIFICAS */}

        {/* Landing territorial generico */}
        <Route path="/:state/:city/:district" element={<P.TerritorialLayout />}>
          <Route
            index
            element={
              <P.TerritorialIndexPage
                CityLandingComponent={P.CidadeLandingPage}
              />
            }
          />
        </Route>
        <Route path="/:state/:city" element={<P.TerritorialLayout />}>
          <Route
            index
            element={
              <P.TerritorialIndexPage
                CityLandingComponent={P.CidadeLandingPage}
              />
            }
          />
        </Route>

        {/* Landing de estado - lista cidades ativas */}
        <Route path="/:state" element={<P.StateLandingPage />} />

        {/* Landing de pais - lista estados ativos */}
        <Route path="/brasil" element={<P.BrasilShowcasePage />} />
        <Route path="/br" element={<P.CountryLandingPage />} />

        {/* Modulo empresas - estrutura hierarquica clara */}
        {/* 5 segmentos = empresa especifica: /empresas/:uf/:cidade/:bairro/:slug */}
        <Route
          path="/empresas/:state/:city/:district/:slug"
          element={<P.BusinessRouteResolver BusinessDetailComponent={P.EmpresaDetailLandingPage} />}
        />

        {/* Categoria: /empresas/:uf/:cidade/categoria/:category */}
        <Route path="/empresas/:state/:city/categoria/:category" element={<P.TerritorialLayout />}>
          <Route index element={<P.TerritorialCategoryBusinessPage />} />
        </Route>

        {/* Categoria no bairro: /empresas/:uf/:cidade/:bairro/categoria/:category */}
        <Route path="/empresas/:state/:city/:district/categoria/:category" element={<P.TerritorialLayout />}>
          <Route index element={<P.TerritorialCategoryBusinessPage />} />
        </Route>

        {/* 4 segmentos = hub do bairro: /empresas/:uf/:cidade/:bairro */}
        <Route path="/empresas/:state/:city/:district" element={<P.TerritorialLayout />}>
          <Route index element={<P.EmpresasLandingPage />} />
        </Route>

        {/* 3 segmentos = hub da cidade: /empresas/:uf/:cidade */}
        <Route path="/empresas/:state/:city" element={<P.TerritorialLayout />}>
          <Route index element={<P.EmpresasLandingPage />} />
        </Route>

        {/* Rotas de servicos */}
        <Route path="/servicos/:state/:city/:district" element={<P.TerritorialLayout />}>
          <Route index element={<P.TerritorialServicesPage />} />
        </Route>
        <Route path="/servicos/:state/:city" element={<P.TerritorialLayout />}>
          <Route index element={<P.TerritorialServicesPage />} />
        </Route>

        {/* Rotas de classificados */}
        {/* 7 segmentos = classificado especifico: /classificados/:uf/:cidade/:bairro/:categoria/:subcategoria/:slug/:publicId */}
        <Route path="/classificados/:uf/:cidade/:bairro/:categoria/:subcategoria/:slug/:publicId" element={<P.ClassifiedCanonicalRoute />} />

        {/* 5 segmentos = hub categoria no bairro: /classificados/:uf/:cidade/:bairro/:categoria/:subcategoria */}
        <Route path="/classificados/:state/:city/:district/:category/:subcategory" element={<P.TerritorialLayout />}>
          <Route index element={<P.TerritorialClassificadosPage />} />
        </Route>

        {/* 4 segmentos = hub categoria no bairro: /classificados/:uf/:cidade/:bairro/:categoria */}
        <Route path="/classificados/:state/:city/:district/:category" element={<P.TerritorialLayout />}>
          <Route index element={<P.TerritorialClassificadosPage />} />
        </Route>

        {/* 3 segmentos = hub do bairro: /classificados/:uf/:cidade/:bairro */}
        <Route path="/classificados/:state/:city/:district" element={<P.TerritorialLayout />}>
          <Route index element={<P.TerritorialClassificadosPage />} />
        </Route>

        {/* 2 segmentos = hub da cidade: /classificados/:uf/:cidade */}
        <Route path="/classificados/:state/:city" element={<P.TerritorialLayout />}>
          <Route index element={<P.TerritorialClassificadosPage />} />
        </Route>

        {/* Rotas de eventos */}
        <Route path="/eventos/:state/:city/:district" element={<P.TerritorialLayout />}>
          <Route index element={<P.TerritorialEventosPage />} />
        </Route>
        <Route path="/eventos/:state/:city" element={<P.TerritorialLayout />}>
          <Route index element={<P.TerritorialEventosPage />} />
        </Route>

        {/* Rotas do mapa - mesmo padrao territorial */}
        <Route path="/mapa/:state/:city/:district" element={<P.TerritorialLayout />}>
          <Route index element={<P.TerritorialMapPage />} />
        </Route>
        <Route path="/mapa/:state/:city" element={<P.TerritorialLayout />}>
          <Route index element={<P.TerritorialMapPage />} />
        </Route>

        {/* Rotas de gastronomia */}
        <Route path="/gastronomia" element={<P.GastronomyLandingPage />} />
        {/* Detalhe premium: /gastronomia-premium/:uf/:cidade/:bairro/:slug */}
        <Route path="/gastronomia-premium/:state/:city/:district/:slug" element={<P.TerritorialLayout />}>
          <Route index element={<P.GastronomyPremiumDetailPage />} />
          <Route path="checkout" element={<P.GastronomyCheckoutPage />} />
        </Route>

        {/* Detalhe: /gastronomia/:uf/:cidade/:bairro/:slug */}
        <Route path="/gastronomia/:state/:city/:district/:slug" element={<P.TerritorialLayout />}>
          <Route index element={<P.GastronomyDetailPage />} />
          <Route path="checkout" element={<P.GastronomyCheckoutPage />} />
        </Route>

        {/* Listagem bairro: /gastronomia/:uf/:cidade/:bairro */}
        <Route path="/gastronomia/:state/:city/:district" element={<P.TerritorialLayout />}>
          <Route index element={<P.GastronomyLandingPage />} />
        </Route>

        {/* Listagem cidade: /gastronomia/:uf/:cidade */}
        <Route path="/gastronomia/:state/:city" element={<P.TerritorialLayout />}>
          <Route index element={<P.GastronomyLandingPage />} />
        </Route>

        {/* Favoritos de gastronomia */}
        <Route path="/gastronomia/favoritos" element={<P.MyFavoritesPage />} />
        <Route path="/gastronomia/pedidos/:orderId" element={<P.OrderDetailsPage />} />

        {/* Rotas de Education - publicas territoriais (vitrine premium consolidada) */}
        {/* Detalhe: /educacao/:uf/:cidade/:bairro/:slug */}
        <Route path="/educacao/:state/:city/:district/:slug" element={<P.TerritorialLayout />}>
          <Route index element={<P.EducationDetailPage />} />
        </Route>

        {/* Listagem bairro: /educacao/:uf/:cidade/:bairro */}
        <Route path="/educacao/:state/:city/:district" element={<P.TerritorialLayout />}>
          <Route index element={<P.EducationExplorerPage />} />
        </Route>

        {/* Listagem cidade: /educacao/:uf/:cidade */}
        <Route path="/educacao/:state/:city" element={<P.TerritorialLayout />}>
          <Route index element={<P.EducationExplorerPage />} />
        </Route>

        {/* Rotas de comunidade */}
        <Route path="/comunidade/:state/:city/area/:groupSlug/interesse" element={<P.CommunityInterestPage />} />
        <Route path="/comunidade/:state/:city/area/:groupSlug" element={<P.CommunityTerritorialShell />}>
          <Route index element={<P.TerritorialCommunityEntryPage />} />
          <Route path="problemas" element={<P.TerritorialCommunityIssuesPage />} />
          <Route path="comunicacao" element={<P.TerritorialCommunityCommunicationPage />} />
          <Route path="empresas" element={<P.TerritorialBusinessPage />} />
          <Route path="servicos" element={<P.TerritorialServicesPage />} />
          <Route path="classificados" element={<P.TerritorialClassificadosPage />} />
          <Route path="gastronomia" element={<P.TerritorialGastronomyPage />} />
          <Route path="educacao" element={<P.TerritorialEducationPage />} />
          <Route path="vagas" element={<P.TerritorialVagasPage />} />
          <Route path="vagas/publicar" element={<P.PublicarVagaPage />} />
          <Route path="eventos" element={<P.TerritorialEventosPage />} />
          <Route path="mapa" element={<P.TerritorialMapPage />} />
          <Route path="mobilidade" element={<P.TerritorialMobilidadePage />} />
          <Route path="feed" element={<P.TerritorialCommunityPage />} />
          <Route path="grupos" element={<P.TerritorialCommunityPage />} />
          <Route path="grupos/:id" element={<P.GrupoDetailPage />} />
          <Route path="achados-e-perdidos" element={<P.AchadosPerdidosPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/interesse" element={<P.CommunityInterestPage />} />
        <Route path="/comunidade/:state/:city/:territorySlug/problemas" element={<P.CommunityTerritorialShell />}>
          <Route index element={<P.TerritorialCommunityIssuesPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/comunicacao" element={<P.CommunityTerritorialShell />}>
          <Route index element={<P.TerritorialCommunityCommunicationPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/empresas" element={<P.CommunityTerritorialShell />}>
          <Route index element={<P.TerritorialBusinessPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/servicos" element={<P.CommunityTerritorialShell />}>
          <Route index element={<P.TerritorialServicesPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/classificados" element={<P.CommunityTerritorialShell />}>
          <Route index element={<P.TerritorialClassificadosPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/gastronomia" element={<P.CommunityTerritorialShell />}>
          <Route index element={<P.TerritorialGastronomyPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/educacao" element={<P.CommunityTerritorialShell />}>
          <Route index element={<P.TerritorialEducationPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/vagas" element={<P.CommunityTerritorialShell />}>
          <Route index element={<P.TerritorialVagasPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/vagas/publicar" element={<P.PublicarVagaPage />} />
        <Route path="/comunidade/:state/:city/:territorySlug/eventos" element={<P.CommunityTerritorialShell />}>
          <Route index element={<P.TerritorialEventosPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/mapa" element={<P.CommunityTerritorialShell />}>
          <Route index element={<P.TerritorialMapPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/mobilidade" element={<P.CommunityTerritorialShell />}>
          <Route index element={<P.TerritorialMobilidadePage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/feed" element={<P.CommunityTerritorialShell />}>
          <Route index element={<P.TerritorialCommunityPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/grupos" element={<P.CommunityTerritorialShell />}>
          <Route index element={<P.TerritorialCommunityPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/grupos/:id" element={<P.CommunityTerritorialShell />}>
          <Route index element={<P.GrupoDetailPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug/achados-e-perdidos" element={<P.CommunityTerritorialShell />}>
          <Route index element={<P.AchadosPerdidosPage />} />
        </Route>
        <Route path="/comunidade/:state/:city/:territorySlug" element={<P.CommunityTerritorialShell />}>
          <Route index element={<P.TerritorialCommunityEntryPage />} />
        </Route>

        {/* Rotas de vagas */}

        <Route path="/vagas" element={<P.VagasPublicPage />} />
        {/* Detalhe canonico: /vagas/:uf/:cidade/:slug */}
        <Route path="/vagas/:state/:city/:slug" element={<P.VagaDetailPublicPage />} />

        {/* Listagem territorial: /vagas/:uf/:cidade/:bairro */}
        <Route path="/vagas/:state/:city/:district" element={<P.TerritorialLayout />}>
          <Route index element={<P.TerritorialVagasPage />} />
        </Route>

        {/* Listagem territorial cidade: /vagas/:uf/:cidade */}
        <Route path="/vagas/:state/:city" element={<P.TerritorialLayout />}>
          <Route index element={<P.TerritorialVagasPage />} />
        </Route>

      </Route>

      {/* Rotas de admin */}
      <Route path="/admin" element={<P.AdminLayout />}>
        <Route index element={<P.AdminDashboard />} />
        <Route path="banners" element={<P.AdminBanners />} />
        <Route path="empresas" element={<P.AdminEmpresas />} />
        <Route path="gastronomia" element={<P.AdminGastronomia />} />
        <Route path="servicos" element={<P.AdminServicos />} />
        <Route path="classificados" element={<P.AdminClassificados />} />
        <Route path="classificados/denuncias" element={<P.AdminClassificadosDenuncias />} />
        <Route path="vagas" element={<P.AdminVagas />} />
        <Route path="eventos" element={<P.AdminEventos />} />
        <Route path="usuarios" element={<P.AdminUsuarios />} />
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
        <Route path="alertas" element={<P.AdminCommunityAlerts />} />
        <Route path="community-alerts" element={<P.AdminCommunityAlerts />} />
        <Route path="community-issues" element={<P.AdminCommunityIssues />} />
        <Route path="comunicacao" element={<P.AdminComunicacao />} />
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
        {/* Modulo Guide - Pontos Turisticos */}
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



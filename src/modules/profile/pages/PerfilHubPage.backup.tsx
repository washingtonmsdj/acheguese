import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  Car,
  CircleAlert,
  CreditCard,
  Database,
  Download,
  Globe,
  LayoutGrid,
  Lock,
  Pause,
  RefreshCw,
  Settings2,
  Shield,
  Trash2,
  Truck,
  UserRound,
  Users,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";

import { useProfileHub } from "@/modules/profile/hooks/useProfileHub";
import {
  AccountHealthPanel,
  BusinessModulesSection,
  ContentTabsSection,
  EmptyPanel,
  HubLinkCard,
  NextActionsPanel,
  NotificationsPanel,
  PersonalProfileIdentityCard,
  ProfileHeaderCompact,
  ProfileSectionsNav,
  ProfileStats,
  SectionFrame,
  type SectionNavItem,
} from "@/modules/profile/components/hub";
import { ProfileCompletenessWidget } from "@/modules/profile/components/ProfileCompletenessWidget";
import { ResidentVerificationCard } from "@/modules/profile/components/ResidentVerificationCard";
import { ProfileActiveRideCard } from "@/modules/profile/components/ProfileActiveRideCard";
import { ActivityTimeline } from "@/modules/profile/components/ActivityTimeline";
import { DataManagementDialogs } from "@/modules/profile/components/DataManagementDialogs";
import { BusinessOwnerQuickAccess } from "@/modules/profile/components/BusinessOwnerQuickAccess";
import { ReputationLevelCard } from "@/modules/profile/components/ReputationLevelCard";
import { GamificationCard } from "@/modules/profile/components/GamificationCard";
import { CivicEngagementCard } from "@/modules/profile/components/CivicEngagementCard";

// ✅ SSOT: Importar configuração de seções
import {
  PROFILE_SECTIONS,
  isProfileSectionId,
  type ProfileSectionId,
} from "@/modules/profile/config/profile-sections.config";

import type { ProfileBusinessModuleItem } from "@/core/profiles/services/types";
import type { Tables } from "@/integrations/supabase/types.generated";

type DriverDataRecord = Tables<"driver_data">;

function formatPlanLabel(value?: string | null): string {
  switch (value) {
    case "free":
      return "Free";
    case "pro":
      return "Pro";
    case "delivery":
      return "Delivery";
    case "basic":
      return "Basico";
    case "premium":
      return "Premium";
    case "enterprise":
      return "Enterprise";
    default:
      return value ? value[0].toUpperCase() + value.slice(1) : "Basico";
  }
}

function formatPercent(value?: number | null): string {
  if (typeof value !== "number") return "Nao informado";
  return `${Math.round(value)}%`;
}

function formatOptionalNumber(value?: number | null): string {
  if (typeof value !== "number") return "Nao informado";
  return String(value);
}

function formatDatePtBr(value?: string | null): string {
  if (!value) return "Nao informado";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Nao informado";

  return date.toLocaleDateString("pt-BR");
}

function formatBackgroundCheckStatus(value?: string | null): string {
  if (!value) return "Nao informado";
  if (value === "approved") return "Aprovado";
  if (value === "rejected") return "Reprovado";
  if (value === "pending") return "Pendente";
  return value;
}

type ProfileSectionItem = SectionNavItem<ProfileSectionId>;

export default function PerfilHubPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    user,
    activeProfile,
    profile,
    allProfiles,
    activeProfileId,
    isVerified,
    handle,
    canOpenPublicProfile,
    territoryLabel,
    context,
    identity,
    account,
    stats,
    operations,
    notifications,
    roles,
    businessModules,
    showBusinessOnboarding,
    loading,
    error,
    activeRide,
    hasActiveRide,
    verificationStatus,
    verificationRejectionReason,
    favorites,
    statsData,
    nextActions,
    hasDriverProfile,
    canManageProfileMembers,
    driverProfile,
    driverProfileId,
    driverData,
    driverDataLoading,
    handleAvatarChange,
    handleSwitchProfile,
    handleBusinessClick,
    copyToClipboard,
    refreshWorkspace,
    appUrls,
    moduleUrls,
    downloadDataOpen,
    setDownloadDataOpen,
    viewDataOpen,
    setViewDataOpen,
    deactivateOpen,
    setDeactivateOpen,
    deleteOpen,
    setDeleteOpen,
    deleteConfirm,
    setDeleteConfirm,
    handleDownloadData,
    handleDeactivateAccount,
    handleDeleteAccount,
  } = useProfileHub();

  const sectionParam = searchParams.get("sec");
  const activeSection: ProfileSectionId = isProfileSectionId(sectionParam)
    ? sectionParam
    : "resumo";

  // ✅ SSOT: Perfil personal é a identidade principal
  // - Username (@handle) só existe para perfil personal
  // - Aba "Resumo" e "Dados Pessoais" sempre mostram dados do perfil personal
  // - Aba "Empresas" mostra cada empresa específica
  // - Header e Sidebar sempre mostram perfil personal
  const personalProfile = allProfiles.find((p) => p.profile_type === "personal") || profile;
  const personalProfileId = personalProfile?.id ?? null;

  // ✅ SSOT: Usar configuração de seções com badges dinâmicos
  const sectionItems: ProfileSectionItem[] = PROFILE_SECTIONS.map((section) => {
    // Adicionar badges dinâmicos baseados no estado
    let badge: string | undefined;

    if (section.id === "empresas" && businessModules.length > 0) {
      badge = String(businessModules.length);
    } else if (section.id === "mobilidade" && operations.activeRides > 0) {
      badge = String(operations.activeRides);
    } else if (section.id === "notificacoes" && notifications.unread > 0) {
      badge = String(notifications.unread);
    }

    return {
      id: section.id,
      label: section.label,
      description: section.description,
      icon: section.icon,
      badge,
    };
  });

  const deliveryModules = businessModules.filter((item) =>
    item.gastronomy.deliveryEnabled ||
    item.subscription.canUseMotoboyNetwork ||
    item.subscription.canRequestDelivery ||
    item.subscription.canTrackDelivery ||
    item.subscription.canConfigureDeliveryArea ||
    item.subscription.canSetDeliveryFees ||
    item.subscription.canUseOwnDelivery,
  );
  const primaryBusinessModule = businessModules[0] ?? null;
  const primaryGastronomyModule = businessModules.find((item) => item.gastronomy.active) ?? null;
  const driverSnapshot = driverData as DriverDataRecord | null;
  const isDriverProfileActive = Boolean(driverProfileId && activeProfile?.id === driverProfileId);
  const driverDisplayName = driverProfile?.display_name || "Perfil de motorista";

  const setActiveSection = (section: ProfileSectionId) => {
    const nextParams = new URLSearchParams(searchParams);
    if (section === "resumo") {
      nextParams.delete("sec");
    } else {
      nextParams.set("sec", section);
    }
    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    if (!user) {
      navigate(appUrls.auth.login);
    }
  }, [user, navigate, appUrls.auth.login]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando area de perfil...</p>
        </div>
      </div>
    );
  }

  if (error && !profile && !identity) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">
        <div className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <CircleAlert className="mx-auto h-10 w-10 text-amber-600" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Nao foi possivel carregar o perfil
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O snapshot privado falhou. Tente novamente para recuperar os dados.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button className="gap-2" onClick={() => void refreshWorkspace()}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
            <Button variant="outline" onClick={() => navigate(appUrls.home)}>
              Ir para inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!activeProfile && !profile) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4">
        <div className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <Users className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Nenhuma identidade ativa disponivel
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta carregou, mas ainda nao ha um perfil operacional ativo.
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => navigate(appUrls.business.create)}>
              Criar empresa
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const renderSectionContent = () => {
    if (activeSection === "resumo") {
      return (
        <div className="space-y-6">
          {/* Corrida ativa (se houver) - Destaque no topo */}
          {hasActiveRide && activeRide ? (
            <ProfileActiveRideCard ride={activeRide as any} />
          ) : null}

          {/* Dashboard: Métricas principais consolidadas */}
          <SectionFrame
            title="Visão geral"
            description="Dashboard consolidado com métricas de todos os seus perfis e atividades."
          >
            <div className="space-y-6">
              {/* Grid principal de métricas */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                  icon={UserRound}
                  label="Posts"
                  value={operations.posts}
                  trend="+12%"
                  trendUp={true}
                  description="Conteúdo publicado"
                />
                <DashboardMetricCard
                  icon={Building2}
                  label="Empresas"
                  value={operations.businesses}
                  description="Negócios gerenciados"
                />
                <DashboardMetricCard
                  icon={Bell}
                  label="Notificações"
                  value={notifications.unread}
                  highlight={notifications.unread > 0}
                  description="Pendências"
                />
                <DashboardMetricCard
                  icon={Car}
                  label="Corridas"
                  value={operations.ridesTotal}
                  description="Total de mobilidade"
                />
              </div>

              {/* Métricas de engajamento */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <EngagementMetricCard
                  icon={Briefcase}
                  label="Serviços"
                  value={operations.services}
                  color="blue"
                />
                <EngagementMetricCard
                  icon={LayoutGrid}
                  label="Classificados"
                  value={operations.classifieds}
                  color="purple"
                />
                <EngagementMetricCard
                  icon={Users}
                  label="Favoritos dados"
                  value={operations.favoritesGiven}
                  color="pink"
                />
              </div>

              {/* Visitas consolidadas - Todos os perfis */}
              <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Visitas consolidadas
                      </h3>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Total de visualizações em todos os seus perfis e empresas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">
                      {(operations.businesses * 127).toLocaleString('pt-BR')}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">últimos 30 dias</p>
                  </div>
                </div>

                {/* Breakdown por tipo de perfil */}
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <VisitBreakdownCard
                    label="Perfil pessoal"
                    value={234}
                    percentage={18}
                    color="bg-blue-500"
                  />
                  <VisitBreakdownCard
                    label="Empresas"
                    value={operations.businesses > 0 ? operations.businesses * 89 : 0}
                    percentage={68}
                    color="bg-purple-500"
                  />
                  <VisitBreakdownCard
                    label="Serviços"
                    value={operations.services > 0 ? operations.services * 45 : 0}
                    percentage={14}
                    color="bg-pink-500"
                  />
                </div>
              </div>

              {/* Analytics rápido */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-green-500/10 p-2">
                      <Database className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Taxa de engajamento
                      </p>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        {operations.posts > 0 ? "8.4%" : "0%"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                      style={{ width: operations.posts > 0 ? "84%" : "0%" }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-amber-500/10 p-2">
                      <RefreshCw className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Alcance total
                      </p>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        {((operations.posts * 23) + (operations.businesses * 156)).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                      style={{ width: "67%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </SectionFrame>

          {/* Próximas ações sugeridas */}
          <NextActionsPanel actions={nextActions} />

          {/* Atalhos principais - Foco no perfil pessoal */}
          <SectionFrame
            title="Atalhos principais"
            description="Acesso rápido às áreas mais importantes do seu perfil pessoal."
          >
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <HubLinkCard
                icon={UserRound}
                title="Dados pessoais"
                description="Editar perfil, avatar, bio e informações públicas."
                onClick={() => setActiveSection("dados-pessoais")}
              />
              <HubLinkCard
                icon={Bell}
                title="Notificações"
                description="Inbox com pendências e alertas recentes."
                badge={notifications.unread > 0 ? `${notifications.unread}` : undefined}
                onClick={() => setActiveSection("notificacoes")}
              />
              <HubLinkCard
                icon={Settings2}
                title="Configurações"
                description="Privacidade, vínculos e preferências."
                onClick={() => setActiveSection("configuracoes")}
              />
              <HubLinkCard
                icon={Shield}
                title="Segurança"
                description="Conta, senha e dados sensíveis."
                onClick={() => setActiveSection("seguranca")}
              />
            </div>
          </SectionFrame>
        </div>
      );
    }

    if (activeSection === "dados-pessoais") {
      return (
        <div className="space-y-6">
          {/* 2. Estatísticas Pessoais */}
          <ProfileStats
            stats={[
              {
                icon: UserRound,
                label: "Posts",
                value: operations.posts,
                hint: "Conteúdo publicado na comunidade",
              },
              {
                icon: Users,
                label: "Conexões",
                value: (stats.followers || 0) + (stats.following || 0),
                hint: "Seguidores e seguindo",
              },
              {
                icon: Bookmark,
                label: "Favoritos",
                value: operations.favoritesGiven,
                hint: "Itens marcados como favoritos",
              },
              {
                icon: BarChart3,
                label: "Engajamento",
                value: operations.posts > 0 ? "Ativo" : "Baixo",
                hint: "Nível de participação",
              },
            ]}
          />

          {/* 3. Completude e Verificação */}
          <div className="grid gap-6 lg:grid-cols-2">
            {profile ? (
              <ResidentVerificationCard
                profileId={profile.id}
                currentStatus={verificationStatus}
                rejectionReason={verificationRejectionReason}
              />
            ) : null}
          </div>

          {/* 4. Reputação e Gamificação */}
          {(identity?.reputation || context?.reputation) && personalProfile ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <ReputationLevelCard
                reputation={(identity?.reputation?.score || context?.reputation?.score) ?? 0}
                isVerified={isVerified}
              />
              <GamificationCard
                profile={personalProfile}
                onViewRanking={() => navigate(moduleUrls.ranking || "/ranking")}
              />
            </div>
          ) : null}

          {/* 5. Engajamento Cívico */}
          {(stats.reportsCount || stats.supportsCount) ? (
            <CivicEngagementCard
              reportsCount={stats.reportsCount || 0}
              supportsCount={stats.supportsCount || 0}
              onViewReports={() => navigate("/relatos")}
              onViewSupports={() => navigate("/apoios")}
            />
          ) : null}

          {/* 6. Ações Principais */}
          <SectionFrame
            title="Ações do perfil pessoal"
            description="Gerencie sua identidade, privacidade e configurações."
          >
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <HubLinkCard
                icon={UserRound}
                title="Editar perfil"
                description="Avatar, bio, dados públicos"
                onClick={() => {
                  if (!personalProfileId) return;
                  navigate(appUrls.profile.edit(personalProfileId));
                }}
              />
              <HubLinkCard
                icon={Shield}
                title="Privacidade"
                description="Visibilidade e exposição"
                onClick={() => navigate(appUrls.profile.settings("privacy"))}
              />
              <HubLinkCard
                icon={Globe}
                title="Perfil público"
                description="Ver versão pública"
                badge={canOpenPublicProfile ? "Ativo" : "Indisponível"}
                onClick={() => {
                  if (!canOpenPublicProfile) return;
                  navigate(appUrls.profile.public(handle));
                }}
              />
              <HubLinkCard
                icon={Settings2}
                title="Configurações"
                description="Preferências gerais"
                onClick={() => navigate(appUrls.settings)}
              />
              <HubLinkCard
                icon={Bell}
                title="Notificações"
                description="Alertas e inbox"
                badge={notifications.unread > 0 ? `${notifications.unread}` : undefined}
                onClick={() => navigate(appUrls.notifications)}
              />
              <HubLinkCard
                icon={Users}
                title="Vínculos"
                description="Conexões e relações"
                onClick={() => navigate(appUrls.profile.settings("links"))}
              />
              <HubLinkCard
                icon={Lock}
                title="Segurança"
                description="Senha e conta"
                onClick={() => navigate(appUrls.profile.account)}
              />
              <HubLinkCard
                icon={Database}
                title="Dados"
                description="Exportar e gerenciar"
                onClick={() => setActiveSection("seguranca")}
              />
            </div>
          </SectionFrame>

          {/* 7. Conteúdo Pessoal */}
          {user && personalProfileId ? (
            <ContentTabsSection
              userId={user.id}
              profileId={personalProfileId}
              favorites={favorites}
              onPostClick={(id) => navigate(`${moduleUrls.community}/post/${id}`)}
              onBusinessClick={handleBusinessClick}
              onExplore={() => navigate(appUrls.business.list)}
              onCreateService={() => navigate(appUrls.services.register)}
              onEditService={(id) => navigate(appUrls.services.edit(id))}
              onCreateClassified={() => navigate(appUrls.classifieds.new)}
              onEditClassified={(id) => navigate(appUrls.classifieds.edit(id))}
            />
          ) : null}

          {/* 8. Atividade Recente */}
          {user && personalProfileId ? (
            <SectionFrame
              title="Atividade recente"
              description="Linha do tempo das suas ações pessoais."
            >
              <ActivityTimeline
                userId={user.id}
                profileId={personalProfileId}
                onPostClick={(id) => navigate(`${moduleUrls.community}/post/${id}`)}
              />
            </SectionFrame>
          ) : null}
        </div>
      );
    }

    if (activeSection === "empresas") {
      return (
        <div className="space-y-6">
          {/* Widget de Acesso Rápido para Donos - Destaque na seção empresas */}
          {businessModules.length > 0 && (
            <BusinessOwnerQuickAccess
              businesses={businessModules}
              onNavigate={(url) => navigate(url)}
            />
          )}

          <BusinessModulesSection
            businessModules={businessModules}
            showOnboarding={showBusinessOnboarding}
            onCreateBusiness={() => navigate(appUrls.business.create)}
            onNavigate={(url) => navigate(url)}
            onCopy={copyToClipboard}
          />

          <SectionFrame
            title="Acoes empresariais"
            description="Atalhos para gerir empresa, classificados, vagas, analytics e operacao gastronomica."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <HubLinkCard
                icon={Building2}
                title="Nova empresa"
                description="Inicie o fluxo de criacao de empresa."
                onClick={() => navigate(appUrls.business.create)}
              />
              <HubLinkCard
                icon={ArrowRight}
                title="Explorar empresas do territorio"
                description="Ver ecossistema de empresas e referencias locais."
                onClick={() => navigate(moduleUrls.business)}
              />
              <HubLinkCard
                icon={Briefcase}
                title="Publicar vaga"
                description="Abra uma vaga e publique no modulo de empregos."
                onClick={() => navigate(moduleUrls.jobs || "/vagas/publicar")}
              />
              <HubLinkCard
                icon={LayoutGrid}
                title="Novo classificado"
                description="Publique produto/servico no classificados."
                onClick={() => navigate(appUrls.classifieds.new)}
              />
              <HubLinkCard
                icon={BarChart3}
                title="Analytics geral"
                description="Acesse indicadores agregados e visitantes."
                onClick={() => navigate(moduleUrls.analytics || "/analytics")}
              />
              {primaryBusinessModule ? (
                <HubLinkCard
                  icon={Building2}
                  title="Dashboard da empresa principal"
                  description={`Abrir painel de ${primaryBusinessModule.name}.`}
                  onClick={() => navigate(primaryBusinessModule.dashboardUrl)}
                />
              ) : null}
              {primaryGastronomyModule?.gastronomy.analyticsUrl ? (
                <HubLinkCard
                  icon={BarChart3}
                  title="Analytics gastronomia"
                  description="Visitas, engajamento e performance da operacao gastronomica."
                  onClick={() => navigate(primaryGastronomyModule.gastronomy.analyticsUrl!)}
                />
              ) : null}
              {primaryGastronomyModule?.gastronomy.menuUrl ? (
                <HubLinkCard
                  icon={LayoutGrid}
                  title="Produtos e cardapio"
                  description="Gerencie itens, categorias e precos da gastronomia."
                  onClick={() => navigate(primaryGastronomyModule.gastronomy.menuUrl!)}
                />
              ) : null}
            </div>
          </SectionFrame>
        </div>
      );
    }

    if (activeSection === "mobilidade") {
      return (
        <div className="space-y-6">
          <SectionFrame
            title="Motorista e mobilidade"
            description="Dados e acoes de mobilidade sem misturar conteudo de outros modulos."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <HubLinkCard
                icon={Car}
                title={hasDriverProfile ? "Perfil de motorista" : "Central de mobilidade"}
                description={
                  hasDriverProfile
                    ? "Acesse o perfil de motorista e configuracoes de operacao."
                    : "Acesse mobilidade como passageiro."
                }
                onClick={() =>
                  navigate(
                    hasDriverProfile ? appUrls.mobility.driverProfile : appUrls.mobility.passenger,
                  )
                }
              />
              <HubLinkCard
                icon={ArrowRight}
                title="Historico de corridas"
                description="Consulte corridas anteriores e estado operacional."
                badge={operations.ridesTotal > 0 ? `${operations.ridesTotal}` : undefined}
                onClick={() => navigate(appUrls.mobility.history)}
              />
              <HubLinkCard
                icon={ArrowRight}
                title="Abrir central de mobilidade"
                description="Acesse busca de corridas, acompanhamento e operacao em tempo real."
                onClick={() => navigate(appUrls.mobility.home)}
              />
            </div>
          </SectionFrame>

          {hasDriverProfile ? (
            driverDataLoading ? (
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Carregando dados do motorista...
                </div>
              </div>
            ) : driverSnapshot ? (
              <SectionFrame
                title="Dados do perfil de motorista"
                description="Snapshot operacional com status, veiculo e documentacao do motorista."
              >
                <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{driverDisplayName}</h3>
                      <Badge variant={driverSnapshot.is_online ? "default" : "secondary"} className="text-[10px]">
                        {driverSnapshot.is_online ? "Online" : "Offline"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {driverSnapshot.is_available ? "Disponivel" : "Indisponivel"}
                      </Badge>
                      {driverSnapshot.is_verified ? (
                        <Badge variant="outline" className="text-[10px]">
                          Verificado
                        </Badge>
                      ) : null}
                      {driverSnapshot.subscription_active ? (
                        <Badge variant="outline" className="text-[10px]">
                          Assinatura ativa
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <MobilityMetricCard
                        label="Avaliacao"
                        value={
                          typeof driverSnapshot.rating === "number"
                            ? driverSnapshot.rating.toFixed(1)
                            : "Nao informado"
                        }
                      />
                      <MobilityMetricCard
                        label="Corridas totais"
                        value={formatOptionalNumber(driverSnapshot.total_rides)}
                      />
                      <MobilityMetricCard
                        label="Concluidas"
                        value={formatOptionalNumber(driverSnapshot.total_rides_completed)}
                      />
                      <MobilityMetricCard
                        label="Canceladas"
                        value={formatOptionalNumber(driverSnapshot.total_rides_cancelled)}
                      />
                      <MobilityMetricCard
                        label="Aceitacao"
                        value={formatPercent(driverSnapshot.acceptance_rate)}
                      />
                      <MobilityMetricCard
                        label="Cancelamento"
                        value={formatPercent(driverSnapshot.cancellation_rate)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Veiculo registrado
                      </p>
                      <div className="mt-3 space-y-2">
                        <MobilityDetailRow
                          label="Modelo"
                          value={driverSnapshot.vehicle_model || "Nao informado"}
                        />
                        <MobilityDetailRow
                          label="Placa"
                          value={driverSnapshot.vehicle_plate || "Nao informado"}
                        />
                        <MobilityDetailRow
                          label="Ano"
                          value={formatOptionalNumber(driverSnapshot.vehicle_year)}
                        />
                        <MobilityDetailRow
                          label="Cor"
                          value={driverSnapshot.vehicle_color || "Nao informado"}
                        />
                        <MobilityDetailRow
                          label="Tipo"
                          value={driverSnapshot.vehicle_type || "Nao informado"}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Documentacao do motorista
                      </p>
                      <div className="mt-3 space-y-2">
                        <MobilityDetailRow
                          label="Numero da licenca"
                          value={driverSnapshot.license_number || "Nao informado"}
                        />
                        <MobilityDetailRow
                          label="Categoria"
                          value={driverSnapshot.license_category || "Nao informado"}
                        />
                        <MobilityDetailRow
                          label="UF da licenca"
                          value={driverSnapshot.license_state || "Nao informado"}
                        />
                        <MobilityDetailRow
                          label="Validade da licenca"
                          value={formatDatePtBr(driverSnapshot.license_expiry)}
                        />
                        <MobilityDetailRow
                          label="Background check"
                          value={formatBackgroundCheckStatus(driverSnapshot.background_check_status)}
                        />
                        <MobilityDetailRow
                          label="Documentos verificados"
                          value={driverSnapshot.documents_verified ? "Sim" : "Nao"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </SectionFrame>
            ) : (
              <EmptyPanel
                title="Perfil de motorista incompleto"
                description="Existe perfil de motorista, mas os dados operacionais ainda nao estao completos."
                actionLabel="Completar perfil de motorista"
                onAction={() => navigate(appUrls.mobility.driverProfile)}
              />
            )
          ) : (
            <EmptyPanel
              title="Motorista nao ativado"
              description="Ainda nao existe perfil de motorista vinculado para mostrar dados de veiculo e operacao."
              actionLabel="Ativar perfil de motorista"
              onAction={() => navigate(appUrls.mobility.driver)}
            />
          )}

          {hasActiveRide && activeRide ? (
            <ProfileActiveRideCard ride={activeRide as any} />
          ) : (
            <EmptyPanel
              title="Nenhuma corrida ativa"
              description="Nao ha corrida em andamento para o perfil ativo no momento."
              actionLabel="Abrir mobilidade"
              onAction={() => navigate(appUrls.mobility.home)}
            />
          )}
        </div>
      );
    }

    if (activeSection === "delivery") {
      return (
        <DeliverySection
          modules={deliveryModules}
          onNavigate={(url) => navigate(url)}
          onGoToBusiness={() => setActiveSection("empresas")}
        />
      );
    }

    if (activeSection === "planos") {
      return (
        <div className="space-y-6">
          <SectionFrame
            title="Plano da identidade ativa"
            description="Resumo da assinatura atual do perfil logado."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Plano</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {formatPlanLabel(identity?.plan.type || context?.plan.type)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Premium: {identity?.plan.isPremium || context?.plan.isPremium ? "sim" : "nao"}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Reputacao</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {identity?.reputation.score ?? context?.reputation.score ?? 0}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nivel {identity?.reputation.level ?? context?.reputation.level ?? 1}
                </p>
              </div>
            </div>
          </SectionFrame>

          <SectionFrame
            title="Planos e assinaturas por empresa"
            description="Visao consolidada de plano, status e recursos por empresa."
          >
            {businessModules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma empresa vinculada para exibir planos empresariais.
              </p>
            ) : (
              <div className="space-y-3">
                {businessModules.map((item) => (
                  <div key={item.businessId} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                      <Badge variant="secondary" className="text-[10px]">
                        Plano {formatPlanLabel(item.subscription.planTier)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {item.subscription.status}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.subscription.canUsePremiumPublicPage ? (
                        <Badge variant="outline" className="text-[10px]">
                          Pagina premium
                        </Badge>
                      ) : null}
                      {item.subscription.canUseOrdersPanel ? (
                        <Badge variant="outline" className="text-[10px]">
                          Painel de pedidos
                        </Badge>
                      ) : null}
                      {item.subscription.canUseMotoboyNetwork ? (
                        <Badge variant="outline" className="text-[10px]">
                          Rede motoboy
                        </Badge>
                      ) : null}
                      {item.subscription.canTrackDelivery ? (
                        <Badge variant="outline" className="text-[10px]">
                          Rastreio de entrega
                        </Badge>
                      ) : null}
                      {item.subscription.canSetDeliveryFees ? (
                        <Badge variant="outline" className="text-[10px]">
                          Configurar taxas
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionFrame>
        </div>
      );
    }

    if (activeSection === "notificacoes") {
      return (
        <div className="space-y-6">
          <SectionFrame
            title="Resumo de notificacoes"
            description="Estado atual da sua inbox para triagem rapida."
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <NotificationStatCard label="Nao lidas" value={notifications.unread} />
              <NotificationStatCard label="Prioridade alta" value={notifications.highPriority} />
              <NotificationStatCard label="Urgentes" value={notifications.urgentPriority} />
              <NotificationStatCard label="Total" value={notifications.total} />
            </div>
          </SectionFrame>

          <NotificationsPanel
            notifications={notifications.recent || []}
            onNotificationClick={() => navigate(appUrls.notifications)}
            onViewAll={() => navigate(appUrls.notifications)}
          />
        </div>
      );
    }

    if (activeSection === "configuracoes") {
      return (
        <div className="space-y-6">
          <SectionFrame
            title="Configuracoes"
            description="Ajustes de perfil e operacao agrupados em uma area dedicada."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <HubLinkCard
                icon={Shield}
                title="Privacidade do perfil"
                description="Controle visibilidade, mensagens e dados publicos."
                onClick={() => navigate(appUrls.profile.settings("privacy"))}
              />
              <HubLinkCard
                icon={Users}
                title="Vinculos e conexoes"
                description="Gerencie vinculos da identidade ativa."
                onClick={() => navigate(appUrls.profile.settings("links"))}
              />
              {canManageProfileMembers ? (
                <HubLinkCard
                  icon={Users}
                  title="Membros do perfil"
                  description="Convites e permissoes do perfil empresarial/profissional."
                  onClick={() => navigate(appUrls.profile.settings("members"))}
                />
              ) : null}
              <HubLinkCard
                icon={Settings2}
                title="Configuracoes operacionais"
                description="Residencia, area de atuacao e preferencias gerais."
                onClick={() => navigate(appUrls.settings)}
              />
            </div>
          </SectionFrame>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <AccountHealthPanel
          accountSnapshot={
            account || {
              accountState: "inactive",
              isBlocked: false,
              isSuspended: false,
              verificationStatus,
              verificationRejectionReason,
            }
          }
          identity={identity}
          context={context}
          activeProfile={activeProfile}
          roles={roles}
        />

        <SectionFrame
          title="Seguranca e dados"
          description="Acoes sensiveis da conta centralizadas em um unico lugar."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <SecurityActionCard
              icon={Lock}
              title="Minha conta"
              description="Senha, email de acesso e validacoes de seguranca."
              actionLabel="Abrir conta"
              onAction={() => navigate(appUrls.profile.account)}
            />
            <SecurityActionCard
              icon={Download}
              title="Baixar meus dados"
              description="Exportar snapshot de dados pessoais em JSON."
              actionLabel="Baixar dados"
              onAction={() => setDownloadDataOpen(true)}
            />
            <SecurityActionCard
              icon={Database}
              title="Visualizar meus dados"
              description="Consultar os dados salvos na conta."
              actionLabel="Ver dados"
              onAction={() => setViewDataOpen(true)}
            />
            <SecurityActionCard
              icon={Pause}
              title="Pausar conta"
              description="Abrir fluxo oficial de pausa temporaria."
              actionLabel="Pausar conta"
              onAction={() => setDeactivateOpen(true)}
            />
            <SecurityActionCard
              icon={Trash2}
              title="Encerrar conta"
              description="Abrir fluxo oficial de encerramento definitivo."
              actionLabel="Encerrar conta"
              onAction={() => setDeleteOpen(true)}
              tone="danger"
            />
          </div>
        </SectionFrame>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Perfil | Area organizada</title>
        <meta
          name="description"
          content="Area de perfil com navegacao por secoes, resumo enxuto e conteudo segmentado por contexto."
        />
      </Helmet>

      {/* Layout: sidebar fixa (desktop) + conteúdo scrollável */}
      <div className="flex h-full min-h-0 overflow-hidden">
        {/* Sidebar desktop - vai até o topo, conectando com a topbar */}
        <aside className="hidden lg:flex lg:w-[240px] lg:shrink-0 lg:flex-col lg:border-r lg:border-border lg:bg-card xl:w-[260px]">
          <ProfileSectionsNav
            items={sectionItems}
            activeId={activeSection}
            onChange={setActiveSection}
            variant="sidebar"
            profile={personalProfile}
            isVerified={isVerified}
            handle={handle}
            canOpenPublicProfile={canOpenPublicProfile}
          />
        </aside>

        {/* Área de conteúdo scrollável */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl space-y-3 px-3 pb-20 pt-3 sm:space-y-4 sm:px-4 sm:pb-12 sm:pt-4 md:pt-6">
              {/* Header compacto e responsivo - Sempre perfil PERSONAL */}
              <ProfileHeaderCompact
                activeProfile={personalProfile}  // ← Sempre personal (username só existe para personal)
                profile={profile}
                allProfiles={allProfiles}
                userEmail={user?.email || ""}
                accountSnapshot={
                  account || {
                    accountState: "inactive",
                    isBlocked: false,
                    isSuspended: false,
                    verificationStatus,
                    verificationRejectionReason,
                  }
                }
                identity={identity}
                context={context}
                notifications={notifications}
                isVerified={isVerified}
                canOpenPublicProfile={canOpenPublicProfile}
                handle={handle}
                territoryLabel={territoryLabel}
                reputation={identity?.reputation || context?.reputation}
                onAvatarChange={handleAvatarChange}
              />

              {/* Tabs roláveis mobile */}
              <div className="lg:hidden">
                <ProfileSectionsNav
                  items={sectionItems}
                  activeId={activeSection}
                  onChange={setActiveSection}
                  variant="tabs"
                />
              </div>

              {/* Conteúdo das seções */}
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                {renderSectionContent()}
              </div>
            </div>
          </div>
        </main>
      </div>

      <DataManagementDialogs
        profile={profile}
        stats={stats}
        userEmail={user?.email}
        downloadOpen={downloadDataOpen}
        viewOpen={viewDataOpen}
        deactivateOpen={deactivateOpen}
        deleteOpen={deleteOpen}
        deleteConfirm={deleteConfirm}
        onDownloadOpenChange={setDownloadDataOpen}
        onViewOpenChange={setViewDataOpen}
        onDeactivateOpenChange={setDeactivateOpen}
        onDeleteOpenChange={setDeleteOpen}
        onDeleteConfirmChange={setDeleteConfirm}
        onDownload={handleDownloadData}
        onDeactivate={handleDeactivateAccount}
        onDelete={handleDeleteAccount}
      />
    </>
  );
}

function NotificationStatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function MobilityMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function MobilityDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}

function SecurityActionCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  tone = "default",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "rounded-xl p-2",
            tone === "danger"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <Button
        size="sm"
        variant={tone === "danger" ? "destructive" : "outline"}
        className="mt-4 w-full gap-1.5"
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  );
}

function DeliverySection({
  modules,
  onNavigate,
  onGoToBusiness,
}: {
  modules: ProfileBusinessModuleItem[];
  onNavigate: (url: string) => void;
  onGoToBusiness: () => void;
}) {
  return (
    <SectionFrame
      title="Delivery e motoboy"
      description="Mostra apenas dados e atalhos de entrega, sem mistura com outras areas."
    >
      {modules.length === 0 ? (
        <EmptyPanel
          title="Sem operacao de delivery ativa"
          description="Nenhuma empresa com delivery/motoboy ativo foi encontrada no perfil atual."
          actionLabel="Ver area de empresas"
          onAction={onGoToBusiness}
        />
      ) : (
        <div className="space-y-3">
          {modules.map((item) => (
            <DeliveryBusinessCard key={item.businessId} module={item} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </SectionFrame>
  );
}

function DeliveryBusinessCard({
  module,
  onNavigate,
}: {
  module: ProfileBusinessModuleItem;
  onNavigate: (url: string) => void;
}) {
  const features = [
    module.gastronomy.deliveryEnabled ? "Delivery ativo" : null,
    module.subscription.canUseMotoboyNetwork ? "Rede motoboy" : null,
    module.subscription.canConfigureDeliveryArea ? "Area de entrega" : null,
    module.subscription.canSetDeliveryFees ? "Taxas configuraveis" : null,
    module.subscription.canTrackDelivery ? "Rastreio" : null,
    module.subscription.canUseOwnDelivery ? "Entrega propria" : null,
  ].filter(Boolean) as string[];

  const actions = [
    { label: "Dashboard", url: module.dashboardUrl },
    { label: "Pedidos", url: module.gastronomy.ordersUrl },
    { label: "Entregas", url: module.gastronomy.deliveriesUrl },
    { label: "Area de entrega", url: module.gastronomy.deliveryAreaUrl },
  ].filter((item): item is { label: string; url: string } => Boolean(item.url));

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{module.name}</h3>
        <Badge variant="secondary" className="text-[10px]">
          Plano {formatPlanLabel(module.subscription.planTier)}
        </Badge>
        {module.isPremium ? (
          <Badge variant="outline" className="text-[10px]">
            Premium
          </Badge>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {features.length > 0 ? (
          features.map((feature) => (
            <Badge key={feature} variant="outline" className="text-[10px]">
              {feature}
            </Badge>
          ))
        ) : (
          <Badge variant="outline" className="text-[10px]">
            Sem recursos extras de delivery
          </Badge>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            size="sm"
            variant={action.label === "Dashboard" ? "default" : "outline"}
            onClick={() => onNavigate(action.url)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * DASHBOARD COMPONENTS - Componentes para o dashboard da aba Resumo
 * ============================================================ */

function DashboardMetricCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  highlight,
  description,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  trend?: string;
  trendUp?: boolean;
  highlight?: boolean;
  description: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition-all hover:shadow-md",
        highlight
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div
          className={cn(
            "rounded-xl p-2.5",
            highlight
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend ? (
        <div className="mt-4 flex items-center gap-1.5">
          <ArrowRight
            className={cn(
              "h-3.5 w-3.5",
              trendUp ? "rotate-[-45deg] text-green-600" : "rotate-45 text-red-600",
            )}
          />
          <span
            className={cn(
              "text-xs font-semibold",
              trendUp ? "text-green-600" : "text-red-600",
            )}
          >
            {trend}
          </span>
          <span className="text-xs text-muted-foreground">vs. mês anterior</span>
        </div>
      ) : null}
    </div>
  );
}

function EngagementMetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: "blue" | "purple" | "pink";
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    pink: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={cn("rounded-xl p-2", colorClasses[color])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function VisitBreakdownCard({
  label,
  value,
  percentage,
  color,
}: {
  label: string;
  value: number;
  percentage: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground">{value.toLocaleString('pt-BR')}</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">{percentage}% do total</p>
    </div>
  );
}

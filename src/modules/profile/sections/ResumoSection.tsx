/**
 * ResumoSection - Seção de resumo do perfil
 * 
 * SSOT: Componente isolado com props tipadas
 * Sem gambiarras: Lógica clara e organizada
 */

import {
  BarChart3,
  Bike,
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  Car,
  Database,
  LayoutGrid,
  RefreshCw,
  Settings2,
  Shield,
  UserRound,
  Users,
  LayoutDashboard,
} from "lucide-react";

import {
  SectionFrame,
  HubLinkCard,
  NextActionsPanel,
} from "@/modules/profile/components/hub";
import { ProfileActiveRideCard } from "@/modules/profile/components/ProfileActiveRideCard";
import {
  DashboardMetricCard,
  EngagementMetricCard,
  VisitBreakdownCard,
} from "@/modules/profile/components/cards";

import type { ResumoSectionProps } from "./types";
import { getMobilityServiceStatus } from "@/modules/profile/utils/mobilityServiceStatus";
import type { MobilityRide } from "@/modules/mobility/components/driver/DriverRidesTab";

export function ResumoSection({
  operations,
  notifications,
  nextActions,
  hasActiveRide,
  activeRide,
  driverProfileId,
  driverData,
  setActiveSection,
  navigate,
  appUrls,
}: ResumoSectionProps) {
  const motoristaStatus = getMobilityServiceStatus({
    driverProfileId,
    driverData: driverData ?? null,
    service: "motorista",
  });
  const motoboyStatus = getMobilityServiceStatus({
    driverProfileId,
    driverData: driverData ?? null,
    service: "motoboy",
  });

  return (
    <div className="space-y-6">
      {/* Corrida ativa (se houver) - Destaque no topo */}
      {hasActiveRide && activeRide ? (
        <ProfileActiveRideCard ride={activeRide as MobilityRide} />
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

      {/* Bloco discreto - Acessar Central */}
      <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Áreas de Gestão
              </h3>
              <p className="text-xs text-muted-foreground">
                Empresas, profissional, mobilidade e administração
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/central")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Acessar Central
          </button>
        </div>
      </div>

      {/* Atalhos principais - Foco no perfil pessoal */}
      <SectionFrame
        title="Atalhos principais"
        description="Acesso rápido às áreas mais importantes do seu perfil pessoal."
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <HubLinkCard
            icon={Building2}
            title="Minhas empresas"
            description="Lista de empresas e acesso ao painel de gestão."
            onClick={() => navigate(appUrls.profile.businesses)}
          />
          <HubLinkCard
            icon={Car}
            title="Mobilidade"
            description={`Motorista: ${motoristaStatus}. Motoboy: ${motoboyStatus}.`}
            onClick={() => navigate(appUrls.profile.mobilidade.motorista.home)}
          />
          <HubLinkCard
            icon={Bike}
            title="Motoboy"
            description="Area separada para entregas dentro de Mobilidade."
            onClick={() => navigate(appUrls.profile.mobilidade.motoboy.home)}
          />
          <HubLinkCard
            icon={Briefcase}
            title="Planos e cobranças"
            description="Assinaturas por empresa, mobilidade e classificados."
            onClick={() => navigate("/perfil/planos")}
          />
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

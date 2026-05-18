/**
 * ResumoSection - visao pessoal do usuario.
 *
 * Mantem a conta como area pessoal e envia operacoes para a Central.
 */

import {
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  Car,
  CreditCard,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Settings2,
  Shield,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

import {
  SectionFrame,
  HubLinkCard,
  NextActionsPanel,
} from "@/modules/profile/components/hub";
import { ProfileActiveRideCard } from "@/modules/profile/components/ProfileActiveRideCard";
import { DashboardMetricCard } from "@/core/profile/components/cards";

import type { ResumoSectionProps } from "./types";
import { getMobilityServiceStatus } from "@/core/profile/utils/mobilityServiceStatus";
import type { MobilityRide } from "@/core/mobility/types/ride";

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

  const totalPersonalActivity = operations.posts + operations.favoritesGiven;
  const totalOperationalAssets = operations.businesses + operations.services + operations.classifieds;

  return (
    <div className="space-y-6">
      {hasActiveRide && activeRide ? (
        <ProfileActiveRideCard ride={activeRide as MobilityRide} />
      ) : null}

      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_15%_0%,hsl(var(--primary)/0.18),transparent_32%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--muted)/0.46))] p-5 shadow-sm sm:p-7">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Minha conta
            </div>
            <div>
              <h2 className="max-w-3xl text-2xl font-black tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                Sua identidade, dados pessoais e atalhos seguros em um unico lugar.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                A conta mostra sua area pessoal. Empresas, motorista, motoboy e rotinas administrativas ficam na Central para manter a separacao de responsabilidades.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <button
              type="button"
              onClick={() => setActiveSection("dados-pessoais")}
              className="rounded-2xl border border-border/70 bg-background/75 p-4 text-left transition hover:border-primary/40 hover:bg-background"
            >
              <UserRound className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-semibold text-foreground">Dados pessoais</p>
              <p className="mt-1 text-xs text-muted-foreground">Nome, foto, bio e perfil publico.</p>
            </button>
            <button
              type="button"
              onClick={() => navigate("/conta/enderecos")}
              className="rounded-2xl border border-border/70 bg-background/75 p-4 text-left transition hover:border-primary/40 hover:bg-background"
            >
              <MapPin className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-semibold text-foreground">Endereco pessoal</p>
              <p className="mt-1 text-xs text-muted-foreground">Residencia e verificacao territorial.</p>
            </button>
            <button
              type="button"
              onClick={() => navigate("/central")}
              className="rounded-2xl border border-primary/25 bg-primary px-4 py-4 text-left text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <LayoutDashboard className="h-5 w-5" />
              <p className="mt-3 text-sm font-semibold">Abrir Central</p>
              <p className="mt-1 text-xs text-primary-foreground/80">Operacao, empresas e dashboards.</p>
            </button>
          </div>
        </div>
      </section>

      <SectionFrame
        title="Resumo pessoal"
        description="Indicadores reais da sua conta e das areas vinculadas, sem misturar gestao operacional na area pessoal."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            icon={UserRound}
            label="Atividade pessoal"
            value={totalPersonalActivity}
            description="Posts e favoritos"
          />
          <DashboardMetricCard
            icon={Building2}
            label="Areas vinculadas"
            value={totalOperationalAssets}
            description="Empresas, servicos e classificados"
          />
          <DashboardMetricCard
            icon={Bell}
            label="Notificacoes"
            value={notifications.unread}
            highlight={notifications.unread > 0}
            description="Nao lidas"
          />
          <DashboardMetricCard
            icon={Car}
            label="Mobilidade"
            value={operations.ridesTotal}
            description="Corridas e entregas"
          />
        </div>
      </SectionFrame>

      <NextActionsPanel actions={nextActions as any} />

      <SectionFrame
        title="Acoes pessoais"
        description="Tudo que pertence ao usuario: identidade, privacidade, notificacoes, favoritos e endereco residencial."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <HubLinkCard
            icon={UserRound}
            title="Dados pessoais"
            description="Editar nome, foto, bio e apresentacao publica."
            onClick={() => setActiveSection("dados-pessoais")}
          />
          <HubLinkCard
            icon={MapPin}
            title="Endereco e residencia"
            description="Atualizar residencia, territorio e verificacao."
            onClick={() => navigate("/conta/enderecos")}
          />
          <HubLinkCard
            icon={Bell}
            title="Notificacoes"
            description="Inbox com pendencias e alertas recentes."
            badge={notifications.unread > 0 ? `${notifications.unread}` : undefined}
            onClick={() => setActiveSection("notificacoes")}
          />
          <HubLinkCard
            icon={Bookmark}
            title="Favoritos"
            description="Itens salvos e referencias pessoais."
            onClick={() => setActiveSection("dados-pessoais")}
          />
          <HubLinkCard
            icon={CreditCard}
            title="Planos pessoais"
            description="Resumo de cobrancas e assinaturas vinculadas."
            onClick={() => navigate(appUrls.profile.billing)}
          />
          <HubLinkCard
            icon={Settings2}
            title="Preferencias"
            description="Privacidade, vinculos e ajustes gerais."
            onClick={() => setActiveSection("preferencias")}
          />
          <HubLinkCard
            icon={Shield}
            title="Seguranca"
            description="Conta, dados sensiveis e protecao."
            onClick={() => setActiveSection("seguranca")}
          />
          <HubLinkCard
            icon={Users}
            title="Familia"
            description="Vinculos familiares e zonas seguras."
            onClick={() => navigate(appUrls.family.home)}
          />
        </div>
      </SectionFrame>

      <SectionFrame
        title="Atalhos para areas que voce possui"
        description="Acesso rapido para modulos operacionais sem colocar administracao dentro da conta."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <HubLinkCard
            icon={LayoutDashboard}
            title="Central operacional"
            description="Hub profissional com empresas, mobilidade e dashboards."
            onClick={() => navigate("/central")}
          />
          <HubLinkCard
            icon={Building2}
            title="Empresas"
            description="Gestao das empresas vinculadas ao usuario."
            badge={operations.businesses > 0 ? `${operations.businesses}` : undefined}
            onClick={() => navigate(appUrls.profile.businesses)}
          />
          <HubLinkCard
            icon={Car}
            title="Motorista"
            description={`Status do cadastro: ${motoristaStatus}.`}
            onClick={() => navigate(appUrls.profile.mobilidade.motorista.home)}
          />
          <HubLinkCard
            icon={Briefcase}
            title="Motoboy"
            description={`Status do cadastro: ${motoboyStatus}.`}
            onClick={() => navigate(appUrls.profile.mobilidade.motoboy.home)}
          />
        </div>
      </SectionFrame>

      <SectionFrame
        title="Descoberta publica"
        description="Modulos publicos ficam separados da administracao. Use estes atalhos para navegar como usuario."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <HubLinkCard
            icon={Building2}
            title="Empresas publicas"
            description="Descobrir empresas e catalogos publicados."
            onClick={() => navigate(appUrls.business.list)}
          />
          <HubLinkCard
            icon={Briefcase}
            title="Servicos"
            description="Encontrar profissionais e prestadores."
            onClick={() => navigate(appUrls.services.list)}
          />
          <HubLinkCard
            icon={MessageSquare}
            title="Comunidade"
            description="Posts, recomendacoes e alertas locais."
            onClick={() => navigate(appUrls.community.feed)}
          />
          <HubLinkCard
            icon={MapPin}
            title="Mapa"
            description="Explorar territorio e pontos proximos."
            onClick={() => navigate(appUrls.map)}
          />
        </div>
      </SectionFrame>
    </div>
  );
}


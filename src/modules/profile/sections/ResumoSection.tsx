/**
 * ResumoSection - visão pessoal do usuário.
 *
 * Mantém a conta como área pessoal e envia operações para a Central.
 */

import {
  Bell,
  Bookmark,
  Briefcase,
  Building2,
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
import { DashboardMetricCard } from "@/modules/profile/components/cards";

import type { ResumoSectionProps } from "./types";
import { isLaunchSurfaceEnabled } from "@/config/launchScope";

export function ResumoSection({
  operations,
  notifications,
  nextActions,
  setActiveSection,
  navigate,
  appUrls,
}: ResumoSectionProps) {
  const totalPersonalActivity = operations.posts + operations.favoritesGiven;
  const totalOperationalAssets = operations.businesses + operations.services + operations.classifieds;
  const showFamilySafetyLinks = isLaunchSurfaceEnabled("familySafety");

  return (
    <div className="space-y-6">
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
                Sua identidade, dados pessoais e atalhos seguros em um único lugar.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                A conta mostra sua área pessoal. Empresas e rotinas administrativas ficam na
                Central para manter a separação de responsabilidades.
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
              <p className="mt-1 text-xs text-muted-foreground">Nome, foto, bio e perfil público.</p>
            </button>
            <button
              type="button"
              onClick={() => navigate(appUrls.profile.addresses)}
              className="rounded-2xl border border-border/70 bg-background/75 p-4 text-left transition hover:border-primary/40 hover:bg-background"
            >
              <MapPin className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-semibold text-foreground">Endereço pessoal</p>
              <p className="mt-1 text-xs text-muted-foreground">Residência e verificação territorial.</p>
            </button>
            <button
              type="button"
              onClick={() => navigate("/central")}
              className="rounded-2xl border border-primary/25 bg-primary px-4 py-4 text-left text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <LayoutDashboard className="h-5 w-5" />
              <p className="mt-3 text-sm font-semibold">Abrir Central</p>
              <p className="mt-1 text-xs text-primary-foreground/80">Operação, empresas e dashboards.</p>
            </button>
          </div>
        </div>
      </section>

      <SectionFrame
        title="Resumo pessoal"
        description="Indicadores reais da sua conta e das áreas vinculadas, sem misturar gestão operacional na área pessoal."
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
            label="Áreas vinculadas"
            value={totalOperationalAssets}
            description="Empresas, serviços e classificados"
          />
          <DashboardMetricCard
            icon={Bell}
            label="Notificações"
            value={notifications.unread}
            highlight={notifications.unread > 0}
            description="Não lidas"
          />
        </div>
      </SectionFrame>

      <NextActionsPanel actions={nextActions} />

      <SectionFrame
        title="Ações pessoais"
        description="Tudo que pertence ao usuário: identidade, privacidade, notificações, favoritos e endereço residencial."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <HubLinkCard
            icon={UserRound}
            title="Dados pessoais"
            description="Editar nome, foto, bio e apresentação pública."
            onClick={() => setActiveSection("dados-pessoais")}
          />
          <HubLinkCard
            icon={MapPin}
            title="Endereço e residência"
            description="Atualizar residência, território e verificação."
            onClick={() => navigate(appUrls.profile.addresses)}
          />
          <HubLinkCard
            icon={Bell}
            title="Notificações"
            description="Avisos e pendências recentes."
            badge={notifications.unread > 0 ? `${notifications.unread}` : undefined}
            onClick={() => setActiveSection("notificacoes")}
          />
          <HubLinkCard
            icon={Bookmark}
            title="Favoritos"
            description="Itens salvos e referências pessoais."
            onClick={() => setActiveSection("dados-pessoais")}
          />
          <HubLinkCard
            icon={CreditCard}
            title="Planos pessoais"
            description="Resumo de cobranças e assinaturas vinculadas."
            onClick={() => navigate(appUrls.profile.billing)}
          />
          <HubLinkCard
            icon={Settings2}
            title="Preferências"
            description="Privacidade, vínculos e ajustes gerais."
            onClick={() => setActiveSection("preferencias")}
          />
          <HubLinkCard
            icon={Shield}
            title="Segurança"
            description="Conta, dados sensíveis e proteção."
            onClick={() => setActiveSection("seguranca")}
          />
          {showFamilySafetyLinks ? (
            <HubLinkCard
              icon={Users}
              title="Família"
              description="Vínculos familiares e zonas seguras."
              onClick={() => navigate(appUrls.family.home)}
            />
          ) : null}
        </div>
      </SectionFrame>

      <SectionFrame
        title="Atalhos para áreas que você possui"
        description="Acesso rápido para módulos operacionais sem colocar administração dentro da conta."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <HubLinkCard
            icon={LayoutDashboard}
            title="Central operacional"
            description="Hub profissional com empresas e dashboards."
            onClick={() => navigate("/central")}
          />
          <HubLinkCard
            icon={Building2}
            title="Empresas"
            description="Gestão das empresas vinculadas ao usuário."
            badge={operations.businesses > 0 ? `${operations.businesses}` : undefined}
            onClick={() => navigate(appUrls.profile.businesses)}
          />
        </div>
      </SectionFrame>

      <SectionFrame
        title="Descoberta pública"
        description="Módulos públicos ficam separados da administração. Use estes atalhos para navegar como usuário."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <HubLinkCard
            icon={Building2}
            title="Empresas públicas"
            description="Descobrir empresas e catálogos publicados."
            onClick={() => navigate(appUrls.business.list)}
          />
          <HubLinkCard
            icon={Briefcase}
            title="Serviços"
            description="Encontrar profissionais e prestadores."
            onClick={() => navigate(appUrls.services.list)}
          />
          <HubLinkCard
            icon={MessageSquare}
            title="Comunidade"
            description="Posts, recomendações e alertas locais."
            onClick={() => navigate(appUrls.community.feed)}
          />
          <HubLinkCard
            icon={MapPin}
            title="Mapa"
            description="Explorar território e pontos próximos."
            onClick={() => navigate(appUrls.map)}
          />
        </div>
      </SectionFrame>
    </div>
  );
}

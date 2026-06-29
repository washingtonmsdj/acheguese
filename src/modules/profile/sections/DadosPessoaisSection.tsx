/**
 * DadosPessoaisSection - Secao de dados pessoais do perfil
 *
 * SSOT: Componente isolado com props tipadas
 * Sem gambiarras: Logica clara e organizada
 */

import {
  BarChart3,
  Bell,
  Bookmark,
  Database,
  Globe,
  Lock,
  MapPin,
  Settings2,
  Shield,
  UserRound,
  Users,
} from "lucide-react";

import {
  ContentTabsSection,
  HubLinkCard,
  ProfileStats,
  SectionFrame,
} from "@/modules/profile/components/hub";
import { ResidentVerificationCard } from "@/modules/profile/components/ResidentVerificationCard";
import { CivicEngagementCard } from "@/modules/profile/components/CivicEngagementCard";
import { ActivityTimeline } from "@/modules/profile/components/ActivityTimeline";

import type { DadosPessoaisSectionProps } from "./types";

export function DadosPessoaisSection({
  user,
  personalProfileId,
  profile,
  stats,
  operations,
  verificationStatus,
  verificationRejectionReason,
  favorites,
  setActiveSection,
  navigate,
  appUrls,
  handleBusinessClick,
}: DadosPessoaisSectionProps) {
  const fallbackHandle =
    profile && "handle" in profile && typeof profile.handle === "string" ? profile.handle : "";
  const publicHandle = profile?.username || fallbackHandle || "";

  return (
    <div className="space-y-6">
      <ProfileStats
        stats={[
          {
            icon: UserRound,
            label: "Posts",
            value: operations.posts,
            hint: "Conteudo publicado na comunidade",
          },
          {
            icon: Users,
            label: "Conexoes",
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
            hint: "Nivel de participacao",
          },
        ]}
      />

      {(stats.reportsCount || stats.supportsCount) ? (
        <CivicEngagementCard
          reportsCount={stats.reportsCount || 0}
          supportsCount={stats.supportsCount || 0}
          engagementScore={(stats.reportsCount || 0) + (stats.supportsCount || 0)}
        />
      ) : null}

      <SectionFrame
        title="Acoes da conta"
        description="Gerencie identidade, endereco pessoal, privacidade e preferencias sem misturar operacao da Central."
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <HubLinkCard
            icon={UserRound}
            title="Editar perfil"
            description="Avatar, bio, dados publicos"
            onClick={() => {
              if (!personalProfileId) return;
              navigate(appUrls.profile.edit(personalProfileId));
            }}
          />
          <HubLinkCard
            icon={MapPin}
            title="Meus enderecos"
            description="Endereco usado para entregas e corridas."
            onClick={() => navigate(appUrls.profile.addresses)}
          />
          <HubLinkCard
            icon={Shield}
            title="Privacidade"
            description="Visibilidade e exposicao"
            onClick={() => navigate(appUrls.profile.settings("privacy"))}
          />
          <HubLinkCard
            icon={Globe}
            title="Perfil publico"
            description="Ver versao publica"
            badge={publicHandle ? "Ativo" : "Indisponivel"}
            onClick={() => {
              if (!publicHandle) return;
              navigate(appUrls.profile.public(publicHandle));
            }}
          />
          <HubLinkCard
            icon={Settings2}
            title="Preferencias"
            description="Ajustes gerais da conta"
            onClick={() => navigate("/conta/preferencias")}
          />
          <HubLinkCard
            icon={Bell}
            title="Notificacoes"
            description="Preferencias de avisos"
            onClick={() => navigate(appUrls.notifications)}
          />
          <HubLinkCard
            icon={Users}
            title="Vinculos"
            description="Conexoes e relacoes"
            onClick={() => navigate(appUrls.profile.settings("links"))}
          />
          <HubLinkCard
            icon={Lock}
            title="Seguranca"
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

      <SectionFrame
        title="Endereco e verificacao residencial"
        description="Endereco pessoal fica no SSOT de residencia. Ele alimenta territorio, confianca e verificacao sem exposicao publica do endereco completo."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">Onde editar o endereco?</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Use Meus enderecos para atualizar residencia, territorio e comprovacao. A conta
              apenas resume e direciona para o local correto.
            </p>
            <button
              type="button"
              onClick={() => navigate(appUrls.profile.addresses)}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Editar residencia
            </button>
          </div>
          {profile ? (
            <ResidentVerificationCard
              profileId={profile.id}
              currentStatus={verificationStatus}
              rejectionReason={verificationRejectionReason}
            />
          ) : null}
        </div>
      </SectionFrame>

      {user && personalProfileId ? (
        <ContentTabsSection
          userId={user.id}
          profileId={personalProfileId}
          favorites={favorites}
          onPostClick={(id) => navigate(`${appUrls.community.feed}?post=${id}`)}
          onBusinessClick={handleBusinessClick}
          onExplore={() => navigate(appUrls.business.list)}
          onCreateService={() => navigate(appUrls.services.register)}
          onEditService={(id) => navigate(appUrls.services.edit(id))}
          onCreateClassified={() => navigate(appUrls.classifieds.new)}
          onEditClassified={(id) => navigate(appUrls.classifieds.edit(id))}
        />
      ) : null}

      {user && personalProfileId ? (
        <SectionFrame
          title="Atividade recente"
          description="Linha do tempo das suas acoes pessoais."
        >
          <ActivityTimeline
            userId={user.id}
            profileId={personalProfileId}
            onPostClick={(id) => navigate(`${appUrls.community.feed}?post=${id}`)}
          />
        </SectionFrame>
      ) : null}
    </div>
  );
}

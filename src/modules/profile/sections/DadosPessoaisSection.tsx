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
  const publicHandle = profile?.username || profile?.handle || "";

  return (
    <div className="space-y-6">
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

      {(stats.reportsCount || stats.supportsCount) ? (
        <CivicEngagementCard
          reportsCount={stats.reportsCount || 0}
          supportsCount={stats.supportsCount || 0}
          engagementScore={(stats.reportsCount || 0) + (stats.supportsCount || 0)}
        />
      ) : null}

      <SectionFrame
        title="Ações da conta"
        description="Gerencie identidade, endereço pessoal, privacidade e preferências sem misturar operação da Central."
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
            icon={MapPin}
            title="Meus endereços"
            description="Endereço usado para entregas/corridas."
            onClick={() => navigate(appUrls.profile.addresses)}
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
            badge={publicHandle ? "Ativo" : "Indisponível"}
            onClick={() => {
              if (!publicHandle) return;
              navigate(appUrls.profile.public(publicHandle));
            }}
          />
          <HubLinkCard
            icon={Settings2}
            title="Preferências"
            description="Ajustes gerais da conta"
            onClick={() => navigate("/conta/preferencias")}
          />
          <HubLinkCard
            icon={Bell}
            title="Notificações"
            description="Preferências de avisos"
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

      <SectionFrame
        title="Endereço e verificação residencial"
        description="Endereço pessoal fica no SSOT de residência. Ele alimenta território, confiança e verificação sem exposição pública do endereço completo."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">Onde editar o endereço?</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Use Meus endereços para atualizar residência, território e comprovação. A conta
              apenas resume e direciona para o local correto.
            </p>
            <button
              type="button"
              onClick={() => navigate(appUrls.profile.addresses)}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Editar residência
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
          description="Linha do tempo das suas ações pessoais."
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

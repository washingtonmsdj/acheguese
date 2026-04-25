/**
 * DadosPessoaisSection - Seção de dados pessoais do perfil
 * 
 * SSOT: Componente isolado com props tipadas
 * Sem gambiarras: Lógica clara e organizada
 */

import {
  BarChart3,
  Bell,
  Bookmark,
  Database,
  Globe,
  Lock,
  Settings2,
  Shield,
  UserRound,
  Users,
} from "lucide-react";

import {
  SectionFrame,
  HubLinkCard,
  ProfileStats,
  ContentTabsSection,
} from "@/modules/profile/components/hub";
import { ResidentVerificationCard } from "@/modules/profile/components/ResidentVerificationCard";
import { ReputationLevelCard } from "@/modules/profile/components/ReputationLevelCard";
import { GamificationCard } from "@/modules/profile/components/GamificationCard";
import { CivicEngagementCard } from "@/modules/profile/components/CivicEngagementCard";
import { ActivityTimeline } from "@/modules/profile/components/ActivityTimeline";

import type { DadosPessoaisSectionProps } from "./types";

export function DadosPessoaisSection({
  user,
  personalProfile,
  personalProfileId,
  profile,
  identity,
  context,
  stats,
  operations,
  isVerified,
  verificationStatus,
  verificationRejectionReason,
  favorites,
  setActiveSection,
  navigate,
  appUrls,
  moduleUrls,
  handleBusinessClick,
}: DadosPessoaisSectionProps) {
  return (
    <div className="space-y-6">
      {/* Estatísticas Pessoais */}
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

      {/* Completude e Verificação */}
      <div className="grid gap-6 lg:grid-cols-2">
        {profile ? (
          <ResidentVerificationCard
            profileId={profile.id}
            currentStatus={verificationStatus}
            rejectionReason={verificationRejectionReason}
          />
        ) : null}
      </div>

      {/* Reputação e Gamificação */}
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

      {/* Engajamento Cívico */}
      {(stats.reportsCount || stats.supportsCount) ? (
        <CivicEngagementCard
          reportsCount={stats.reportsCount || 0}
          supportsCount={stats.supportsCount || 0}
          onViewReports={() => navigate("/relatos")}
          onViewSupports={() => navigate("/apoios")}
        />
      ) : null}

      {/* Ações Principais */}
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
            badge={profile ? "Ativo" : "Indisponível"}
            onClick={() => {
              if (!profile) return;
              navigate(appUrls.profile.public(profile.username || ""));
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

      {/* Conteúdo Pessoal */}
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

      {/* Atividade Recente */}
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

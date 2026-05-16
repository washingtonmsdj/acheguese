import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { portalNordesteMock, nordesteAgents } from "../mocks";
import { communicationTerritorialGateway } from "../../services";

// Dashboard Sections
import { DashboardHeader } from "../agent-dashboard/sections/DashboardHeader";
import { DashboardOverview } from "../agent-dashboard/sections/DashboardOverview";
import { DashboardQuickActions } from "../agent-dashboard/sections/DashboardQuickActions";
import { DashboardPublications } from "../agent-dashboard/sections/DashboardPublications";
import { DashboardDrafts } from "../agent-dashboard/sections/DashboardDrafts";
import { DashboardAnalytics } from "../agent-dashboard/sections/DashboardAnalytics";
import { DashboardTerritories } from "../agent-dashboard/sections/DashboardTerritories";
import { DashboardSchedule } from "../agent-dashboard/sections/DashboardSchedule";
import { DashboardTeam } from "../agent-dashboard/sections/DashboardTeam";

// Sidebar Widgets
import { DashboardSidebarStats } from "../agent-dashboard/sidebar/DashboardSidebarStats";
import { DashboardSidebarActivity } from "../agent-dashboard/sidebar/DashboardSidebarActivity";
import { DashboardSidebarQuickLinks } from "../agent-dashboard/sidebar/DashboardSidebarQuickLinks";
import { DashboardSidebarHelp } from "../agent-dashboard/sidebar/DashboardSidebarHelp";

/**
 * CommunicationAgentDashboardV2
 * 
 * Dashboard premium para gestores de agentes de comunicação territorial.
 * 
 * Conceito: Central de comando editorial completa, profissional e escalável.
 * 
 * Sensação: Dashboard de mídia profissional + CMS moderno + Analytics integrado.
 * 
 * Funcionalidades:
 * - Visão geral com métricas principais
 * - Gestão de publicações (criar, editar, agendar)
 * - Rascunhos e workflow editorial
 * - Analytics e insights territoriais
 * - Gestão de territórios autorizados
 * - Calendário editorial
 * - Gestão de equipe
 * - Ações rápidas
 * 
 * Arquitetura preparada para:
 * - Editor rico (WYSIWYG)
 * - Biblioteca de mídia
 * - Agendamento avançado
 * - Aprovação multi-nível
 * - Versionamento de conteúdo
 * - Integração com redes sociais
 * - Monetização
 * - White-label
 */
export default function CommunicationAgentDashboardV2() {
  const { channelSlug } = useParams<{ channelSlug: string }>();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"overview" | "publications" | "drafts" | "analytics" | "territories" | "schedule" | "team">("overview");

  // Buscar canais gerenciados pelo usuário
  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ["communication-dashboard-v2", "channels"],
    queryFn: async () => {
      // Tentar buscar canais reais primeiro
      const realChannels = await communicationTerritorialGateway.listManagedChannels();
      
      // Se não houver canais reais, usar mocks para desenvolvimento
      if (!realChannels || realChannels.length === 0) {
        // Converter agentes mockados para formato de canal
        return nordesteAgents.map(agent => ({
          id: agent.id,
          name: agent.name,
          slug: agent.id, // Usar ID como slug
          type: agent.type,
          territory: agent.territory,
          verified: agent.verified,
          followers: agent.followers,
          avatar: agent.avatar,
          description: agent.description,
          socialLinks: agent.socialLinks,
        }));
      }
      
      return realChannels;
    },
  });

  // Buscar dados do canal selecionado
  const { data: channelData, isLoading: channelLoading } = useQuery({
    queryKey: ["communication-dashboard-v2", "channel", selectedChannelId],
    queryFn: () => {
      if (!selectedChannelId) return null;
      const channel = channels?.find(c => c.id === selectedChannelId);
      if (!channel) return null;
      return communicationTerritorialGateway.getChannelPublicPage(channel.slug);
    },
    enabled: !!selectedChannelId && !!channels,
  });

  // Buscar territórios autorizados
  const { data: territories } = useQuery({
    queryKey: ["communication-dashboard-v2", "territories", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return [];
      
      // Tentar buscar territórios reais primeiro
      const realTerritories = await communicationTerritorialGateway.listAuthorizedTerritories(selectedChannelId);
      
      // Se não houver territórios reais, usar mocks
      if (!realTerritories || realTerritories.length === 0) {
        // Retornar áreas de cobertura como territórios
        return portalNordesteMock.coverageAreas.map(area => ({
          id: area.id,
          name: area.name,
          type: area.type,
          description: area.description,
        }));
      }
      
      return realTerritories;
    },
    enabled: !!selectedChannelId,
  });

  // Buscar publicações
  const { data: publications } = useQuery({
    queryKey: ["communication-dashboard-v2", "publications", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return [];
      
      // Tentar buscar publicações reais primeiro
      const realPubs = await communicationTerritorialGateway.listPublications({
        channelId: selectedChannelId,
        status: "published",
        limit: 50,
      });
      
      // Se não houver publicações reais, usar mocks
      if (!realPubs || realPubs.length === 0) {
        // Filtrar publicações do agente selecionado
        return portalNordesteMock.allPublications
          .filter(pub => pub.author.id === selectedChannelId)
          .map(pub => ({
            ...pub,
            status: "published",
            channelId: selectedChannelId,
          }));
      }
      
      return realPubs;
    },
    enabled: !!selectedChannelId,
  });

  // Buscar rascunhos
  const { data: drafts } = useQuery({
    queryKey: ["communication-dashboard-v2", "drafts", selectedChannelId],
    queryFn: () => communicationTerritorialGateway.listPublications({
      channelId: selectedChannelId!,
      status: "draft",
      limit: 20,
    }),
    enabled: !!selectedChannelId,
  });

  const selectedChannel = channels?.find(c => c.id === selectedChannelId);
  const isLoading = channelsLoading || channelLoading;

  useEffect(() => {
    if (!channels || channels.length === 0) return;

    if (!selectedChannelId && channelSlug) {
      const matchedChannel = channels.find((channel) => channel.slug === channelSlug);
      if (matchedChannel) {
        setSelectedChannelId(matchedChannel.id);
        return;
      }
    }

    const selectedStillExists = selectedChannelId
      ? channels.some((channel) => channel.id === selectedChannelId)
      : false;

    if (!selectedStillExists) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, channelSlug, selectedChannelId]);

  return (
    <>
      <Helmet>
        <title>Dashboard | Gestão de Comunicação Territorial | Achegue-se</title>
        <meta 
          name="description" 
          content="Dashboard completo para gestão de canais de comunicação territorial" 
        />
      </Helmet>

      <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-background via-background to-muted/30">
        
        {/* Header */}
        <DashboardHeader 
          channels={channels ?? []}
          selectedChannelId={selectedChannelId}
          onChannelSelect={setSelectedChannelId}
          isLoading={channelsLoading}
        />

        {/* No Channels State */}
        {!channelsLoading && (!channels || channels.length === 0) && (
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-foreground">Nenhum canal encontrado</h1>
                <p className="text-lg text-muted-foreground">
                  Você ainda não gerencia nenhum canal de comunicação territorial.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a 
                  href="/comunicacao/solicitar" 
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Solicitar Novo Canal
                </a>
                <a 
                  href="/comunicacao" 
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border bg-background font-medium hover:bg-accent transition-colors"
                >
                  Explorar Comunicação
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && selectedChannelId && (
          <div className="container mx-auto px-4 py-20">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Carregando dashboard...</h2>
                <p className="text-sm text-muted-foreground">Preparando dados do canal</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard */}
        {!isLoading && selectedChannel && (
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
            
            {/* Quick Actions Bar */}
            <DashboardQuickActions 
              channel={selectedChannel}
              activeView={activeView}
              onViewChange={setActiveView}
            />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-6">
              
              {/* Main Content */}
              <main className="lg:col-span-8 space-y-6">
                
                {/* Overview */}
                {activeView === "overview" && (
                  <>
                    <DashboardOverview 
                      channel={selectedChannel}
                      publications={publications ?? []}
                      territories={territories ?? []}
                      drafts={drafts ?? []}
                    />
                    
                    <DashboardAnalytics 
                      channel={selectedChannel}
                      publications={publications ?? []}
                    />
                  </>
                )}

                {/* Publications */}
                {activeView === "publications" && (
                  <DashboardPublications 
                    channel={selectedChannel}
                    publications={publications ?? []}
                    territories={territories ?? []}
                  />
                )}

                {/* Drafts */}
                {activeView === "drafts" && (
                  <DashboardDrafts 
                    channel={selectedChannel}
                    drafts={drafts ?? []}
                    territories={territories ?? []}
                  />
                )}

                {/* Analytics */}
                {activeView === "analytics" && (
                  <DashboardAnalytics 
                    channel={selectedChannel}
                    publications={publications ?? []}
                  />
                )}

                {/* Territories */}
                {activeView === "territories" && (
                  <DashboardTerritories 
                    channel={selectedChannel}
                    territories={territories ?? []}
                  />
                )}

                {/* Schedule */}
                {activeView === "schedule" && (
                  <DashboardSchedule 
                    channel={selectedChannel}
                    publications={publications ?? []}
                  />
                )}

                {/* Team */}
                {activeView === "team" && (
                  <DashboardTeam 
                    channel={selectedChannel}
                  />
                )}

              </main>

              {/* Sidebar */}
              <aside className="lg:col-span-4 space-y-6">
                <div className="lg:sticky lg:top-6 space-y-6">
                  
                  {/* Stats Widget */}
                  <DashboardSidebarStats 
                    channel={selectedChannel}
                    publications={publications ?? []}
                    territories={territories ?? []}
                  />

                  {/* Activity Widget */}
                  <DashboardSidebarActivity 
                    channel={selectedChannel}
                  />

                  {/* Quick Links */}
                  <DashboardSidebarQuickLinks 
                    channel={selectedChannel}
                  />

                  {/* Help Widget */}
                  <DashboardSidebarHelp />

                </div>
              </aside>

            </div>
          </div>
        )}

        {/* Selection fallback state */}
        {!isLoading && channels && channels.length > 0 && !selectedChannel && (
          <div className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6 text-center">
              <h2 className="text-xl font-semibold text-foreground">Canal indisponivel</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Nao foi possivel abrir este canal. Selecione outro canal no topo para continuar.
              </p>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
